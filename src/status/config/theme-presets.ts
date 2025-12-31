/**
 * 预设主题配置
 * 包含所有预设主题的颜色定义
 */
import type { Theme, ThemePresetId } from '../core/types/theme';

/**
 * 西幻羊皮纸主题（默认）
 * 古旧卷轴、皮革质感
 */
const ParchmentTheme: Theme = {
  id: 'parchment',
  name: '羊皮纸',
  colors: {
    // 窗口容器
    windowBg: '#1c1410',
    windowBorder: '#6b4b2e',

    // 标题栏
    titleBarBg: '#2a1d14',
    titleBarText: '#f0dec2',
    titleBarIcon: '#caa06a',
    titleBarBtnHover: 'rgba(202, 160, 106, 0.18)',

    // Tab 栏
    tabBarBg: '#241810',
    tabText: '#c9ad85',
    tabActiveText: '#f8ebd2',
    tabIndicator: '#c28b48',
    tabHoverBg: 'rgba(194, 139, 72, 0.16)',

    // 内容区域
    contentBg: '#221912',
    cardBg: '#2c2016',
    cardBorder: '#5a412a',

    // 文本颜色
    textPrimary: '#f4e3c8',
    textSecondary: '#d2b48c',
    textMuted: '#a1886b',

    // 资源条
    resourceHp: '#b73a2b',
    resourceMp: '#305fa8',
    resourceSp: '#3b7f52',
    resourceExp: '#c08a2f',

    // 品质颜色
    qualityUnique: '#d6a057',
    qualityMythic: '#c24b63',
    qualityLegendary: '#e1c067',
    qualityEpic: '#7e55b6',
    qualityRare: '#3f7bc4',
    qualityUncommon: '#4b8b5f',

    // 交互状态
    primaryBg: '#91602c',
    primaryText: '#f9eed9',
    success: '#4f9b68',
    warning: '#d1a13f',
    error: '#c14a3a',

    // 命定系统
    affection: '#b4586c',
    affectionBg: 'rgba(180, 88, 108, 0.26)',
    affectionText: '#d79aa8',
    tagPresent: 'rgba(76, 162, 96, 0.2)',
    tagPresentText: '#7fc39a',
    tagContract: 'rgba(186, 52, 82, 0.22)',
    tagContractText: '#e19ab0',

    // 登神长阶
    ascensionElement: 'rgba(63, 142, 214, 0.16)',
    ascensionPower: 'rgba(220, 150, 40, 0.16)',
    ascensionLaw: 'rgba(152, 80, 186, 0.16)',

    // 货币
    currencyGold: '#f3c94f',
    currencySilver: '#c2c4c9',
    currencyCopper: '#b67a3a',
  },
};

/**
 * 暗酒红主题
 * 深沉、神秘、黑暗世界氛围
 */
const CrimsonTheme: Theme = {
  id: 'crimson',
  name: '暗酒红',
  colors: {
    // 窗口容器
    windowBg: '#1b0e10',
    windowBorder: '#6d2b30',

    // 标题栏
    titleBarBg: '#2b1418',
    titleBarText: '#f0d2d4',
    titleBarIcon: '#c98a8f',
    titleBarBtnHover: 'rgba(201, 138, 143, 0.18)',

    // Tab 栏
    tabBarBg: '#231115',
    tabText: '#c99aa0',
    tabActiveText: '#f7d8dc',
    tabIndicator: '#b04a54',
    tabHoverBg: 'rgba(176, 74, 84, 0.16)',

    // 内容区域
    contentBg: '#1f1114',
    cardBg: '#2a171b',
    cardBorder: '#5a2a30',

    // 文本颜色
    textPrimary: '#f2d7d9',
    textSecondary: '#d1a3a8',
    textMuted: '#9f6f74',

    // 资源条
    resourceHp: '#c23a3a',
    resourceMp: '#3b4f9a',
    resourceSp: '#3e7a55',
    resourceExp: '#c0893c',

    // 品质颜色
    qualityUnique: '#d79a55',
    qualityMythic: '#b33b5d',
    qualityLegendary: '#e0b35e',
    qualityEpic: '#7a4fb6',
    qualityRare: '#3a75c1',
    qualityUncommon: '#49835d',

    // 交互状态
    primaryBg: '#94323b',
    primaryText: '#fae6e7',
    success: '#4e955f',
    warning: '#d0a040',
    error: '#d24b4f',

    // 命定系统
    affection: '#c04b61',
    affectionBg: 'rgba(192, 75, 97, 0.28)',
    affectionText: '#e29aa6',
    tagPresent: 'rgba(72, 158, 98, 0.2)',
    tagPresentText: '#82c49a',
    tagContract: 'rgba(196, 56, 76, 0.24)',
    tagContractText: '#e29aa2',

    // 登神长阶
    ascensionElement: 'rgba(78, 128, 196, 0.16)',
    ascensionPower: 'rgba(216, 132, 36, 0.16)',
    ascensionLaw: 'rgba(156, 72, 112, 0.18)',

    // 货币
    currencyGold: '#f2c653',
    currencySilver: '#c6c0c4',
    currencyCopper: '#b26d3a',
  },
};

/**
 * 深靛蓝主题
 * 深邃、神秘、魔法氛围
 */
const IndigoTheme: Theme = {
  id: 'indigo',
  name: '深靛蓝',
  colors: {
    // 窗口容器
    windowBg: '#0d1322',
    windowBorder: '#2a3f66',

    // 标题栏
    titleBarBg: '#141d33',
    titleBarText: '#d4dff2',
    titleBarIcon: '#8aa3d4',
    titleBarBtnHover: 'rgba(138, 163, 212, 0.18)',

    // Tab 栏
    tabBarBg: '#111828',
    tabText: '#9aaad0',
    tabActiveText: '#e0ecff',
    tabIndicator: '#5a78c6',
    tabHoverBg: 'rgba(90, 120, 198, 0.16)',

    // 内容区域
    contentBg: '#121a2a',
    cardBg: '#182236',
    cardBorder: '#2c3f5e',

    // 文本颜色
    textPrimary: '#dbe6f7',
    textSecondary: '#aabbd8',
    textMuted: '#7386a6',

    // 资源条
    resourceHp: '#b8423c',
    resourceMp: '#3b6fd0',
    resourceSp: '#3d7d64',
    resourceExp: '#c0913a',

    // 品质颜色
    qualityUnique: '#d7a35b',
    qualityMythic: '#b44874',
    qualityLegendary: '#e1c36d',
    qualityEpic: '#7a5bc8',
    qualityRare: '#4b7dcf',
    qualityUncommon: '#4f8a69',

    // 交互状态
    primaryBg: '#3c5fb8',
    primaryText: '#eef4ff',
    success: '#4a9a6a',
    warning: '#d1a343',
    error: '#c65045',

    // 命定系统
    affection: '#6b58c3',
    affectionBg: 'rgba(107, 88, 195, 0.28)',
    affectionText: '#a595e0',
    tagPresent: 'rgba(74, 164, 112, 0.2)',
    tagPresentText: '#7fc6a2',
    tagContract: 'rgba(170, 88, 164, 0.22)',
    tagContractText: '#d2a0d0',

    // 登神长阶
    ascensionElement: 'rgba(76, 146, 230, 0.18)',
    ascensionPower: 'rgba(236, 170, 64, 0.16)',
    ascensionLaw: 'rgba(146, 88, 202, 0.18)',

    // 货币
    currencyGold: '#f1cf6a',
    currencySilver: '#b7c1cc',
    currencyCopper: '#b07a4a',
  },
};

/**
 * 古铜金主题
 * 华丽、皇室、金属质感
 */
const BronzeTheme: Theme = {
  id: 'bronze',
  name: '古铜金',
  colors: {
    // 窗口容器
    windowBg: '#14160f',
    windowBorder: '#6c6134',

    // 标题栏
    titleBarBg: '#1d2115',
    titleBarText: '#f2e5bf',
    titleBarIcon: '#c8b06a',
    titleBarBtnHover: 'rgba(200, 176, 106, 0.18)',

    // Tab 栏
    tabBarBg: '#181c12',
    tabText: '#c1b082',
    tabActiveText: '#f9edc8',
    tabIndicator: '#9a7f2f',
    tabHoverBg: 'rgba(154, 127, 47, 0.18)',

    // 内容区域
    contentBg: '#171a12',
    cardBg: '#212518',
    cardBorder: '#4f4b2a',

    // 文本颜色
    textPrimary: '#f1e4c3',
    textSecondary: '#cbb486',
    textMuted: '#9a8660',

    // 资源条
    resourceHp: '#b23c2f',
    resourceMp: '#335aa2',
    resourceSp: '#377551',
    resourceExp: '#b98a2b',

    // 品质颜色
    qualityUnique: '#d39b42',
    qualityMythic: '#b3455c',
    qualityLegendary: '#e2b858',
    qualityEpic: '#6d56b6',
    qualityRare: '#3c74bf',
    qualityUncommon: '#4a8460',

    // 交互状态
    primaryBg: '#8d6a1f',
    primaryText: '#fff4dc',
    success: '#48925f',
    warning: '#d49a2f',
    error: '#bf4533',

    // 命定系统
    affection: '#a85e44',
    affectionBg: 'rgba(168, 94, 68, 0.26)',
    affectionText: '#d0a57d',
    tagPresent: 'rgba(68, 148, 92, 0.2)',
    tagPresentText: '#83be98',
    tagContract: 'rgba(178, 64, 64, 0.22)',
    tagContractText: '#d59a94',

    // 登神长阶
    ascensionElement: 'rgba(66, 128, 206, 0.16)',
    ascensionPower: 'rgba(220, 160, 36, 0.18)',
    ascensionLaw: 'rgba(146, 82, 180, 0.16)',

    // 货币
    currencyGold: '#e6c04a',
    currencySilver: '#bdb8b0',
    currencyCopper: '#a8743e',
  },
};

/**
 * 粉紫色主题
 * 梦幻、浪漫、可爱风格
 */
const SakuraTheme: Theme = {
  id: 'sakura',
  name: '樱花粉紫',
  colors: {
    // 窗口容器
    windowBg: '#1b1016',
    windowBorder: '#6a3a52',

    // 标题栏
    titleBarBg: '#291820',
    titleBarText: '#f1d7e2',
    titleBarIcon: '#cf8faf',
    titleBarBtnHover: 'rgba(207, 143, 175, 0.18)',

    // Tab 栏
    tabBarBg: '#22131b',
    tabText: '#c9a0b8',
    tabActiveText: '#f8ddeb',
    tabIndicator: '#c06a95',
    tabHoverBg: 'rgba(192, 106, 149, 0.16)',

    // 内容区域
    contentBg: '#1f141b',
    cardBg: '#2a1a23',
    cardBorder: '#563345',

    // 文本颜色
    textPrimary: '#f2dce7',
    textSecondary: '#d0adc2',
    textMuted: '#a27a90',

    // 资源条
    resourceHp: '#c3516b',
    resourceMp: '#5a6fd2',
    resourceSp: '#4d9a76',
    resourceExp: '#c28b52',

    // 品质颜色
    qualityUnique: '#d99a69',
    qualityMythic: '#c24d7b',
    qualityLegendary: '#e0b56a',
    qualityEpic: '#8e57c6',
    qualityRare: '#5a80d0',
    qualityUncommon: '#5a9a74',

    // 交互状态
    primaryBg: '#b45a86',
    primaryText: '#fff0f8',
    success: '#4fa070',
    warning: '#d3a44a',
    error: '#d14a69',

    // 命定系统
    affection: '#c56a9a',
    affectionBg: 'rgba(197, 106, 154, 0.28)',
    affectionText: '#e5aec8',
    tagPresent: 'rgba(96, 176, 120, 0.2)',
    tagPresentText: '#8ac7a8',
    tagContract: 'rgba(206, 84, 138, 0.22)',
    tagContractText: '#e4a2c0',

    // 登神长阶
    ascensionElement: 'rgba(110, 150, 230, 0.16)',
    ascensionPower: 'rgba(240, 160, 80, 0.16)',
    ascensionLaw: 'rgba(178, 88, 206, 0.18)',

    // 货币
    currencyGold: '#f2c85a',
    currencySilver: '#c8c3d0',
    currencyCopper: '#b57a64',
  },
};

/**
 * 墨黑主题
 * 极简、现代、高对比度
 */
const ObsidianTheme: Theme = {
  id: 'obsidian',
  name: '墨黑',
  colors: {
    // 窗口容器
    windowBg: '#0a0a0d',
    windowBorder: '#2d2f36',

    // 标题栏
    titleBarBg: '#121218',
    titleBarText: '#e6e8f0',
    titleBarIcon: '#a0a6b2',
    titleBarBtnHover: 'rgba(160, 166, 178, 0.18)',

    // Tab 栏
    tabBarBg: '#0f0f14',
    tabText: '#a0a6b0',
    tabActiveText: '#f1f3fb',
    tabIndicator: '#6b7280',
    tabHoverBg: 'rgba(107, 114, 128, 0.16)',

    // 内容区域
    contentBg: '#111116',
    cardBg: '#17171d',
    cardBorder: '#2e313a',

    // 文本颜色
    textPrimary: '#e9edf5',
    textSecondary: '#b2b7c2',
    textMuted: '#7a7f8b',

    // 资源条
    resourceHp: '#c0443f',
    resourceMp: '#3f6ec7',
    resourceSp: '#3f8a64',
    resourceExp: '#c99a3a',

    // 品质颜色
    qualityUnique: '#dba15b',
    qualityMythic: '#c14c70',
    qualityLegendary: '#e2c06a',
    qualityEpic: '#7a5bc2',
    qualityRare: '#4f7fc8',
    qualityUncommon: '#4f8e6a',

    // 交互状态
    primaryBg: '#3f4654',
    primaryText: '#f3f6ff',
    success: '#4a9a6b',
    warning: '#d4a544',
    error: '#d04a4a',

    // 命定系统
    affection: '#a8506b',
    affectionBg: 'rgba(168, 80, 107, 0.28)',
    affectionText: '#d29bad',
    tagPresent: 'rgba(72, 160, 100, 0.2)',
    tagPresentText: '#7fc6a0',
    tagContract: 'rgba(184, 72, 100, 0.22)',
    tagContractText: '#d59aac',

    // 登神长阶
    ascensionElement: 'rgba(80, 140, 220, 0.18)',
    ascensionPower: 'rgba(210, 150, 60, 0.18)',
    ascensionLaw: 'rgba(150, 80, 200, 0.18)',

    // 货币
    currencyGold: '#e2c24f',
    currencySilver: '#aeb4bf',
    currencyCopper: '#b07c4c',
  },
};

/**
 * 羊皮纸米黄主题（浅色）
 * 明亮、古典、复古纸张质感
 */
const IvoryTheme: Theme = {
  id: 'ivory',
  name: '米黄羊皮纸',
  colors: {
    // 窗口容器
    windowBg: '#f4efe6',
    windowBorder: '#c6ab7d',

    // 标题栏
    titleBarBg: '#eadfce',
    titleBarText: '#4a3520',
    titleBarIcon: '#7a5a38',
    titleBarBtnHover: 'rgba(122, 90, 56, 0.14)',

    // Tab 栏
    tabBarBg: '#efe5d6',
    tabText: '#7a6048',
    tabActiveText: '#3b2a18',
    tabIndicator: '#b58a4a',
    tabHoverBg: 'rgba(181, 138, 74, 0.14)',

    // 内容区域
    contentBg: '#f1e8da',
    cardBg: '#fbf6ee',
    cardBorder: '#d4c2a4',

    // 文本颜色
    textPrimary: '#2d2214',
    textSecondary: '#5f4d3b',
    textMuted: '#8e7a66',

    // 资源条
    resourceHp: '#9f2f24',
    resourceMp: '#1e4f9a',
    resourceSp: '#1f6e45',
    resourceExp: '#94651f',

    // 品质颜色
    qualityUnique: '#c8872b',
    qualityMythic: '#b23d5a',
    qualityLegendary: '#c49a32',
    qualityEpic: '#6e4ab4',
    qualityRare: '#2e69b2',
    qualityUncommon: '#2f7a4a',

    // 交互状态
    primaryBg: '#b58a4a',
    primaryText: '#ffffff',
    success: '#2f7b52',
    warning: '#c99633',
    error: '#b64333',

    // 命定系统
    affection: '#b35b6d',
    affectionBg: 'rgba(179, 91, 109, 0.18)',
    affectionText: '#8b3d4d',
    tagPresent: 'rgba(56, 140, 90, 0.16)',
    tagPresentText: '#2a6a44',
    tagContract: 'rgba(176, 64, 92, 0.16)',
    tagContractText: '#9a3352',

    // 登神长阶
    ascensionElement: 'rgba(44, 104, 176, 0.14)',
    ascensionPower: 'rgba(198, 122, 38, 0.14)',
    ascensionLaw: 'rgba(118, 70, 178, 0.14)',

    // 货币
    currencyGold: '#c7a531',
    currencySilver: '#8a8a8a',
    currencyCopper: '#a46a34',
  },
};

/** 所有预设主题 */
export const ThemePresets: Record<ThemePresetId, Theme> = {
  parchment: ParchmentTheme,
  crimson: CrimsonTheme,
  indigo: IndigoTheme,
  bronze: BronzeTheme,
  sakura: SakuraTheme,
  obsidian: ObsidianTheme,
  ivory: IvoryTheme,
};

/** 默认主题 */
export const DefaultTheme = ParchmentTheme;

/** 主题列表（用于选择器） */
export const ThemeList: Array<{ id: ThemePresetId; name: string }> = [
  { id: 'parchment', name: '羊皮纸' },
  { id: 'crimson', name: '暗酒红' },
  { id: 'indigo', name: '深靛蓝' },
  { id: 'bronze', name: '古铜金' },
  { id: 'sakura', name: '樱花粉紫' },
  { id: 'obsidian', name: '墨黑' },
  { id: 'ivory', name: '米黄羊皮纸' },
];
