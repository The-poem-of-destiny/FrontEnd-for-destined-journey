import type { Item } from '../types';
import { loadCustomItems, mergeData } from '../utils/loader';

interface ItemData {
  [key: string]: Item[];
}

/**
 * 初始物品
 */

export const InitialItems: ItemData = {};

// 加载并合并自定义道具数据
let mergedItemsData: ItemData | null = null;

/**
 * 初始化道具数据（加载自定义数据并合并）
 */
async function initializeItems() {
  const customData = await loadCustomItems();
  mergedItemsData = mergeData(InitialItems, customData) as ItemData;
}

/**
 * 获取合并后的道具数据
 */
export function getInitialItems(): ItemData {
  return mergedItemsData || InitialItems;
}

// 自动初始化
initializeItems();
