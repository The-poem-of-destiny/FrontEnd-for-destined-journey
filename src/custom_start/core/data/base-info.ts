import { computed, ref } from 'vue';
import type { Attributes, BaseInfoData } from '../types';
import { convertLocationsToCascaderOptions } from '../utils/form-options';
import { loadBaseInfo } from '../utils/loader';

// 响应式数据存储
const baseInfoData = ref<BaseInfoData>({});

// 初始化
loadBaseInfo().then(data => {
  baseInfoData.value = data;
});

// 使用 computed 缓存结果，避免重复创建新引用
export const getGenders = computed(() => {
  const external = baseInfoData.value.genders || [];
  return [...external.filter(g => g !== '自定义'), '自定义'];
});

export const getRaceCosts = computed(() => {
  const external = baseInfoData.value.raceCosts || {};
  return { ...external, 自定义: 80 } as Record<string, number>;
});

export const getIdentityCosts = computed(() => {
  const external = baseInfoData.value.identityCosts || {};
  return { ...external, 自定义: 80 } as Record<string, number>;
});

export const getStartLocations = computed(() => {
  const external = baseInfoData.value.startLocations || [];
  return [...external.filter(l => l !== '自定义'), '自定义'];
});

// 获取起始地点的级联选项（树形结构）
export const getStartLocationsCascader = computed(() => {
  const external = baseInfoData.value.startLocations || [];
  // 过滤掉"自定义"，转换为树形结构
  const locations = external.filter(l => l !== '自定义');
  const cascaderOptions = convertLocationsToCascaderOptions(locations);
  // 添加"自定义"选项到根级别
  cascaderOptions.push({
    label: '自定义',
    value: '自定义',
  });
  return cascaderOptions;
});

/**
 * 检查是否启用开发者模式（通过姓名暗号）
 * 暗号：名字包含特定字符序列
 */
const checkDevModeByName = (name: string): boolean => {
  // 暗号
  const devPatterns = ['[dev]', '[test]'];
  const lowerName = name.toLowerCase();
  return devPatterns.some(pattern => lowerName.includes(pattern));
};

/**
 * 生成随机初始转生点数
 * 范围: 1000-10000
 * 更好的加权随机
 * @param characterName 可选的角色名，用于检测开发者模式
 */
export const generateInitialPoints = (characterName?: string): number => {
  // 开发者模式：如果角色名包含特定暗号，返回高点数
  if (characterName && checkDevModeByName(characterName)) {
    return 888888;
  }

  const random = Math.random();
  const weight = 3;
  const weightRandom = Math.pow(random, weight);

  const result = Math.floor(1000 + weightRandom * (10000 - 1000 + 1));

  return Math.min(result, 10000);
};

// 初始转生点数（默认值）
export const INITIAL_REINCARNATION_POINTS = 1000;

// 属性列表
export const ATTRIBUTES: (keyof Attributes)[] = ['力量', '敏捷', '体质', '智力', '精神'];

// 等级相关常量
export const MAX_LEVEL = 10;
export const MIN_LEVEL = 1;

// 基础点常量
/** 基础点总和上限 */
export const MAX_BASE_POINTS_TOTAL = 25;
/** 基础点单项上限 */
export const MAX_BASE_POINTS_PER_ATTR = 6;

/**
 * 根据等级计算可用的【额外】AP点数
 * 额外点总和 = 等级 Lv - 1
 * @param level 角色等级
 * @returns 可自由分配的额外AP点数
 */
export const calculateAPByLevel = (level: number): number => {
  return Math.max(0, level - 1);
};

/**
 * 获取等级对应的层级属性点
 * @param level 角色等级
 * @returns 每个属性获得的层级加成
 */
export const getTierAttributeBonus = (level: number): number => {
  if (level >= 1 && level <= 4) return 0;
  if (level >= 5 && level <= 8) return 1;
  if (level >= 9 && level <= 12) return 2;
  if (level >= 13 && level <= 16) return 3;
  if (level >= 17 && level <= 20) return 4;
  if (level >= 21 && level <= 24) return 5;
  if (level >= 25) return 6;
  return 0;
};

/**
 * 获取等级对应的层级名称
 * @param level 角色等级
 * @returns 层级名称
 */
export const getLevelTierName = (level: number): string => {
  if (level >= 1 && level <= 4) return '第一层级';
  if (level >= 5 && level <= 8) return '第二层级';
  if (level >= 9 && level <= 12) return '第三层级';
  if (level >= 13 && level <= 16) return '第四层级';
  if (level >= 17 && level <= 20) return '第五层级';
  if (level >= 21 && level <= 24) return '第六层级';
  if (level >= 25) return '第七层级';
  return '未知层级';
};
