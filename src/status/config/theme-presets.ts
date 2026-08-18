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
    titleBarBtnHover: '#caa06a2e',

    // Tab 栏
    tabBarBg: '#241810',
    tabText: '#c9ad85',
    tabActiveText: '#f8ebd2',
    tabIndicator: '#c28b48',
    tabHoverBg: '#c28b4829',

    // 内容区域
    contentBg: '#221912',
    cardBg: '#2c2016',
    cardBorder: '#5a412a',
    surfaceMuted: 'color-mix(in srgb, var(--theme-window-bg) 68%, var(--theme-card-bg) 32%)',
    overlayBg: 'color-mix(in srgb, var(--theme-window-bg) 62%, transparent)',

    // 文本颜色
    textPrimary: '#f4e3c8',
    textSecondary: '#d2b48c',
    textMuted: '#a1886b',

    // 资源条
    resourceHp: '#c21a15',
    resourceMp: '#3a5fcc',
    resourceSp: '#17883f',
    resourceExp: '#af7100',
    resourceText: '#e6d2b4',

    // 品质颜色
    qualityCommon: '#e4d1b0',
    qualityUnique: '#5ac5af',
    qualityMythic: '#f2464a',
    qualityLegendary: '#f4b330',
    qualityEpic: '#be80f4',
    qualityRare: '#7b95dd',
    qualityUncommon: '#64ab6d',

    // 交互状态
    primaryBg: '#91602c',
    primaryText: '#f9eed9',
    success: '#4f9b68',
    warning: '#d1a13f',
    error: '#c14a3a',
    errorText: '#ef8272',
    errorSolidText: '#fff',

    // 命定系统
    affection: '#d43957',
    affectionBg: '#d4395742',
    affectionText: '#d79aa8',
    tagPresent: '#4ca26033',
    tagPresentText: '#7fc39a',
    tagContract: '#ba345238',
    tagContractText: '#e19ab0',

    // 登神长阶
    ascensionElement: '#3f8ed629',
    ascensionPower: '#dc962829',
    ascensionLaw: '#9850ba29',

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
    titleBarBtnHover: '#c98a8f2e',

    // Tab 栏
    tabBarBg: '#231115',
    tabText: '#c99aa0',
    tabActiveText: '#f7d8dc',
    tabIndicator: '#b04a54',
    tabHoverBg: '#b04a5429',

    // 内容区域
    contentBg: '#1f1114',
    cardBg: '#2a171b',
    cardBorder: '#5a2a30',
    surfaceMuted: 'color-mix(in srgb, var(--theme-window-bg) 66%, var(--theme-card-bg) 34%)',
    overlayBg: 'color-mix(in srgb, var(--theme-window-bg) 54%, transparent)',

    // 文本颜色
    textPrimary: '#f2d7d9',
    textSecondary: '#d1a3a8',
    textMuted: '#b78388',

    // 资源条
    resourceHp: '#c2181c',
    resourceMp: '#385fcc',
    resourceSp: '#23873a',
    resourceExp: '#b07000',
    resourceText: '#e6bfc4',

    // 品质颜色
    qualityCommon: '#e6d1b0',
    qualityUnique: '#60c5a9',
    qualityMythic: '#f24552',
    qualityLegendary: '#f8b134',
    qualityEpic: '#bb81f6',
    qualityRare: '#7995dd',
    qualityUncommon: '#6caa67',

    // 交互状态
    primaryBg: '#94323b',
    primaryText: '#fae6e7',
    success: '#4e955f',
    warning: '#d0a040',
    error: '#d24b4f',
    errorText: '#f07a7f',
    errorSolidText: '#0d090a',

    // 命定系统
    affection: '#d23964',
    affectionBg: '#d2396447',
    affectionText: '#e29aa6',
    tagPresent: '#489e6233',
    tagPresentText: '#82c49a',
    tagContract: '#c4384c3d',
    tagContractText: '#e29aa2',

    // 登神长阶
    ascensionElement: '#4e80c429',
    ascensionPower: '#d8842429',
    ascensionLaw: '#9c48702e',

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
    titleBarBtnHover: '#8aa3d42e',

    // Tab 栏
    tabBarBg: '#111828',
    tabText: '#9aaad0',
    tabActiveText: '#e0ecff',
    tabIndicator: '#5a78c6',
    tabHoverBg: '#5a78c629',

    // 内容区域
    contentBg: '#121a2a',
    cardBg: '#182236',
    cardBorder: '#2c3f5e',
    surfaceMuted: 'color-mix(in srgb, var(--theme-window-bg) 70%, var(--theme-card-bg) 30%)',
    overlayBg: 'color-mix(in srgb, var(--theme-window-bg) 56%, transparent)',

    // 文本颜色
    textPrimary: '#dbe6f7',
    textSecondary: '#aabbd8',
    textMuted: '#8196b9',

    // 资源条
    resourceHp: '#c2152f',
    resourceMp: '#2962cc',
    resourceSp: '#008755',
    resourceExp: '#b66c01',
    resourceText: '#c7d4f0',

    // 品质颜色
    qualityCommon: '#ebceb2',
    qualityUnique: '#4ec4c4',
    qualityMythic: '#f0436e',
    qualityLegendary: '#ffab52',
    qualityEpic: '#ad86ff',
    qualityRare: '#6d99dc',
    qualityUncommon: '#42af87',

    // 交互状态
    primaryBg: '#3c5fb8',
    primaryText: '#eef4ff',
    success: '#4a9a6a',
    warning: '#d1a343',
    error: '#c65045',
    errorText: '#ee776b',
    errorSolidText: '#fff',

    // 命定系统
    affection: '#c53e92',
    affectionBg: '#c53e9247',
    affectionText: '#a595e0',
    tagPresent: '#4aa47033',
    tagPresentText: '#7fc6a2',
    tagContract: '#aa58a438',
    tagContractText: '#d2a0d0',

    // 登神长阶
    ascensionElement: '#4c92e62e',
    ascensionPower: '#ecaa4029',
    ascensionLaw: '#9258ca2e',

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
    titleBarBtnHover: '#c8b06a2e',

    // Tab 栏
    tabBarBg: '#181c12',
    tabText: '#c1b082',
    tabActiveText: '#f9edc8',
    tabIndicator: '#9a7f2f',
    tabHoverBg: '#9a7f2f2e',

    // 内容区域
    contentBg: '#171a12',
    cardBg: '#212518',
    cardBorder: '#4f4b2a',
    surfaceMuted: 'color-mix(in srgb, var(--theme-window-bg) 69%, var(--theme-card-bg) 31%)',
    overlayBg: 'color-mix(in srgb, var(--theme-window-bg) 55%, transparent)',

    // 文本颜色
    textPrimary: '#f1e4c3',
    textSecondary: '#cbb486',
    textMuted: '#aa956d',

    // 资源条
    resourceHp: '#c11c03',
    resourceMp: '#0c65ca',
    resourceSp: '#008844',
    resourceExp: '#ac7300',
    resourceText: '#e2d2a8',

    // 品质颜色
    qualityCommon: '#e2d3b0',
    qualityUnique: '#55c5b6',
    qualityMythic: '#f2483a',
    qualityLegendary: '#eeb72d',
    qualityEpic: '#9d8eff',
    qualityRare: '#5e9dd9',
    qualityUncommon: '#5bad74',

    // 交互状态
    primaryBg: '#8d6a1f',
    primaryText: '#fff4dc',
    success: '#48925f',
    warning: '#d49a2f',
    error: '#bf4533',
    errorText: '#e97862',
    errorSolidText: '#fff',

    // 命定系统
    affection: '#d53c3d',
    affectionBg: '#d53c3d42',
    affectionText: '#d0a57d',
    tagPresent: '#44945c33',
    tagPresentText: '#83be98',
    tagContract: '#b2404038',
    tagContractText: '#d59a94',

    // 登神长阶
    ascensionElement: '#4280ce29',
    ascensionPower: '#dca0242e',
    ascensionLaw: '#9252b429',

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
    titleBarBtnHover: '#cf8faf2e',

    // Tab 栏
    tabBarBg: '#22131b',
    tabText: '#c9a0b8',
    tabActiveText: '#f8ddeb',
    tabIndicator: '#c06a95',
    tabHoverBg: '#c06a9529',

    // 内容区域
    contentBg: '#1f141b',
    cardBg: '#2a1a23',
    cardBorder: '#563345',
    surfaceMuted: 'color-mix(in srgb, var(--theme-window-bg) 67%, var(--theme-card-bg) 33%)',
    overlayBg: 'color-mix(in srgb, var(--theme-window-bg) 54%, transparent)',

    // 文本颜色
    textPrimary: '#f2dce7',
    textSecondary: '#d0adc2',
    textMuted: '#a27a90',

    // 资源条
    resourceHp: '#c21820',
    resourceMp: '#3460cc',
    resourceSp: '#278739',
    resourceExp: '#b16f00',
    resourceText: '#e7c6d6',

    // 品质颜色
    qualityCommon: '#e7d0b1',
    qualityUnique: '#4ec4ca',
    qualityMythic: '#f24457',
    qualityLegendary: '#faaf36',
    qualityEpic: '#b882f8',
    qualityRare: '#7696dd',
    qualityUncommon: '#6faa64',

    // 交互状态
    primaryBg: '#a44875',
    primaryText: '#fff0f8',
    success: '#4fa070',
    warning: '#d3a44a',
    error: '#d14a69',
    errorText: '#ef7190',
    errorSolidText: '#100a0d',

    // 命定系统
    affection: '#d0396d',
    affectionBg: '#d0396d47',
    affectionText: '#e5aec8',
    tagPresent: '#60b07833',
    tagPresentText: '#8ac7a8',
    tagContract: '#ce548a38',
    tagContractText: '#e4a2c0',

    // 登神长阶
    ascensionElement: '#6e96e629',
    ascensionPower: '#f0a05029',
    ascensionLaw: '#b258ce2e',

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
    windowBg: '#15171c',
    windowBorder: '#323846',

    // 标题栏
    titleBarBg: '#1a1d24',
    titleBarText: '#f3f5f8',
    titleBarIcon: '#b9c0cc',
    titleBarBtnHover: '#ffffff14',

    // Tab 栏
    tabBarBg: '#171a21',
    tabText: '#a6afbd',
    tabActiveText: '#f4f7fb',
    tabIndicator: '#8f9fff',
    tabHoverBg: '#ffffff0f',

    // 内容区域
    contentBg: '#12151b',
    cardBg: '#1b1f27',
    cardBorder: '#2c3340',
    surfaceMuted: 'color-mix(in srgb, var(--theme-window-bg) 74%, var(--theme-card-bg) 26%)',
    overlayBg: 'color-mix(in srgb, var(--theme-window-bg) 60%, transparent)',

    // 文本颜色
    textPrimary: '#f3f5f8',
    textSecondary: '#c1c8d4',
    textMuted: '#8f98a8',

    // 资源条
    resourceHp: '#c21627',
    resourceMp: '#2962cc',
    resourceSp: '#008850',
    resourceExp: '#b36e00',
    resourceText: '#f3f5f8',

    // 品质颜色
    qualityCommon: '#e8d0b1',
    qualityUnique: '#4fc5c1',
    qualityMythic: '#f14362',
    qualityLegendary: '#fdae39',
    qualityEpic: '#af85fe',
    qualityRare: '#6d99dc',
    qualityUncommon: '#4aae81',

    // 交互状态
    primaryBg: '#8f9fff',
    primaryText: '#10131a',
    success: '#35c98a',
    warning: '#f0b84b',
    error: '#ff6d6d',
    errorText: '#ff6d6d',
    errorSolidText: '#10131a',

    // 命定系统
    affection: '#cc3b80',
    affectionBg: '#cc3b802e',
    affectionText: '#ffb2c1',
    tagPresent: '#35c98a29',
    tagPresentText: '#7ce3b4',
    tagContract: '#ff6f9129',
    tagContractText: '#ffb0c0',

    // 登神长阶
    ascensionElement: '#5b8cff1f',
    ascensionPower: '#f0b84b1f',
    ascensionLaw: '#9a72f81f',

    // 货币
    currencyGold: '#f5c24f',
    currencySilver: '#d4dae4',
    currencyCopper: '#d18b62',
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
    windowBg: '#f1e8dc',
    windowBorder: '#c3a97c',

    // 标题栏
    titleBarBg: '#e4d6c4',
    titleBarText: '#443220',
    titleBarIcon: '#745738',
    titleBarBtnHover: '#7457381f',

    // Tab 栏
    tabBarBg: '#eadfce',
    tabText: '#725944',
    tabActiveText: '#372615',
    tabIndicator: '#936526',
    tabHoverBg: '#b083431f',

    // 内容区域
    contentBg: '#ede2d2',
    cardBg: '#f5efe4',
    cardBorder: '#cdbb9b',
    surfaceMuted: 'color-mix(in srgb, var(--theme-window-bg) 64%, var(--theme-card-bg) 36%)',
    overlayBg: 'color-mix(in srgb, var(--theme-window-bg) 52%, transparent)',

    // 文本颜色
    textPrimary: '#2b2116',
    textSecondary: '#5a4836',
    textMuted: '#6f5a48',

    // 资源条
    resourceHp: '#d15d4d',
    resourceMp: '#6280d4',
    resourceSp: '#4a925c',
    resourceExp: '#aa7a39',
    resourceText: '#f8f4ec',

    // 品质颜色
    qualityCommon: '#776748',
    qualityUnique: '#15806e',
    qualityMythic: '#d12a2b',
    qualityLegendary: '#a65a00',
    qualityEpic: '#833fae',
    qualityRare: '#4a5ba0',
    qualityUncommon: '#206d35',

    // 交互状态
    primaryBg: '#b58a4a',
    primaryText: '#2b2116',
    success: '#1f5e3c',
    warning: '#8a6422',
    error: '#8f2f23',
    errorText: '#8f2f23',
    errorSolidText: '#fff',

    // 命定系统
    affection: '#d63b4b',
    affectionBg: '#d63b4b2e',
    affectionText: '#6f2d3a',
    tagPresent: '#388c5a29',
    tagPresentText: '#1f5a3a',
    tagContract: '#b0405c29',
    tagContractText: '#7a2543',

    // 登神长阶
    ascensionElement: '#2c68b024',
    ascensionPower: '#c67a2624',
    ascensionLaw: '#7646b224',

    // 货币
    currencyGold: '#80600d',
    currencySilver: '#8a8a8a',
    currencyCopper: '#a46a34',
  },
};

/**
 * 雾紫主题（浅色）
 * 轻雾、柔紫、低饱和氛围
 */
const MistyLilacTheme: Theme = {
  id: 'misty-lilac',
  name: '雾紫',
  colors: {
    // 窗口容器
    windowBg: '#F1EDF6',
    windowBorder: '#8574A3',

    // 标题栏
    titleBarBg: '#D5CCE2',
    titleBarText: '#41374C',
    titleBarIcon: '#635C6F',
    titleBarBtnHover: '#7058a61f',

    // Tab 栏
    tabBarBg: '#ECE6F2',
    tabText: '#635C6F',
    tabActiveText: '#41374C',
    tabIndicator: '#7255A8',
    tabHoverBg: '#7255a81f',

    // 内容区域
    contentBg: '#EFEAF5',
    cardBg: '#F6F2FA',
    cardBorder: '#C8C1D6',
    surfaceMuted: 'color-mix(in srgb, var(--theme-window-bg) 62%, var(--theme-card-bg) 38%)',
    overlayBg: 'color-mix(in srgb, var(--theme-window-bg) 50%, transparent)',

    // 文本颜色
    textPrimary: '#3a3145',
    textSecondary: '#5a5368',
    textMuted: '#544c62',

    // 资源条
    resourceHp: '#d15c56',
    resourceMp: '#5b84d5',
    resourceSp: '#3f9569',
    resourceExp: '#ae7a3d',
    resourceText: '#faf7ff',

    // 品质颜色
    qualityCommon: '#7c674b',
    qualityUnique: '#008280',
    qualityMythic: '#d32a48',
    qualityLegendary: '#ad5719',
    qualityEpic: '#7948bb',
    qualityRare: '#3d61a1',
    qualityUncommon: '#00704e',

    // 交互状态
    primaryBg: '#7A5CB3',
    primaryText: '#fbf8ff',
    success: '#1f7a45',
    warning: '#8f6219',
    error: '#b02337',
    errorText: '#b02337',
    errorSolidText: '#fff',

    // 命定系统
    affection: '#d33e7b',
    affectionBg: '#d33e7b38',
    affectionText: '#4a3f5c',
    tagPresent: '#2e995729',
    tagPresentText: '#155243',
    tagContract: '#d92f4529',
    tagContractText: '#8e1f5e',

    // 登神长阶
    ascensionElement: '#3173d924',
    ascensionPower: '#b9892d24',
    ascensionLaw: '#7558ab24',

    // 货币
    currencyGold: '#886015',
    currencySilver: '#6F667A',
    currencyCopper: '#8C7BAB',
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
  'misty-lilac': MistyLilacTheme,
};

/** 默认主题 */
export const DefaultTheme = IvoryTheme;

/** 主题列表（用于选择器） */
export const ThemeList: Array<{ id: ThemePresetId; name: string }> = [
  { id: 'parchment', name: '羊皮纸' },
  { id: 'crimson', name: '暗酒红' },
  { id: 'indigo', name: '深靛蓝' },
  { id: 'bronze', name: '古铜金' },
  { id: 'sakura', name: '樱花粉紫' },
  { id: 'obsidian', name: '墨黑' },
  { id: 'ivory', name: '米黄羊皮纸' },
  { id: 'misty-lilac', name: '雾紫' },
];
