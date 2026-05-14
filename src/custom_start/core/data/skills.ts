import { shallowRef } from 'vue';

import { Skill } from '../types';
import { getLibraryDataByType } from '../utils/custom-library';
import { loadCustomSkills, mergeData } from '../utils/loader';

/**
 * 初始技能
 */
interface Skills {
  [key: string]: Skill[];
}

export const SkillGroups: Skills = {};

// 加载并合并自定义技能数据
const mergedSkillsData = shallowRef<Skills>(SkillGroups);

/**
 * 初始化技能数据（加载自定义数据并合并）
 */
async function initializeSkills() {
  const customData = await loadCustomSkills();
  mergedSkillsData.value = mergeData(SkillGroups, customData);
}

/**
 * 获取合并后的技能数据
 */
export function getSkills(): Skills {
  return mergeData(mergedSkillsData.value, getLibraryDataByType<Skill>('skill'));
}

// 自动初始化
initializeSkills();
