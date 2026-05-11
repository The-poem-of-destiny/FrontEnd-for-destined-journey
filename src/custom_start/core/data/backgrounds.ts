import { shallowRef } from 'vue';

import type { Background } from '../types';
import { loadCustomBackgrounds, mergeData } from '../utils/loader';

interface Backgrounds {
  [key: string]: Background[];
}

/**
 * 初始背景
 */
const Backgrounds: Backgrounds = {
  通用开局: [
    { name: '【自定义开局】', description: '自由发挥你的想象力，编写你自己的人物初始背景。' },
  ],
};

// 加载并合并自定义初始剧情数据
const mergedBackgroundsData = shallowRef<Backgrounds>(Backgrounds);

/**
 * 初始化初始剧情数据（加载自定义数据并合并）
 */
async function initializeBackgrounds() {
  const customData = await loadCustomBackgrounds();
  mergedBackgroundsData.value = mergeData(Backgrounds, customData) as Backgrounds;
}

/**
 * 获取初始剧情数据
 */
export function getBackgrounds(): Backgrounds {
  return mergedBackgroundsData.value;
}

initializeBackgrounds();
