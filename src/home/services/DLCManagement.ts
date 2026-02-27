import { getFilteredEntries, getWorldBookName, updateWorldBook } from './worldbookload&update';

// ========================
// 类型定义
// ========================

/** DLC 类别 */
export type DLCCategory = '角色' | '事件' | '扩展';

/** 单个世界书条目 */
export interface DLCEntry {
  name: string;
  enabled: boolean;
}

/** 分组后的 DLC 选项（统一模型） */
export interface DLCOption {
  /** 唯一标识，如 "[DLC][角色][薇薇拉]" */
  groupKey: string;
  /** DLC 类别 */
  category: DLCCategory;
  /** 显示名称，如 "薇薇拉" */
  label: string;
  /** 作者 */
  author: string;
  /** 其他信息 */
  info: string;
  /** 互斥目标数组 - [!xxx] 格式，开启时关闭包含 [xxx] 的 DLC */
  exclusionTargets: string[];
  /** 替换目标数组 - [>xxx] 格式，开启时禁用包含 [xxx] 的条目，关闭时恢复 */
  replacementTargets: string[];
  /** 前置需求数组 - [<xxx] 格式，需要 [xxx] DLC 处于开启状态 */
  prerequisiteTargets: string[];
  /** 该 DLC 下的所有条目 */
  entries: DLCEntry[];
  /** 是否启用（所有条目启用时为 true） */
  enabled: boolean;
}

/** 切换 DLC 的结果 */
export interface ToggleDLCResult {
  selections: Map<string, boolean>;
  success: boolean;
  error?: string;
  missingPrerequisites?: string[];
}

// ========================
// 初始状态
// ========================

export const initialDLCState = {
  dlcOptions: [] as DLCOption[],
  localSelections: new Map<string, boolean>(),
};

// ========================
// 正则模式
// ========================

/** 匹配所有 DLC 条目 */
const DLC_PATTERN = /^\[DLC\]/;

/** 提取 groupKey: [DLC][类别][名称] */
const DLC_GROUP_KEY_PATTERN = /^(\[DLC\]\[[^\]]+\]\[[^\]]+\])/;

/** 提取类别（第二个方括号内容） */
const DLC_CATEGORY_PATTERN = /^\[DLC\]\[([^\]]+)\]/;

/** 提取显示名称（第三个方括号内容） */
const DLC_LABEL_PATTERN = /^\[DLC\]\[[^\]]+\]\[([^\]]+)\]/;

/** 互斥目标 [!xxx] */
const EXCLUSION_PATTERN = /\[!([^\]]+)\]/g;

/** 替换目标 [>xxx] */
const REPLACEMENT_PATTERN = /\[>([^\]]+)\]/g;

/** 前置需求 [<xxx] */
const PREREQUISITE_PATTERN = /\[<([^\]]+)\]/g;

/** 作者信息 - 匹配最后一个 "(xxx)" */
const AUTHOR_PATTERN = /\(([^)]+)\)(?=[^()]*$)/;

// ========================
// 工具函数
// ========================

/**
 * 按拼音首字母排序比较函数
 */
function pinyinCompare(a: string, b: string): number {
  return a.localeCompare(b, 'zh-CN', { sensitivity: 'base' });
}

/**
 * 对 DLC 选项进行排序（按 label 的拼音首字母排序）
 */
export function sortDLCOptions(options: DLCOption[]): DLCOption[] {
  return [...options].sort((a, b) => pinyinCompare(a.label, b.label));
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ========================
// 解析函数
// ========================

/**
 * 从条目名称中提取 groupKey
 * @param entryName 如 "[DLC][角色][薇薇拉][!xxx]薇薇拉-本体(K1nn)"
 * @returns 如 "[DLC][角色][薇薇拉]"，不匹配则返回 null
 */
function extractGroupKey(entryName: string): string | null {
  const match = entryName.match(DLC_GROUP_KEY_PATTERN);
  return match ? match[1] : null;
}

/**
 * 从 groupKey 中提取类别
 * @param groupKey 如 "[DLC][角色][薇薇拉]"
 * @returns 如 "角色"
 */
function extractCategory(groupKey: string): DLCCategory | null {
  const match = groupKey.match(DLC_CATEGORY_PATTERN);
  if (!match) return null;
  const cat = match[1];
  if (cat === '角色' || cat === '事件' || cat === '扩展') {
    return cat;
  }
  return null;
}

/**
 * 从 groupKey 中提取显示名称
 * @param groupKey 如 "[DLC][角色][薇薇拉]"
 * @returns 如 "薇薇拉"
 */
function extractLabel(groupKey: string): string {
  const match = groupKey.match(DLC_LABEL_PATTERN);
  return match ? match[1] : groupKey;
}

/**
 * 使用正则全局匹配提取目标数组
 */
function extractTargetsWithPattern(text: string, pattern: RegExp): string[] {
  const targets: string[] = [];
  const regex = new RegExp(pattern.source, 'g');
  let match;
  while ((match = regex.exec(text)) !== null) {
    targets.push(match[1]);
  }
  return targets;
}

/**
 * 从条目数组中合并提取所有目标（去重）
 */
function extractMergedTargets(entries: DLCEntry[], pattern: RegExp): string[] {
  const allTargets = new Set<string>();
  for (const entry of entries) {
    const targets = extractTargetsWithPattern(entry.name, pattern);
    targets.forEach(t => allTargets.add(t));
  }
  return Array.from(allTargets);
}

/**
 * 从条目数组中提取作者和信息
 * @param entries DLC 下的所有条目
 * @returns { author, info }
 */
function extractAuthorInfo(entries: DLCEntry[]): { author: string; info: string } {
  for (const entry of entries) {
    const match = entry.name.match(AUTHOR_PATTERN);
    if (match) {
      const authorInfo = match[1].trim();
      const dashIndex = authorInfo.indexOf('-');
      if (dashIndex > 0) {
        return {
          author: authorInfo.substring(0, dashIndex).trim(),
          info: authorInfo.substring(dashIndex + 1).trim(),
        };
      }
      return { author: authorInfo, info: '' };
    }
  }
  return { author: '', info: '' };
}

// ========================
// 加载
// ========================

/**
 * 加载所有 DLC 选项
 */
export async function loadDLCOptions(): Promise<{
  dlcOptions: DLCOption[];
  localSelections: Map<string, boolean>;
  bookName: string | null;
}> {
  const bookName = getWorldBookName();
  const entries = await getFilteredEntries(DLC_PATTERN, bookName);

  // 按 groupKey 分组条目
  const groups = new Map<string, DLCEntry[]>();

  for (const entry of entries as { name: string; enabled: boolean }[]) {
    const groupKey = extractGroupKey(entry.name);
    if (!groupKey) continue;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push({
      name: entry.name,
      enabled: entry.enabled,
    });
  }

  // 构建 DLC 选项列表
  const dlcOptions: DLCOption[] = [];
  for (const [groupKey, groupEntries] of groups) {
    const category = extractCategory(groupKey);
    if (!category) continue;

    const allEnabled = groupEntries.every(e => e.enabled);
    const { author, info } = extractAuthorInfo(groupEntries);

    dlcOptions.push({
      groupKey,
      category,
      label: extractLabel(groupKey),
      author,
      info,
      exclusionTargets: extractMergedTargets(groupEntries, EXCLUSION_PATTERN),
      replacementTargets: extractMergedTargets(groupEntries, REPLACEMENT_PATTERN),
      prerequisiteTargets: extractMergedTargets(groupEntries, PREREQUISITE_PATTERN),
      entries: groupEntries,
      enabled: allEnabled,
    });
  }

  // 排序
  const sortedOptions = sortDLCOptions(dlcOptions);

  // 初始化本地选择列表
  const localSelections = new Map(sortedOptions.map(opt => [opt.groupKey, opt.enabled]));

  return { dlcOptions: sortedOptions, localSelections, bookName };
}

// ========================
// 切换
// ========================

/**
 * 检查前置需求是否满足（跨类别查找）
 */
function checkPrerequisites(
  dlcOptions: DLCOption[],
  localSelections: Map<string, boolean>,
  prerequisiteTargets: string[],
): { satisfied: boolean; missingPrerequisites: string[] } {
  const missingPrerequisites: string[] = [];

  for (const target of prerequisiteTargets) {
    // 跨所有类别查找包含 [target] 的 DLC
    const prerequisiteDLC = dlcOptions.find(opt => opt.groupKey.includes(`[${target}]`));
    if (prerequisiteDLC) {
      const isEnabled = localSelections.get(prerequisiteDLC.groupKey) ?? false;
      if (!isEnabled) {
        missingPrerequisites.push(target);
      }
    } else {
      missingPrerequisites.push(target);
    }
  }

  return {
    satisfied: missingPrerequisites.length === 0,
    missingPrerequisites,
  };
}

/**
 * 切换 DLC 启用状态（统一处理所有类别的互斥/前置/级联逻辑）
 *
 * 处理三种关系（跨类别生效）：
 * 1. 互斥 [!xxx]：开启时关闭包含 [xxx] 的 DLC
 * 2. 替换 [>xxx]：开启时关闭包含 [xxx] 的条目（保存时处理）
 * 3. 前置需求 [<xxx]：开启时检查 [xxx] DLC 是否已开启
 */
export function toggleDLC(
  localSelections: Map<string, boolean>,
  dlcOptions: DLCOption[],
  groupKey: string,
): ToggleDLCResult {
  const newSelections = new Map(localSelections);
  const currentEnabled = newSelections.get(groupKey) ?? false;
  const newEnabled = !currentEnabled;

  const targetDLC = dlcOptions.find(opt => opt.groupKey === groupKey);

  // 启用时检查前置需求
  if (newEnabled && targetDLC) {
    if (targetDLC.prerequisiteTargets.length > 0) {
      const { satisfied, missingPrerequisites } = checkPrerequisites(
        dlcOptions,
        newSelections,
        targetDLC.prerequisiteTargets,
      );

      if (!satisfied) {
        return {
          selections: localSelections,
          success: false,
          error: `缺少前置需求: ${missingPrerequisites.join(', ')}`,
          missingPrerequisites,
        };
      }
    }
  }

  newSelections.set(groupKey, newEnabled);

  // 启用时处理互斥逻辑（跨类别）
  if (newEnabled && targetDLC) {
    for (const exclusionTarget of targetDLC.exclusionTargets) {
      for (const opt of dlcOptions) {
        if (
          opt.groupKey !== groupKey &&
          (opt.label === exclusionTarget || opt.groupKey.includes(`[${exclusionTarget}]`))
        ) {
          newSelections.set(opt.groupKey, false);
        }
      }
    }
  }

  // 禁用时级联禁用依赖此 DLC 的其他 DLC（跨类别）
  if (!newEnabled && targetDLC) {
    for (const opt of dlcOptions) {
      if (opt.groupKey !== groupKey) {
        const isEnabled = newSelections.get(opt.groupKey) ?? false;
        if (isEnabled && opt.prerequisiteTargets.includes(targetDLC.label)) {
          newSelections.set(opt.groupKey, false);
        }
      }
    }
  }

  return {
    selections: newSelections,
    success: true,
  };
}

// ========================
// 变更检测
// ========================

/**
 * 检查本地选择是否与原始状态有变化
 */
export function hasDLCChanges(
  dlcOptions: DLCOption[],
  localSelections: Map<string, boolean>,
): boolean {
  for (const opt of dlcOptions) {
    const localEnabled = localSelections.get(opt.groupKey) ?? false;
    if (localEnabled !== opt.enabled) {
      return true;
    }
  }
  return false;
}

// ========================
// 保存
// ========================

/**
 * 收集所有被启用 DLC 的互斥目标
 */
function collectExclusionTargetsToDisable(
  dlcOptions: DLCOption[],
  localSelections: Map<string, boolean>,
): string[] {
  const targets: string[] = [];
  for (const opt of dlcOptions) {
    const isEnabled = localSelections.get(opt.groupKey) ?? false;
    if (isEnabled && opt.exclusionTargets.length > 0) {
      targets.push(...opt.exclusionTargets);
    }
  }
  return [...new Set(targets)];
}

/**
 * 收集所有被启用 DLC 的替换目标
 */
function collectReplacementTargetsToDisable(
  dlcOptions: DLCOption[],
  localSelections: Map<string, boolean>,
): string[] {
  const targets: string[] = [];
  for (const opt of dlcOptions) {
    const isEnabled = localSelections.get(opt.groupKey) ?? false;
    if (isEnabled && opt.replacementTargets.length > 0) {
      targets.push(...opt.replacementTargets);
    }
  }
  return [...new Set(targets)];
}

/**
 * 收集所有从启用变为禁用的 DLC 的替换目标（需要恢复启用）
 */
function collectReplacementTargetsToEnable(
  dlcOptions: DLCOption[],
  localSelections: Map<string, boolean>,
  originalStates: Map<string, boolean>,
): string[] {
  const targets: string[] = [];
  for (const opt of dlcOptions) {
    const isEnabled = localSelections.get(opt.groupKey) ?? false;
    const wasEnabled = originalStates.get(opt.groupKey) ?? false;
    if (!isEnabled && wasEnabled && opt.replacementTargets.length > 0) {
      targets.push(...opt.replacementTargets);
    }
  }
  return [...new Set(targets)];
}

/**
 * 保存 DLC 选择到世界书（统一保存，一次 updateWorldBook 调用）
 * @returns 更新后的 DLC 选项列表
 */
export async function saveDLCChanges(
  dlcOptions: DLCOption[],
  localSelections: Map<string, boolean>,
  bookName: string,
): Promise<DLCOption[]> {
  if (!hasDLCChanges(dlcOptions, localSelections)) {
    return dlcOptions;
  }

  // 构建原始状态映射
  const originalStates = new Map(dlcOptions.map(opt => [opt.groupKey, opt.enabled]));

  // 构建更新列表：将每个 DLC 的所有条目设置为相同的启用状态
  const updatedEntries: Array<{ name: string; enabled: boolean }> = [];

  for (const opt of dlcOptions) {
    const newEnabled = localSelections.get(opt.groupKey) ?? false;
    for (const entry of opt.entries) {
      updatedEntries.push({
        name: entry.name,
        enabled: newEnabled,
      });
    }
  }

  // 收集互斥目标（需要禁用）
  const exclusionTargetsToDisable = collectExclusionTargetsToDisable(dlcOptions, localSelections);

  // 收集替换目标（需要禁用）
  const replacementTargetsToDisable = collectReplacementTargetsToDisable(
    dlcOptions,
    localSelections,
  );

  // 收集替换目标（需要恢复启用）
  const replacementTargetsToEnable = collectReplacementTargetsToEnable(
    dlcOptions,
    localSelections,
    originalStates,
  );

  // 从需要启用的替换目标中排除需要禁用的目标（禁用优先级更高）
  const filteredReplacementTargetsToEnable = replacementTargetsToEnable.filter(
    target =>
      !replacementTargetsToDisable.includes(target) && !exclusionTargetsToDisable.includes(target),
  );

  // 处理互斥逻辑：禁用包含 [互斥目标] 的条目
  if (exclusionTargetsToDisable.length > 0) {
    for (const target of exclusionTargetsToDisable) {
      const pattern = new RegExp(`\\[${escapeRegExp(target)}\\]`);
      const matchingEntries = await getFilteredEntries(pattern, bookName);

      for (const entry of matchingEntries as { name: string; enabled: boolean }[]) {
        const existingIndex = updatedEntries.findIndex(e => e.name === entry.name);
        if (existingIndex === -1) {
          updatedEntries.push({ name: entry.name, enabled: false });
        } else {
          updatedEntries[existingIndex].enabled = false;
        }
      }
    }
  }

  // 处理替换逻辑（禁用）：禁用包含 [替换目标] 的条目
  if (replacementTargetsToDisable.length > 0) {
    for (const target of replacementTargetsToDisable) {
      const pattern = new RegExp(`\\[${escapeRegExp(target)}\\]`);
      const matchingEntries = await getFilteredEntries(pattern, bookName);

      for (const entry of matchingEntries as { name: string; enabled: boolean }[]) {
        const existingIndex = updatedEntries.findIndex(e => e.name === entry.name);
        if (existingIndex === -1) {
          updatedEntries.push({ name: entry.name, enabled: false });
        } else {
          updatedEntries[existingIndex].enabled = false;
        }
      }
    }
  }

  // 处理替换逻辑（恢复启用）：启用包含 [替换目标] 的条目
  if (filteredReplacementTargetsToEnable.length > 0) {
    for (const target of filteredReplacementTargetsToEnable) {
      const pattern = new RegExp(`\\[${escapeRegExp(target)}\\]`);
      const matchingEntries = await getFilteredEntries(pattern, bookName);

      for (const entry of matchingEntries as { name: string; enabled: boolean }[]) {
        const existingIndex = updatedEntries.findIndex(e => e.name === entry.name);
        if (existingIndex === -1) {
          updatedEntries.push({ name: entry.name, enabled: true });
        } else if (updatedEntries[existingIndex].enabled !== false) {
          // 禁用优先级更高，不覆盖已禁用的条目
          updatedEntries[existingIndex].enabled = true;
        }
      }
    }
  }

  await updateWorldBook(updatedEntries, bookName);

  // 返回更新后的 DLC 选项列表
  return dlcOptions.map(opt => {
    const newEnabled = localSelections.get(opt.groupKey) ?? false;
    return {
      ...opt,
      enabled: newEnabled,
      entries: opt.entries.map(entry => ({
        ...entry,
        enabled: newEnabled,
      })),
    };
  });
}
