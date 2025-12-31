/**
 * 品质相关工具函数
 * 用于物品、装备、技能的品质样式处理
 */

/** 品质到 CSS 类名的映射 */
export const QualityClassMap: Record<string, string> = {
  唯一: 'unique',
  神话: 'mythic',
  传说: 'legendary',
  史诗: 'epic',
  稀有: 'rare',
  优良: 'uncommon',
};

const QualityRankMap: Record<string, number> = {
  普通: 1,
  优良: 2,
  稀有: 3,
  史诗: 4,
  传说: 5,
  神话: 6,
  唯一: 7,
};

/**
 * 按品质从高到低排序，品质相同按名称排序
 */
export const sortEntriesByQuality = <T extends { 品质?: string }>(
  items: Record<string, T>,
): [string, T][] => {
  return _.orderBy(
    Object.entries(items),
    [([_name, item]) => getQualityRank(item?.品质), ([name]) => name],
    ['desc', 'asc'],
  );
};

/**
 * 获取品质排序权重（值越大越高）
 */
export const getQualityRank = (quality?: string): number => {
  if (!quality) return 0;
  return QualityRankMap[quality] ?? 0;
};

/** 品质样式映射 */
export const QualityStyleMap: Record<string, string> = {
  unique: 'qualityUnique',
  mythic: 'qualityMythic',
  legendary: 'qualityLegendary',
  epic: 'qualityEpic',
  rare: 'qualityRare',
  uncommon: 'qualityUncommon',
};

/**
 * 获取品质对应的样式类名
 * @param quality - 品质名称（如"史诗"、"传说"等）
 * @param stylesModule - SCSS module 对象
 * @returns 样式类名字符串
 */
export const getQualityClass = (
  quality: string | undefined,
  stylesModule: Record<string, string>,
): string => {
  if (!quality) return '';
  const qualityKey = QualityClassMap[quality];
  if (!qualityKey) return '';
  const styleKey = QualityStyleMap[qualityKey];
  return styleKey ? stylesModule[styleKey] : '';
};
