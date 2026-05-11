import { shallowRef } from 'vue';

import type { Partner } from '../types';
import { loadCustomPartners, mergeData } from '../utils/loader';

interface Partners {
  [key: string]: Partner[];
}

/**
 * 初始伙伴对象
 */
const DefaultPartners: Partners = {};

// 加载并合并自定义初始伙伴数据
const mergedPartners = shallowRef<Partners>(DefaultPartners);

// 初始化伙伴数据（加载自定义数据并合并）
async function initPartnersData(): Promise<void> {
  const customPartners = await loadCustomPartners();
  mergedPartners.value = mergeData(DefaultPartners, customPartners) as Partners;
}

// 获取所有伙伴数据
export function getAllPartners(): Partners {
  return mergedPartners.value;
}

initPartnersData();
