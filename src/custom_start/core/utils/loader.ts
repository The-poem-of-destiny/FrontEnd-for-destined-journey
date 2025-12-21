import JSON5 from 'json5';
import type { Background, BaseInfoData, DestinedOne, Equipment, Item, Skill } from '../types';

/**
 * 数据基础路径 - CDN 部署环境
 */
const DATA_BASE_PATH =
  'https://testingcf.jsdelivr.net/gh/The-poem-of-destiny/FrontEnd-for-destined-journey@old-v3.1.1/public/assets/data';

/**
 * 生成带缓存破坏参数的 URL
 * 添加时间戳参数来绕过 CDN 缓存
 */
function getCacheBustedUrl(path: string): string {
  return `${path}`;
}

/**
 * 通用数据加载函数
 * 使用 JSON5 解析，支持注释和更灵活的格式
 */
async function loadJsonData<T>(filename: string, dataName: string): Promise<T> {
  try {
    const response = await fetch(getCacheBustedUrl(`${DATA_BASE_PATH}/${filename}`));
    if (!response.ok) {
      console.log(`📝 未找到自定义数据文件 (${filename})`);
      return {} as T;
    }

    const text = await response.text();
    const data = JSON5.parse(text);
    console.log(`✅ 成功加载自定义${dataName}数据`);
    return data;
  } catch (error) {
    console.log(`📝 未找到自定义${dataName}数据或格式错误:`, error);
    return {} as T;
  }
}

/**
 * 加载自定义装备数据
 * 从 public/assets/data 目录加载用户自定义的装备数据
 */
export async function loadCustomEquipments(): Promise<Record<string, Equipment[]>> {
  return loadJsonData<Record<string, Equipment[]>>('equipments.json', '装备');
}

/**
 * 加载自定义道具数据
 * 从 public/assets/data 目录加载用户自定义的道具数据
 */
export async function loadCustomItems(): Promise<Record<string, Item[]>> {
  return loadJsonData<Record<string, Item[]>>('items.json', '道具');
}

/**
 * 加载自定义技能数据
 * 从 public/assets/data 目录加载用户自定义的技能数据
 * 兼容中英文字段名
 */
export async function loadCustomSkills(): Promise<{
  ActiveSkills?: Record<string, Skill[]>;
  PassiveSkills?: Record<string, Skill[]>;
}> {
  const data = await loadJsonData<any>('skills.json', '技能');

  // 将中文字段名转换为英文（兼容两种格式）
  const result: {
    ActiveSkills?: Record<string, Skill[]>;
    PassiveSkills?: Record<string, Skill[]>;
  } = {};

  if (data.主动技能) {
    result.ActiveSkills = data.主动技能;
  } else if (data.ActiveSkills) {
    result.ActiveSkills = data.ActiveSkills;
  }

  if (data.被动技能) {
    result.PassiveSkills = data.被动技能;
  } else if (data.PassiveSkills) {
    result.PassiveSkills = data.PassiveSkills;
  }

  return result;
}

/**
 * 加载自定义初始剧情数据
 * 从 public/assets/data 目录加载用户自定义的初始剧情数据
 */
export async function loadCustomBackgrounds(): Promise<Record<string, Background[]>> {
  return loadJsonData<Record<string, Background[]>>('backgrounds.json', '初始剧情');
}

/**
 * 加载自定义命定之人数据
 * 从 public/assets/data 目录加载用户自定义的初始剧情数据
 */
export async function loadCustomDestinedOnes(): Promise<Record<string, DestinedOne[]>> {
  return loadJsonData<Record<string, DestinedOne[]>>('destinedOnes.json', '命定之人');
}

/**
 * 加载基础信息数据（性别、种族、身份、初始地点）
 */
export async function loadBaseInfo(): Promise<BaseInfoData> {
  return loadJsonData<BaseInfoData>('baseInfo.json', '基础信息');
}

/**
 * 合并内置数据和自定义数据
 * @param builtinData 内置数据
 * @param customData 自定义数据
 * @returns 合并后的数据
 */
export function mergeData<T>(
  builtinData: Record<string, T[]>,
  customData: Record<string, T[]>,
): Record<string, T[]> {
  return _.mergeWith({}, builtinData, customData, (objValue, srcValue) => {
    if (_.isArray(objValue)) return [...objValue, ...srcValue];
  });
}

/**
 * 合并技能数据（主动技能和被动技能）
 */
export function mergeSkillData(
  builtinActive: Record<string, Skill[]>,
  builtinPassive: Record<string, Skill[]>,
  customData: {
    ActiveSkills?: Record<string, Skill[]>;
    PassiveSkills?: Record<string, Skill[]>;
  },
): {
  ActiveSkills: Record<string, Skill[]>;
  PassiveSkills: Record<string, Skill[]>;
} {
  const mergedActive = customData.ActiveSkills
    ? mergeData(builtinActive, customData.ActiveSkills)
    : builtinActive;

  const mergedPassive = customData.PassiveSkills
    ? mergeData(builtinPassive, customData.PassiveSkills)
    : builtinPassive;

  return {
    ActiveSkills: mergedActive,
    PassiveSkills: mergedPassive,
  };
}
