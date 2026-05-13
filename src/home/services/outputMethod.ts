// ==================== 变量输出方式相关 ====================

import { getWorldBookName, updateWorldBook } from '@/home/services/worldbookload&update';

// 固定的条目名称
const OUTPUT_ENTRY_MAIN_API = 'output_format (随AI输出开，主API)';
const OUTPUT_ENTRY_EXTRA_API = '[mvu_update]output_format (使用额外模型更新变量开)';

// 变量输出方式选项
export const OUTPUT_OPTIONS = [
  {
    value: '主API',
    label: '主API',
    desc: '使用主API解析变量更新',
    entryName: OUTPUT_ENTRY_MAIN_API,
  },
  {
    value: '额外API',
    label: '额外API',
    desc: '使用额外API解析变量更新',
    entryName: OUTPUT_ENTRY_EXTRA_API,
  },
];

/**
 * 保存输出方式选择到世界书
 * @param selectedValue 选中的输出方式值（'主API' 或 '额外API'）
 */
export async function saveOutputSelection(selectedValue: string): Promise<void> {
  const bookName = getWorldBookName();
  if (!bookName) {
    console.error('未找到世界书');
    return;
  }

  // 根据选择构建更新条目
  const updatedEntries = OUTPUT_OPTIONS.map(opt => ({
    name: opt.entryName,
    enabled: opt.value === selectedValue,
  }));

  await updateWorldBook(updatedEntries, bookName);
}
