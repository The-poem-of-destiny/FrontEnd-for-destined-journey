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
    surfaceMuted: 'color-mix(in srgb, var(--theme-window-bg) 68%, var(--theme-card-bg) 32%)',
    overlayBg: 'color-mix(in srgb, var(--theme-window-bg) 62%, transparent)',

    // 文本颜色
    textPrimary: '#f4e3c8',
    textSecondary: '#d2b48c',
    textMuted: '#a1886b',

    // 资源条
    resourceHp: '#b73a2b',
    resourceMp: '#305fa8',
    resourceSp: '#3b7f52',
    resourceExp: '#c08a2f',
    resourceText: '#e6d2b4',

    // 品质颜色
    qualityCommon: '#e4d6bb',
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
    surfaceMuted: 'color-mix(in srgb, var(--theme-window-bg) 66%, var(--theme-card-bg) 34%)',
    overlayBg: 'color-mix(in srgb, var(--theme-window-bg) 54%, transparent)',

    // 文本颜色
    textPrimary: '#f2d7d9',
    textSecondary: '#d1a3a8',
    textMuted: '#9f6f74',

    // 资源条
    resourceHp: '#c23a3a',
    resourceMp: '#3b4f9a',
    resourceSp: '#3e7a55',
    resourceExp: '#c0893c',
    resourceText: '#e6bfc4',

    // 品质颜色
    qualityCommon: '#e6c0c4',
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
    surfaceMuted: 'color-mix(in srgb, var(--theme-window-bg) 70%, var(--theme-card-bg) 30%)',
    overlayBg: 'color-mix(in srgb, var(--theme-window-bg) 56%, transparent)',

    // 文本颜色
    textPrimary: '#dbe6f7',
    textSecondary: '#aabbd8',
    textMuted: '#7386a6',

    // 资源条
    resourceHp: '#b8423c',
    resourceMp: '#3b6fd0',
    resourceSp: '#3d7d64',
    resourceExp: '#c0913a',
    resourceText: '#c7d4f0',

    // 品质颜色
    qualityCommon: '#d5e0f2',
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
    surfaceMuted: 'color-mix(in srgb, var(--theme-window-bg) 69%, var(--theme-card-bg) 31%)',
    overlayBg: 'color-mix(in srgb, var(--theme-window-bg) 55%, transparent)',

    // 文本颜色
    textPrimary: '#f1e4c3',
    textSecondary: '#cbb486',
    textMuted: '#9a8660',

    // 资源条
    resourceHp: '#b23c2f',
    resourceMp: '#335aa2',
    resourceSp: '#377551',
    resourceExp: '#b98a2b',
    resourceText: '#e2d2a8',

    // 品质颜色
    qualityCommon: '#e3d5b2',
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
    surfaceMuted: 'color-mix(in srgb, var(--theme-window-bg) 67%, var(--theme-card-bg) 33%)',
    overlayBg: 'color-mix(in srgb, var(--theme-window-bg) 54%, transparent)',

    // 文本颜色
    textPrimary: '#f2dce7',
    textSecondary: '#d0adc2',
    textMuted: '#a27a90',

    // 资源条
    resourceHp: '#c3516b',
    resourceMp: '#5a6fd2',
    resourceSp: '#4d9a76',
    resourceExp: '#c28b52',
    resourceText: '#e7c6d6',

    // 品质颜色
    qualityCommon: '#e6cddc',
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
    windowBg: '#15171c',
    windowBorder: '#323846',

    // 标题栏
    titleBarBg: '#1a1d24',
    titleBarText: '#f3f5f8',
    titleBarIcon: '#b9c0cc',
    titleBarBtnHover: 'rgba(255, 255, 255, 0.08)',

    // Tab 栏
    tabBarBg: '#171a21',
    tabText: '#a6afbd',
    tabActiveText: '#f4f7fb',
    tabIndicator: '#8f9fff',
    tabHoverBg: 'rgba(255, 255, 255, 0.06)',

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
    resourceHp: '#ff5f57',
    resourceMp: '#5b8cff',
    resourceSp: '#35c98a',
    resourceExp: '#f0b84b',
    resourceText: '#f3f5f8',

    // 品质颜色
    qualityCommon: '#c9d2e0',
    qualityUnique: '#f09f4d',
    qualityMythic: '#e4587d',
    qualityLegendary: '#e5c166',
    qualityEpic: '#9a72f8',
    qualityRare: '#5d97ff',
    qualityUncommon: '#56bf7b',

    // 交互状态
    primaryBg: '#8f9fff',
    primaryText: '#10131a',
    success: '#35c98a',
    warning: '#f0b84b',
    error: '#ff6d6d',

    // 命定系统
    affection: '#ff6f91',
    affectionBg: 'rgba(255, 111, 145, 0.18)',
    affectionText: '#ffb2c1',
    tagPresent: 'rgba(53, 201, 138, 0.16)',
    tagPresentText: '#7ce3b4',
    tagContract: 'rgba(255, 111, 145, 0.16)',
    tagContractText: '#ffb0c0',

    // 登神长阶
    ascensionElement: 'rgba(91, 140, 255, 0.12)',
    ascensionPower: 'rgba(240, 184, 75, 0.12)',
    ascensionLaw: 'rgba(154, 114, 248, 0.12)',

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
    titleBarBtnHover: 'rgba(116, 87, 56, 0.12)',

    // Tab 栏
    tabBarBg: '#eadfce',
    tabText: '#725944',
    tabActiveText: '#372615',
    tabIndicator: '#b08343',
    tabHoverBg: 'rgba(176, 131, 67, 0.12)',

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
    resourceHp: '#8f2f24',
    resourceMp: '#1f4e9a',
    resourceSp: '#1f5e3c',
    resourceExp: '#8a5a1f',
    resourceText: '#f8f4ec',

    // 品质颜色
    qualityCommon: '#6b6258',
    qualityUnique: '#c8872b',
    qualityMythic: '#b23d5a',
    qualityLegendary: '#c49a32',
    qualityEpic: '#6e4ab4',
    qualityRare: '#2e69b2',
    qualityUncommon: '#2f7a4a',

    // 交互状态
    primaryBg: '#b58a4a',
    primaryText: '#2b2116',
    success: '#1f5e3c',
    warning: '#8a6422',
    error: '#8f2f23',

    // 命定系统
    affection: '#b35b6d',
    affectionBg: 'rgba(179, 91, 109, 0.18)',
    affectionText: '#6f2d3a',
    tagPresent: 'rgba(56, 140, 90, 0.16)',
    tagPresentText: '#1f5a3a',
    tagContract: 'rgba(176, 64, 92, 0.16)',
    tagContractText: '#7a2543',

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
    titleBarBtnHover: 'rgba(112, 88, 166, 0.12)',

    // Tab 栏
    tabBarBg: '#ECE6F2',
    tabText: '#635C6F',
    tabActiveText: '#41374C',
    tabIndicator: '#7255A8',
    tabHoverBg: 'rgba(114, 85, 168, 0.12)',

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
    resourceHp: '#b02337',
    resourceMp: '#2559b8',
    resourceSp: '#1f7a45',
    resourceExp: '#a66f14',
    resourceText: '#faf7ff',

    // 品质颜色
    qualityCommon: '#5b5468',
    qualityUnique: '#B8873A',
    qualityMythic: '#C22B80',
    qualityLegendary: '#CFA43B',
    qualityEpic: '#9072C7',
    qualityRare: '#3173D9',
    qualityUncommon: '#2E9957',

    // 交互状态
    primaryBg: '#7A5CB3',
    primaryText: '#2f273a',
    success: '#1f7a45',
    warning: '#8f6219',
    error: '#b02337',

    // 命定系统
    affection: '#F05CB2',
    affectionBg: 'rgba(240, 92, 178, 0.22)',
    affectionText: '#4a3f5c',
    tagPresent: 'rgba(46, 153, 87, 0.16)',
    tagPresentText: '#155243',
    tagContract: 'rgba(217, 47, 69, 0.16)',
    tagContractText: '#8e1f5e',

    // 登神长阶
    ascensionElement: 'rgba(49, 115, 217, 0.14)',
    ascensionPower: 'rgba(185, 137, 45, 0.14)',
    ascensionLaw: 'rgba(117, 88, 171, 0.14)',

    // 货币
    currencyGold: '#B9892D',
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
