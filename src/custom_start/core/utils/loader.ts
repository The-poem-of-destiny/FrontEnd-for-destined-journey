import JSON5 from 'json5';
import type { Background, BaseInfoData, Equipment, Item, Partner, Skill } from '../types';
import backgroundsJson from '../../../../public/assets/data/backgrounds.json?raw';
import baseInfoJson from '../../../../public/assets/data/baseInfo.json?raw';
import equipmentsJson from '../../../../public/assets/data/equipments.json?raw';
import itemsJson from '../../../../public/assets/data/items.json?raw';
import partnersJson from '../../../../public/assets/data/partners.json?raw';
import skillsJson from '../../../../public/assets/data/skills.json?raw';

/**
 * 数据基础路径 - CDN 部署环境
 * 使用版本号替代 @latest 以确保缓存正确更新
 */
const DATA_BASE_PATH = `https://testingcf.jsdelivr.net/gh/The-poem-of-destiny/FrontEnd-for-destined-journey@${__APP_VERSION__}/public/assets/data`;

const BUNDLED_DATA: Record<string, string> = {
  'backgrounds.json': backgroundsJson,
  'baseInfo.json': baseInfoJson,
  'equipments.json': equipmentsJson,
  'items.json': itemsJson,
  'partners.json': partnersJson,
  'skills.json': skillsJson,
};

const { parse: parseJson5 } = JSON5 as unknown as { parse: (source: string) => unknown };

function parseBundledData<T>(filename: string, dataName: string): T {
  const raw = BUNDLED_DATA[filename];

  if (!raw) {
    return {} as T;
  }

  try {
    const data = parseJson5(raw);
    console.log(`已使用内置${dataName}数据`);
    return data;
  } catch (error) {
    console.warn(`内置${dataName}数据格式错误:`, error);
    return {} as T;
  }
}

/**
 * 通用数据加载函数
 * 使用 JSON5 解析，支持注释和更灵活的格式
 */
async function loadJsonData<T>(filename: string, dataName: string): Promise<T> {
  const bundledData = parseBundledData<T>(filename, dataName);

  if (!_.isEmpty(bundledData)) {
    return bundledData;
  }

  try {
    const response = await fetch(`${DATA_BASE_PATH}/${filename}`);
    if (!response.ok) {
      console.log(`未找到自定义数据文件 (${filename})`);
      return parseBundledData<T>(filename, dataName);
    }

    const text = await response.text();
    const data = parseJson5(text);
    console.log(`成功加载自定义${dataName}数据`);
    return data;
  } catch (error) {
    console.log(`未找到自定义${dataName}数据或格式错误:`, error);
    return parseBundledData<T>(filename, dataName);
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
 */
export async function loadCustomSkills(): Promise<Record<string, Skill[]>> {
  return loadJsonData<Record<string, Skill[]>>('skills.json', '技能');
}

/**
 * 加载自定义初始剧情数据
 * 从 public/assets/data 目录加载用户自定义的初始剧情数据
 */
export async function loadCustomBackgrounds(): Promise<Record<string, Background[]>> {
  return loadJsonData<Record<string, Background[]>>('backgrounds.json', '初始剧情');
}

/**
 * 加载自定义伙伴数据
 * 从 public/assets/data 目录加载用户自定义的伙伴数据
 */
export async function loadCustomPartners(): Promise<Record<string, Partner[]>> {
  return loadJsonData<Record<string, Partner[]>>('partners.json', '伙伴');
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
    return undefined;
  });
}
