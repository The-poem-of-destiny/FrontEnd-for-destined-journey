import JSON5 from 'json5';

import { getFilteredEntries, getWorldBookName, updateWorldBook } from './worldbookload&update';

// 未分类的默认tab名称
export const UNCATEGORIZED_TAB = '这是什么杯';

// 固定的特别推荐tab名称
export const SPECIAL_RECOMMEND_TAB = '特别推荐';

// 特别推荐核心配置类型
export interface SpecialRecommendConfig {
  note: string;
}

// 特别推荐周轮换数据格式（JSON 文件顶层结构）
export interface SpecialRecommendWeeklyData {
  startDate: string; // 轮换起始日期，格式 "YYYY-MM-DD"
  weeks: Record<string, Record<string, SpecialRecommendConfig>>; // week1 ~ weekN（周数由数据决定）
}

// 特别推荐最大显示数量
export const MAX_SPECIAL_RECOMMEND_COUNT = 4;

// 特别推荐核心的完整信息（包含可用性状态）
export interface SpecialRecommendCore {
  value: string;
  label: string;
  author: string;
  specialNote: string;
  available: boolean; // 核心是否在核心列表中存在
}

// 核心选项类型
export interface CoreOption {
  value: string;
  label: string;
  author: string; // 作者信息，从括号内提取
  enabled: boolean;
  tabs: string[]; // 数组，支持一个核心属于多个分组
  note: string; // 从核心分类获取的note
  specialNote: string; // 特别推荐的note
}

// 核心条目匹配模式 - 匹配命定系统标签，排除分段控制条目
const CORE_PATTERN = /\[命定系统\](?!➡️系统(?:开始|结束)$)/;

// 去掉命定系统标签及其前置分类标签，保留核心名称
const CORE_LABEL_PREFIX_PATTERN = /^.*\[命定系统\]/;

// 提取作者信息的正则 - 匹配末尾括号内容
const AUTHOR_PATTERN = /\(([^)]*)\)$/;

/**
 * 核心状态初始值
 */
export const initialCoreState = {
  coreOptions: [] as CoreOption[],
  localCoreSelections: new Map<string, boolean>(),
  tabs: [] as string[],
  activeTab: '',
};

/**
 * 核心分类数据类型
 */
type CoreClassificationData = Record<string, Record<string, { note?: string }>>;

/**
 * 缓存的核心分类数据
 */
let cachedRankings: CoreClassificationData | null = null;

/**
 * 缓存的特别推荐核心数据（已提取为当前周的数据）
 */
let cachedSpecialRecommendCores: Record<string, SpecialRecommendConfig> | null = null;

/**
 * 数据基础路径 - CDN 部署环境
 * 使用版本号替代 @latest 以确保缓存正确更新
 */
const DATA_BASE_PATH = `https://testingcf.jsdelivr.net/gh/The-poem-of-destiny/FrontEnd-for-destined-journey@${__APP_VERSION__}/public/assets/data`;

/**
 * 从远程加载核心分类数据
 * 使用 JSON5 解析，支持注释和更灵活的格式
 */
async function loadCoreClassification(): Promise<CoreClassificationData> {
  if (cachedRankings !== null) {
    return cachedRankings;
  }

  try {
    const response = await fetch(`${DATA_BASE_PATH}/coreClassification.json`);
    if (!response.ok) {
      console.log('未找到核心分类数据文件 (coreClassification.json)');
      return {};
    }

    const text = await response.text();
    const data = JSON5.parse(text) as CoreClassificationData;
    console.log('成功加载核心分类数据');
    cachedRankings = data;
    return data;
  } catch (error) {
    console.log('未找到核心分类数据或格式错误:', error);
    return {};
  }
}

/**
 * 获取核心分类数据（同步版本，使用缓存）
 */
function getRankings(): CoreClassificationData | undefined {
  return cachedRankings ?? undefined;
}

/**
 * 根据起始日期和当前时间，计算当前应显示的周 key
 * 根据 weeks 中实际的周数进行循环轮换，若超出周数则从 week1 重新开始
 * 若当前日期早于 startDate 则返回 "week1"
 * @param startDate 轮换起始日期字符串，格式 "YYYY-MM-DD"
 * @param totalWeeks weeks 中实际的周数（如 4 表示 week1~week4）
 * @returns 当前周的 key，如 "week3"
 */
export function getCurrentWeekKey(startDate: string, totalWeeks: number): string {
  // 至少1周，防止除零
  const safeTotal = Math.max(1, totalWeeks);

  const start = new Date(startDate);
  const now = new Date();

  // 清除时分秒，只按日期计算
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffMs = now.getTime() - start.getTime();

  // 如果当前日期早于起始日期，返回 week1
  if (diffMs < 0) {
    return 'week1';
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weekIndex = Math.floor(diffDays / 7) % safeTotal;

  return `week${weekIndex + 1}`;
}

/**
 * 从远程加载特别推荐核心数据
 * 支持新的周轮换格式（含 startDate + weeks）
 * 使用 JSON5 解析，支持注释和更灵活的格式
 */
export async function loadSpecialRecommendCores(): Promise<Record<string, SpecialRecommendConfig>> {
  if (cachedSpecialRecommendCores !== null) {
    return cachedSpecialRecommendCores;
  }

  try {
    const response = await fetch(`${DATA_BASE_PATH}/SPECIAL_RECOMMEND_CORES.json`);
    if (!response.ok) {
      console.log('未找到特别推荐核心数据文件 (SPECIAL_RECOMMEND_CORES.json)');
      return {};
    }

    const text = await response.text();
    const rawData = JSON5.parse(text);

    let data: Record<string, SpecialRecommendConfig>;

    // 判断是否为新的周轮换格式（含 startDate 和 weeks 字段）
    if (rawData.startDate && rawData.weeks && typeof rawData.weeks === 'object') {
      const weeklyData = rawData as SpecialRecommendWeeklyData;
      // 动态计算 weeks 中实际的周数
      const totalWeeks = Object.keys(weeklyData.weeks).length;
      const weekKey = getCurrentWeekKey(weeklyData.startDate, totalWeeks);
      data = weeklyData.weeks[weekKey] ?? {};
      console.log(
        `成功加载特别推荐核心数据（周轮换模式，共 ${totalWeeks} 周，当前: ${weekKey}，起始日期: ${weeklyData.startDate}）`,
      );
    } else {
      // 兼容旧格式：直接作为扁平的核心配置
      data = rawData as Record<string, SpecialRecommendConfig>;
      console.log('成功加载特别推荐核心数据（旧格式）');
    }

    cachedSpecialRecommendCores = data;
    return data;
  } catch (error) {
    console.log('未找到特别推荐核心数据或格式错误:', error);
    return {};
  }
}

/**
 * 从核心分类数据中动态获取所有tab名称
 */
export async function getTabsFromRankings(): Promise<string[]> {
  const Rankings = await loadCoreClassification();
  if (!Rankings || typeof Rankings !== 'object') {
    return [SPECIAL_RECOMMEND_TAB, UNCATEGORIZED_TAB];
  }

  // 获取核心分类中的所有键作为tab
  const dynamicTabs = Object.keys(Rankings).filter(
    key => Rankings[key] && typeof Rankings[key] === 'object',
  );

  // 如果没有动态tab，返回默认的tabs
  if (dynamicTabs.length === 0) {
    return [SPECIAL_RECOMMEND_TAB, UNCATEGORIZED_TAB];
  }

  // "特别推荐"固定在第一位，"这是什么杯"作为未分类的tab放在最后
  return [SPECIAL_RECOMMEND_TAB, ...dynamicTabs, UNCATEGORIZED_TAB];
}

/**
 * 根据核心label查找其所属的所有tab分类和note
 * 一个核心可以同时属于多个分组
 * 注意：特别推荐通过独立逻辑处理，不在此函数中添加
 * @param label 核心标签（不含前缀和作者）
 * @param allTabs 所有tab列表
 */
export function getCoreRanking(label: string, allTabs: string[]): { tabs: string[]; note: string } {
  const Rankings = getRankings();
  const matchedTabs: string[] = [];
  let note = '';

  if (Rankings && typeof Rankings === 'object') {
    // 遍历所有tab查找核心（排除"这是什么杯"和"特别推荐"）
    for (const tabName of allTabs) {
      if (tabName === UNCATEGORIZED_TAB || tabName === SPECIAL_RECOMMEND_TAB) continue;

      const tabData = Rankings[tabName];
      if (tabData && typeof tabData === 'object') {
        // 检查核心名称是否在此tab中
        if (label in tabData) {
          matchedTabs.push(tabName);
          // 使用第一个匹配的note
          if (!note && tabData[label]?.note) {
            note = tabData[label].note;
          }
        }
      }
    }
  }

  // 未找到任何分组则归入"这是什么杯"
  if (matchedTabs.length === 0) {
    return { tabs: [UNCATEGORIZED_TAB], note: '' };
  }

  return { tabs: matchedTabs, note };
}

/**
 * 生成特别推荐核心列表（包含可用性信息）
 * 返回所有推荐核心，标记哪些在核心列表中存在（可用），最多返回 MAX_SPECIAL_RECOMMEND_COUNT 个
 * @param specialRecommendCores 特别推荐核心配置
 * @param existingCoreValues 当前存在的核心值集合
 */
export function generateSpecialRecommendCores(
  specialRecommendCores: Record<string, SpecialRecommendConfig>,
  existingCoreValues: Set<string>,
): SpecialRecommendCore[] {
  const result: SpecialRecommendCore[] = [];
  let count = 0;

  for (const [coreValue, config] of Object.entries(specialRecommendCores)) {
    if (count >= MAX_SPECIAL_RECOMMEND_COUNT) {
      break;
    }

    // 去掉世界书命定系统前缀
    const nameWithoutPrefix = coreValue.replace(CORE_LABEL_PREFIX_PATTERN, '');
    // 提取作者信息（括号内容）
    const authorMatch = nameWithoutPrefix.match(/\(([^)]*)\)$/);
    const author = authorMatch ? authorMatch[1] : '';
    // 去掉末尾括号内容作为显示标签
    const label = nameWithoutPrefix.replace(/\(([^)]*)\)$/, '');

    result.push({
      value: coreValue,
      label,
      author,
      specialNote: config.note,
      available: existingCoreValues.has(coreValue),
    });
    count++;
  }

  return result;
}

/**
 * 获取指定tab下的核心列表
 * 核心可以同时属于多个tab
 */
export function getCoresForTab(coreOptions: CoreOption[], tab: string): CoreOption[] {
  return coreOptions.filter(core => core.tabs.includes(tab));
}

/**
 * 获取当前选中的核心
 */
export function getSelectedCore(localCoreSelections: Map<string, boolean>): string | null {
  for (const [name, enabled] of localCoreSelections) {
    if (enabled) return name;
  }
  return null;
}

/**
 * 加载核心列表
 * @param specialRecommendCores 特别推荐核心列表（从外部传入）
 */
export async function loadCoreOptions(
  specialRecommendCores: Record<string, SpecialRecommendConfig> = {},
): Promise<{
  coreOptions: CoreOption[];
  localCoreSelections: Map<string, boolean>;
  tabs: string[];
  activeTab: string;
  bookName: string | null;
  specialRecommendCoreList: SpecialRecommendCore[];
}> {
  // 动态获取tabs（需要先加载核心分类数据）
  const tabs = await getTabsFromRankings();
  const bookName = getWorldBookName();
  const entries = await getFilteredEntries(CORE_PATTERN, bookName);

  // 构建存在的核心值集合
  const existingCoreValues = new Set(entries.map((entry: { name: string }) => entry.name));

  // 生成特别推荐核心列表（包含可用性信息，最多4个）
  const specialRecommendCoreList = generateSpecialRecommendCores(
    specialRecommendCores,
    existingCoreValues,
  );

  // 创建可用的特别推荐核心值集合（用于后续判断）
  const availableSpecialCores = new Set(
    specialRecommendCoreList.filter(core => core.available).map(core => core.value),
  );

  const coreOptions = entries.map((entry: { name: string; enabled: boolean }) => {
    // 去掉世界书命定系统前缀
    const nameWithoutPrefix = entry.name.replace(CORE_LABEL_PREFIX_PATTERN, '');
    // 提取作者信息（括号内容）
    const authorMatch = nameWithoutPrefix.match(AUTHOR_PATTERN);
    const author = authorMatch ? authorMatch[1] : '';
    // 去掉末尾括号内容作为显示标签
    const label = nameWithoutPrefix.replace(AUTHOR_PATTERN, '');
    const ranking = getCoreRanking(label, tabs);

    // 独立处理特别推荐：检查核心是否在可用的特别推荐列表中
    const coreTabs = [...ranking.tabs];
    let specialNote = '';
    if (availableSpecialCores.has(entry.name)) {
      coreTabs.unshift(SPECIAL_RECOMMEND_TAB); // 特别推荐放在最前面
      const recommendCore = specialRecommendCoreList.find(c => c.value === entry.name);
      specialNote = recommendCore?.specialNote || '';
    }

    return {
      value: entry.name,
      label,
      author,
      enabled: entry.enabled,
      tabs: coreTabs,
      note: ranking.note,
      specialNote,
    };
  });

  // 初始化本地选择列表（从世界书的原始状态复制）
  const localCoreSelections = new Map(coreOptions.map(core => [core.value, core.enabled]));

  // 固定显示第一个tab（特别推荐），取消自动切换到已启用核心的tab
  const activeTab = tabs[0] || SPECIAL_RECOMMEND_TAB;

  return {
    coreOptions,
    localCoreSelections,
    tabs,
    activeTab,
    bookName,
    specialRecommendCoreList,
  };
}

/**
 * 选择核心（仅更新本地状态，返回新的选择Map）
 */
export function selectCore(
  localCoreSelections: Map<string, boolean>,
  coreValue: string,
): Map<string, boolean> {
  const currentSelected = getSelectedCore(localCoreSelections);
  if (currentSelected === coreValue) {
    return localCoreSelections; // 已选中，无需操作
  }

  // 创建新的Map，禁用其他核心，启用选中的核心
  const newSelections = new Map<string, boolean>();
  for (const [name] of localCoreSelections) {
    newSelections.set(name, name === coreValue);
  }
  return newSelections;
}

/**
 * 检查本地选择是否与原始状态有变化
 */
export function hasChanges(
  coreOptions: CoreOption[],
  localCoreSelections: Map<string, boolean>,
): boolean {
  for (const core of coreOptions) {
    const localEnabled = localCoreSelections.get(core.value) ?? false;
    if (localEnabled !== core.enabled) {
      return true;
    }
  }
  return false;
}

/**
 * 保存核心选择到世界书
 * @param coreOptions 核心选项列表
 * @param localCoreSelections 本地选择状态
 * @param bookName 世界书名称
 * @returns 更新后的核心选项列表
 */
export async function saveChanges(
  coreOptions: CoreOption[],
  localCoreSelections: Map<string, boolean>,
  bookName: string,
): Promise<CoreOption[]> {
  if (!hasChanges(coreOptions, localCoreSelections)) {
    return coreOptions;
  }

  // 构建更新列表
  const updatedEntries = Array.from(localCoreSelections).map(([name, enabled]) => ({
    name,
    enabled,
  }));

  await updateWorldBook(updatedEntries, bookName);

  // 返回更新后的核心选项列表
  return coreOptions.map(core => ({
    ...core,
    enabled: localCoreSelections.get(core.value) ?? false,
  }));
}
