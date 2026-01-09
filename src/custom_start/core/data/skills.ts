import { Skill } from '../types';
import { loadCustomSkills, mergeData } from '../utils/loader';

/**
 * 初始技能
 */
interface Skills {
  [key: string]: Skill[];
}

export const SkillGroups: Skills = {};

// 加载并合并自定义技能数据
let mergedSkillsData: Skills | null = null;

/**
 * 初始化技能数据（加载自定义数据并合并）
 */
async function initializeSkills() {
  const customData = await loadCustomSkills();
  mergedSkillsData = mergeData(SkillGroups, customData);
}

/**
 * 获取合并后的技能数据
 */
export function getSkills(): Skills {
  return mergedSkillsData || SkillGroups;
}

// 自动初始化
initializeSkills();
