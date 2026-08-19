import type { CustomInjectionSettings, Rarity } from '../types';

// 保持旧版行为：已选内容默认直接写入 MVU 变量
export const DEFAULT_CUSTOM_INJECTION_SETTINGS: CustomInjectionSettings = {
  equipment: true,
  item: true,
  asset: true,
  skill: true,
  partner: true,
};

// 稀有度映射
export const RARITY_MAP: Record<string, string> = {
  only: '唯一',
  common: '普通',
  uncommon: '优良',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
  mythic: '神话',
};

// 背景类型映射
export const BACKGROUND_TYPE_MAP: Record<string, string> = {
  general: '通用背景',
  race: '种族限定',
  location: '地区限定',
};

// 稀有度优先级（用于排序）
export const RARITY_PRIORITY: Record<Rarity, number> = {
  only: -1,
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
};
