// ==================== 变量输出方式相关 ====================

import { getFilteredEntries, updateWorldBooks } from '@/home/services/worldbookload&update';

// 固定的条目名称
const OUTPUT_ENTRY_MAIN_API = 'output_format (随AI输出开，主API)';
const OUTPUT_ENTRY_EXTRA_API = '[mvu_update]output_format (使用额外模型更新变量开)';
const OUTPUT_ENTRY_EXTRA_API_LATEST_INPUT = '[mvu_update]用户最新输入(使用额外模型更新变量开)';

// 变量输出方式选项
export const OUTPUT_OPTIONS = [
  {
    value: '主API',
    label: '主API',
    desc: '使用主API解析变量更新',
    entryNames: [OUTPUT_ENTRY_MAIN_API],
  },
  {
    value: '额外API',
    label: '额外API',
    desc: '使用额外API解析变量更新',
    entryNames: [OUTPUT_ENTRY_EXTRA_API, OUTPUT_ENTRY_EXTRA_API_LATEST_INPUT],
  },
];

/**
 * 保存输出方式选择到世界书
 * @param selectedValue 选中的输出方式值（'主API' 或 '额外API'）
 */
export async function saveOutputSelection(selectedValue: string): Promise<void> {
  const desiredStates = new Map(
    OUTPUT_OPTIONS.flatMap(opt =>
      opt.entryNames.map(name => [name, opt.value === selectedValue] as const),
    ),
  );

  const escapedNames = Array.from(desiredStates.keys()).map(name =>
    name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );
  const matchingEntries = await getFilteredEntries(
    new RegExp(`^(?:${escapedNames.join('|')})$`),
  );

  if (matchingEntries.length === 0) {
    console.error('未找到变量输出方式条目');
    return;
  }

  await updateWorldBooks(
    matchingEntries.map(entry => ({
      name: entry.name,
      enabled: desiredStates.get(entry.name) ?? entry.enabled,
      bookName: entry.bookName,
    })),
  );
}
