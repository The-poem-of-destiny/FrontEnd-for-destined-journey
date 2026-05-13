import JSON5 from 'json5';

import { getFilteredEntries, getWorldBookName, updateWorldBook } from './worldbookload&update';

// 未分类的默认tab名称
export const UNCATEGORIZED_TAB = '这是什么杯';

// 核心选项类型
export interface CoreOption {
  value: string;
  label: string;
  author: string; // 作者信息，从括号内提取
  enabled: boolean;
  tabs: string[]; // 数组，支持一个核心属于多个分组
  note: string; // 从核心分类获取的note
}

// 核心条目匹配模式 - 匹配以"命定系统-"开头的条目
const CORE_PATTERN = /^命定系统-/;

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
 * 从核心分类数据中动态获取所有tab名称
 */
export async function getTabsFromRankings(): Promise<string[]> {
  const Rankings = await loadCoreClassification();
  if (!Rankings || typeof Rankings !== 'object') {
    return [UNCATEGORIZED_TAB];
  }

  // 获取核心分类中的所有键作为tab
  const dynamicTabs = Object.keys(Rankings).filter(
    key => Rankings[key] && typeof Rankings[key] === 'object',
  );

  // 如果没有动态tab，返回默认的tabs
  if (dynamicTabs.length === 0) {
    return [UNCATEGORIZED_TAB];
  }

  // "这是什么杯"作为未分类的tab放在最后
  return [...dynamicTabs, UNCATEGORIZED_TAB];
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
    // 遍历所有tab查找核心（排除"这是什么杯"）
    for (const tabName of allTabs) {
      if (tabName === UNCATEGORIZED_TAB) continue;

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
 */
export async function loadCoreOptions(): Promise<{
  coreOptions: CoreOption[];
  localCoreSelections: Map<string, boolean>;
  tabs: string[];
  activeTab: string;
  bookName: string | null;
}> {
  // 动态获取tabs（需要先加载核心分类数据）
  const tabs = await getTabsFromRankings();
  const bookName = getWorldBookName();
  const entries = await getFilteredEntries(CORE_PATTERN, bookName);

  const coreOptions = entries.map((entry: { name: string; enabled: boolean }) => {
    // 去掉"命定系统-"前缀
    const nameWithoutPrefix = entry.name.replace(CORE_PATTERN, '');
    // 提取作者信息（括号内容）
    const authorMatch = nameWithoutPrefix.match(AUTHOR_PATTERN);
    const author = authorMatch ? authorMatch[1] : '';
    // 去掉末尾括号内容作为显示标签
    const label = nameWithoutPrefix.replace(AUTHOR_PATTERN, '');
    const ranking = getCoreRanking(label, tabs);

    return {
      value: entry.name,
      label,
      author,
      enabled: entry.enabled,
      tabs: ranking.tabs,
      note: ranking.note,
    };
  });

  // 初始化本地选择列表（从世界书的原始状态复制）
  const localCoreSelections = new Map(coreOptions.map(core => [core.value, core.enabled]));

  // 显示第一个tab
  const activeTab = tabs[0] || UNCATEGORIZED_TAB;

  return {
    coreOptions,
    localCoreSelections,
    tabs,
    activeTab,
    bookName,
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
