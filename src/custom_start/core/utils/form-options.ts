import type { CascaderOption } from '../components/Form/FormCascader.vue';
import type { Rarity } from '../types';

/**
 * 品质/稀有度选项配置
 */
export const RARITY_OPTIONS: { value: Rarity; label: string; color: string }[] = [
  { value: 'common', label: '普通', color: '#9e9e9e' },
  { value: 'uncommon', label: '优秀', color: '#b88a2c' },
  { value: 'rare', label: '稀有', color: '#2196f3' },
  { value: 'epic', label: '史诗', color: '#9c27b0' },
  { value: 'legendary', label: '传说', color: '#ff9800' },
  { value: 'mythic', label: '神话', color: '#e91e63' },
  { value: 'only', label: '唯一', color: '#ff0000' },
];

/**
 * 装备类型选项配置
 */
export const EQUIPMENT_TYPE_OPTIONS = [
  { label: '武器', value: '武器' },
  { label: '防具', value: '防具' },
  { label: '饰品', value: '饰品' },
] as const;

/**
 * 技能类型选项配置
 */
export const SKILL_TYPE_OPTIONS = [
  { label: '主动', value: '主动' },
  { label: '被动', value: '被动' },
] as const;

/**
 * 物品大分类选项
 */
export const CATEGORY_OPTIONS = [
  { value: 'equipment', label: '装备' },
  { value: 'item', label: '道具' },
  { value: 'skill', label: '技能' },
] as const;

/**
 * 获取稀有度显示标签
 */
export const getRarityLabel = (value: string | undefined): string => {
  return RARITY_OPTIONS.find(opt => opt.value === value)?.label || '普通';
};

/**
 * 获取稀有度颜色
 */
export const getRarityColor = (value: string | undefined): string => {
  return RARITY_OPTIONS.find(opt => opt.value === value)?.color || '#9e9e9e';
};

/**
 * 将扁平的位置字符串数组转换为树形级联结构
 * 输入: ["区域A-国家1-城市X", "区域A-国家1-城市Y", "区域A-国家2-城市Z"]
 * 输出: 树形 CascaderOption 结构
 *
 * 特殊处理：如果一个路径既是独立选项又有子选项（如 "区域-国家" 和 "区域-国家-城市"），
 * 会将该路径作为子节点的第一个，显示为 "国家（本地区）"
 *
 * @param locations - 位置字符串数组，使用分隔符分隔层级
 * @param separator - 层级分隔符，默认为 "-"
 * @returns 树形级联选项数组
 */
export const convertLocationsToCascaderOptions = (
  locations: string[],
  separator = '-',
): CascaderOption[] => {
  const root: CascaderOption[] = [];

  // 用于快速查找节点的映射表
  const nodeMap = new Map<string, CascaderOption>();

  // 收集所有路径，用于检测哪些是同时存在的父子关系
  const allPaths = new Set(locations);

  // 标记哪些路径是"既是叶子又有子节点"的情况
  const pathsNeedingLocalOption = new Set<string>();

  // 检测需要添加"本地区"选项的路径
  for (const location of locations) {
    const parts = location.split(separator);
    // 检查这个路径的所有父路径
    let parentPath = '';
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i].trim();
      parentPath = parentPath ? `${parentPath}${separator}${part}` : part;
      // 如果父路径也作为独立选项存在，标记它
      if (allPaths.has(parentPath)) {
        pathsNeedingLocalOption.add(parentPath);
      }
    }
  }

  for (const location of locations) {
    const parts = location.split(separator);
    let currentPath = '';
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      currentPath = currentPath ? `${currentPath}${separator}${part}` : part;

      // 检查当前节点是否已存在
      let node = nodeMap.get(currentPath);

      if (!node) {
        // 创建新节点，value 使用完整路径
        node = {
          label: part,
          value: currentPath,
          children: [],
        };
        nodeMap.set(currentPath, node);
        currentLevel.push(node);

        // 如果这个路径需要添加"本地区"选项
        if (pathsNeedingLocalOption.has(currentPath)) {
          // 添加一个代表"本地区"的子选项，value 使用原始数据中的完整路径
          const localOption: CascaderOption = {
            label: `${part}（本地区）`,
            value: currentPath,
          };
          node.children!.unshift(localOption);
        }
      }

      // 移动到下一层级
      currentLevel = node.children!;
    }
  }

  // 清理空的 children 数组（叶子节点不需要 children）
  // 但保留有"本地区"选项的节点的 children
  const cleanEmptyChildren = (options: CascaderOption[]) => {
    for (const option of options) {
      if (option.children && option.children.length === 0) {
        delete option.children;
      } else if (option.children) {
        cleanEmptyChildren(option.children);
      }
    }
  };

  cleanEmptyChildren(root);

  return root;
};

/**
 * 对树形选项进行排序（按 label 字母顺序）
 *
 * @param options - 树形级联选项数组
 * @returns 排序后的树形级联选项数组
 */
export const sortCascaderOptions = (options: CascaderOption[]): CascaderOption[] => {
  const sorted = [...options].sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));

  for (const option of sorted) {
    if (option.children && option.children.length > 0) {
      option.children = sortCascaderOptions(option.children);
    }
  }

  return sorted;
};
