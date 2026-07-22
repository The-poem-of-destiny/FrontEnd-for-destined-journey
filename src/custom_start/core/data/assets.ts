import type { Asset } from '../types';
import { loadCustomAssets, loadCustomItems, mergeData } from '../utils/loader';

interface AssetData {
  [key: string]: Asset[];
}

export const InitialAssets: AssetData = {};

// These durable collections previously lived in the generic item catalogue.
export const AssetItemCategories = ['塔罗牌', '书籍', '神秘人的物品'] as const;

let mergedAssetsData: AssetData | null = null;

async function initializeAssets() {
  const [customAssets, customItems] = await Promise.all([loadCustomAssets(), loadCustomItems()]);
  const migratedItems = _.pick(customItems, AssetItemCategories) as AssetData;
  mergedAssetsData = mergeData(mergeData(InitialAssets, migratedItems), customAssets) as AssetData;
}

export function getAssets(): AssetData {
  return mergedAssetsData || InitialAssets;
}

initializeAssets();
