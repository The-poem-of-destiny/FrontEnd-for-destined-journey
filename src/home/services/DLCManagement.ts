import { getFilteredEntries, getWorldBookName, updateWorldBook } from './worldbookload&update';

// ========================
// 统一 DLC 类型定义
// ========================

/** DLC 类别 */
export type DLCCategory = '角色' | '事件' | '扩展';

/** DLC 条目（单个世界书条目） */
export interface DLCEntry {
  name: string;
  enabled: boolean;
}

/** DLC 选项（分组后的 DLC 项） */
export interface DLCOption {
  dlcKey: string; // 分组Key，如 "[DLC][角色][薇薇拉]"
  category: DLCCategory; // 类别
  label: string; // 显示名称，如 "薇薇拉"
  author: string; // 作者
  info: string; // 附加信息
  exclusionTargets: string[]; // 互斥目标 [!xxx]
  replacementTargets: string[]; // 替换目标 [>xxx]
  prerequisiteTargets: string[]; // 前置需求 [<xxx]
  entries: DLCEntry[]; // 该 DLC 下的所有条目
  enabled: boolean; // 是否启用（所有条目启用时为 true）
}

/** 切换 DLC 的结果 */
export interface ToggleDLCResult {
  selections: Map<string, boolean>;
  success: boolean;
  error?: string;
  missingPrerequisites?: string[];
}

/** DLC 状态初始值 */
export const initialDLCState = {
  dlcOptions: [] as DLCOption[],
  localSelections: new Map<string, boolean>(),
};

// ========================
// 正则表达式
// ========================

/** 匹配所有 DLC 条目 - 以 [DLC] 开头 */
const DLC_PATTERN = /^\[DLC\]/;

/** 提取类别 - [DLC][角色|事件|扩展] */
const DLC_CATEGORY_PATTERN = /^\[DLC\]\[(角色|事件|扩展)\]/;

/** 提取分组Key - [DLC][类别][名称]（不含关系标记） */
const DLC_KEY_PATTERN = /^(\[DLC\]\[(?:角色|事件|扩展)\]\[[^\]]+\])/;

/** 提取显示名称 - [DLC][类别][名称] 中的名称 */
const DLC_LABEL_PATTERN = /^\[DLC\]\[(?:角色|事件|扩展)\]\[([^\]]+)\]/;

/** 互斥目标 [!xxx] */
const EXCLUSION_PATTERN = /\[!([^\]]+)\]/g;

/** 替换目标 [>xxx] */
const REPLACEMENT_PATTERN = /\[>([^\]]+)\]/g;

/** 前置需求 [<xxx] */
const PREREQUISITE_PATTERN = /\[<([^\]]+)\]/g;

/** 作者信息 - 最后一个括号 */
const AUTHOR_PATTERN = /\(([^)]+)\)(?=[^()]*$)/;

// ========================
// 排序
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

// ========================
// 解析函数
// ========================

/**
 * 从条目名称中提取分组 Key
 * @param entryName 如 "[DLC][角色][薇薇拉]薇薇拉-本体(Author)"
 * @returns 如 "[DLC][角色][薇薇拉]"，不匹配则返回 null
 */
function extractDLCKey(entryName: string): string | null {
  const match = entryName.match(DLC_KEY_PATTERN);
  return match ? match[1] : null;
}

/**
 * 从条目名称中提取类别
 * @param entryName 如 "[DLC][角色][薇薇拉]..."
 * @returns 如 "角色"，不匹配则返回 null
 */
function extractDLCCategory(entryName: string): DLCCategory | null {
  const match = entryName.match(DLC_CATEGORY_PATTERN);
  return match ? (match[1] as DLCCategory) : null;
}

/**
 * 从分组 Key 中提取显示名称
 * @param dlcKey 如 "[DLC][角色][薇薇拉]"
 * @returns 如 "薇薇拉"
 */
function extractDLCLabel(dlcKey: string): string {
  const match = dlcKey.match(DLC_LABEL_PATTERN);
  return match ? match[1] : dlcKey;
}

/**
 * 从条目名称中提取指定模式的所有目标（通用提取器）
 */
function extractTargetsFromEntry(entryName: string, pattern: RegExp): string[] {
  const targets: string[] = [];
  const regex = new RegExp(pattern.source, 'g');
  let match;
  while ((match = regex.exec(entryName)) !== null) {
    targets.push(match[1]);
  }
  return targets;
}

/**
 * 从条目数组中提取所有目标并去重（通用合并器）
 */
function extractTargetsFromEntries(entries: DLCEntry[], pattern: RegExp): string[] {
  const allTargets = new Set<string>();
  for (const entry of entries) {
    for (const target of extractTargetsFromEntry(entry.name, pattern)) {
      allTargets.add(target);
    }
  }
  return Array.from(allTargets);
}

/**
 * 从条目数组中提取作者和附加信息
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

  // 按 dlcKey 分组条目
  const groups = new Map<string, DLCEntry[]>();
  const categoryMap = new Map<string, DLCCategory>();

  for (const entry of entries as { name: string; enabled: boolean }[]) {
    const dlcKey = extractDLCKey(entry.name);
    if (!dlcKey) continue;

    const category = extractDLCCategory(entry.name);
    if (!category) continue;

    if (!groups.has(dlcKey)) {
      groups.set(dlcKey, []);
      categoryMap.set(dlcKey, category);
    }
    groups.get(dlcKey)!.push({
      name: entry.name,
      enabled: entry.enabled,
    });
  }

  // 构建 DLC 选项列表
  const dlcOptions: DLCOption[] = [];
  for (const [dlcKey, groupEntries] of groups) {
    const allEnabled = groupEntries.every(e => e.enabled);
    const { author, info } = extractAuthorInfo(groupEntries);
    dlcOptions.push({
      dlcKey,
      category: categoryMap.get(dlcKey)!,
      label: extractDLCLabel(dlcKey),
      author,
      info,
      exclusionTargets: extractTargetsFromEntries(groupEntries, EXCLUSION_PATTERN),
      replacementTargets: extractTargetsFromEntries(groupEntries, REPLACEMENT_PATTERN),
      prerequisiteTargets: extractTargetsFromEntries(groupEntries, PREREQUISITE_PATTERN),
      entries: groupEntries,
      enabled: allEnabled,
    });
  }

  const sortedOptions = sortDLCOptions(dlcOptions);

  const localSelections = new Map(sortedOptions.map(dlc => [dlc.dlcKey, dlc.enabled]));

  return { dlcOptions: sortedOptions, localSelections, bookName };
}

// ========================
// 切换
// ========================

/**
 * 检查前置需求是否满足（跨类别）
 */
function checkPrerequisites(
  dlcOptions: DLCOption[],
  localSelections: Map<string, boolean>,
  prerequisiteTargets: string[],
): { satisfied: boolean; missingPrerequisites: string[] } {
  const missingPrerequisites: string[] = [];

  for (const target of prerequisiteTargets) {
    // 在所有 DLC 中查找包含 [target] 的项
    const prerequisiteDLC = dlcOptions.find(dlc => dlc.dlcKey.includes(`[${target}]`));
    if (prerequisiteDLC) {
      const isEnabled = localSelections.get(prerequisiteDLC.dlcKey) ?? false;
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
 * 切换 DLC 启用状态（跨类别关系处理）
 *
 * 处理三种关系：
 * 1. 互斥 [!xxx]：开启时关闭包含 [xxx] 的 DLC（跨类别）
 * 2. 替换 [>xxx]：开启时关闭包含 [xxx] 的条目（保存时处理）
 * 3. 前置需求 [<xxx]：开启时检查 [xxx] DLC 是否已开启（跨类别）
 */
export function toggleDLC(
  localSelections: Map<string, boolean>,
  dlcOptions: DLCOption[],
  dlcKey: string,
): ToggleDLCResult {
  const newSelections = new Map(localSelections);
  const currentEnabled = newSelections.get(dlcKey) ?? false;
  const newEnabled = !currentEnabled;

  const targetDLC = dlcOptions.find(dlc => dlc.dlcKey === dlcKey);

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

  newSelections.set(dlcKey, newEnabled);

  // 启用时处理互斥逻辑（跨类别）
  if (newEnabled && targetDLC) {
    for (const exclusionTarget of targetDLC.exclusionTargets) {
      for (const dlc of dlcOptions) {
        if (
          dlc.dlcKey !== dlcKey &&
          (dlc.label === exclusionTarget || dlc.dlcKey.includes(`[${exclusionTarget}]`))
        ) {
          newSelections.set(dlc.dlcKey, false);
        }
      }
    }
  }

  // 禁用时级联禁用依赖此 DLC 的其他 DLC（跨类别）
  if (!newEnabled && targetDLC) {
    for (const dlc of dlcOptions) {
      if (dlc.dlcKey !== dlcKey) {
        const isEnabled = newSelections.get(dlc.dlcKey) ?? false;
        if (isEnabled && dlc.prerequisiteTargets.includes(targetDLC.label)) {
          newSelections.set(dlc.dlcKey, false);
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
  for (const dlc of dlcOptions) {
    const localEnabled = localSelections.get(dlc.dlcKey) ?? false;
    if (localEnabled !== dlc.enabled) {
      return true;
    }
  }
  return false;
}

// ========================
// 保存
// ========================

/**
 * 收集所有被启用 DLC 的互斥目标（需要禁用的目标）
 */
function collectExclusionTargetsToDisable(
  dlcOptions: DLCOption[],
  localSelections: Map<string, boolean>,
): string[] {
  const targets: string[] = [];
  for (const dlc of dlcOptions) {
    const isEnabled = localSelections.get(dlc.dlcKey) ?? false;
    if (isEnabled && dlc.exclusionTargets.length > 0) {
      targets.push(...dlc.exclusionTargets);
    }
  }
  return [...new Set(targets)];
}

/**
 * 收集所有被启用 DLC 的替换目标（需要禁用的条目）
 */
function collectReplacementTargetsToDisable(
  dlcOptions: DLCOption[],
  localSelections: Map<string, boolean>,
): string[] {
  const targets: string[] = [];
  for (const dlc of dlcOptions) {
    const isEnabled = localSelections.get(dlc.dlcKey) ?? false;
    if (isEnabled && dlc.replacementTargets.length > 0) {
      targets.push(...dlc.replacementTargets);
    }
  }
  return [...new Set(targets)];
}

/**
 * 收集所有被禁用 DLC 的替换目标（需要恢复启用的条目）
 */
function collectReplacementTargetsToEnable(
  dlcOptions: DLCOption[],
  localSelections: Map<string, boolean>,
  originalStates: Map<string, boolean>,
): string[] {
  const targets: string[] = [];
  for (const dlc of dlcOptions) {
    const isEnabled = localSelections.get(dlc.dlcKey) ?? false;
    const wasEnabled = originalStates.get(dlc.dlcKey) ?? false;
    // 只有从启用变为禁用时才恢复替换目标
    if (!isEnabled && wasEnabled && dlc.replacementTargets.length > 0) {
      targets.push(...dlc.replacementTargets);
    }
  }
  return [...new Set(targets)];
}

/**
 * 辅助函数：转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 保存 DLC 选择到世界书
 * @param dlcOptions DLC 选项列表
 * @param localSelections 本地选择状态
 * @param bookName 世界书名称
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
  const originalStates = new Map(dlcOptions.map(dlc => [dlc.dlcKey, dlc.enabled]));

  // 构建更新列表：将每个 DLC 的所有条目设置为相同的启用状态
  const updatedEntries: Array<{ name: string; enabled: boolean }> = [];

  for (const dlc of dlcOptions) {
    const newEnabled = localSelections.get(dlc.dlcKey) ?? false;
    for (const entry of dlc.entries) {
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

  // 处理替换逻辑（恢复启用）
  if (filteredReplacementTargetsToEnable.length > 0) {
    for (const target of filteredReplacementTargetsToEnable) {
      const pattern = new RegExp(`\\[${escapeRegExp(target)}\\]`);
      const matchingEntries = await getFilteredEntries(pattern, bookName);

      for (const entry of matchingEntries as { name: string; enabled: boolean }[]) {
        const existingIndex = updatedEntries.findIndex(e => e.name === entry.name);
        if (existingIndex === -1) {
          updatedEntries.push({ name: entry.name, enabled: true });
        } else if (updatedEntries[existingIndex].enabled !== false) {
          updatedEntries[existingIndex].enabled = true;
        }
      }
    }
  }

  await updateWorldBook(updatedEntries, bookName);

  // 返回更新后的 DLC 选项列表
  return dlcOptions.map(dlc => {
    const newEnabled = localSelections.get(dlc.dlcKey) ?? false;
    return {
      ...dlc,
      enabled: newEnabled,
      entries: dlc.entries.map(entry => ({
        ...entry,
        enabled: newEnabled,
      })),
    };
  });
}
