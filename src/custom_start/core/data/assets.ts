import type { Asset } from '../types';
import { loadCustomAssets, mergeData } from '../utils/loader';

interface AssetData {
  [key: string]: Asset[];
}

export const InitialAssets: AssetData = {};

let mergedAssetsData: AssetData | null = null;

async function initializeAssets() {
  mergedAssetsData = mergeData(InitialAssets, await loadCustomAssets()) as AssetData;
}

export function getAssets(): AssetData {
  return mergedAssetsData || InitialAssets;
}

initializeAssets();
