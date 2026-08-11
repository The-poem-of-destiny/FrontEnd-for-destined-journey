/**
 * 主题类型定义
 * 基于新的窗口式布局设计
 */

/** 主题颜色配置 */
export interface ThemeColors {
  // 窗口容器
  /** 窗口背景色 */
  windowBg: string;
  /** 窗口边框色 */
  windowBorder: string;

  // 标题栏
  /** 标题栏背景色 */
  titleBarBg: string;
  /** 标题栏文字色 */
  titleBarText: string;
  /** 标题栏图标色 */
  titleBarIcon: string;
  /** 标题栏按钮悬停背景 */
  titleBarBtnHover: string;

  // Tab 栏
  /** Tab 栏背景色 */
  tabBarBg: string;
  /** Tab 默认文字色 */
  tabText: string;
  /** Tab 激活文字色 */
  tabActiveText: string;
  /** Tab 激活指示器色 */
  tabIndicator: string;
  /** Tab 悬停背景色 */
  tabHoverBg: string;

  // 内容区域
  /** 内容区背景色 */
  contentBg: string;
  /** 卡片背景色 */
  cardBg: string;
  /** 卡片边框色 */
  cardBorder: string;
  /** 柔和表面背景色 */
  surfaceMuted: string;
  /** 覆盖层背景色 */
  overlayBg: string;

  // 文本颜色
  /** 主要文本色 */
  textPrimary: string;
  /** 次要文本色 */
  textSecondary: string;
  /** 淡化文本色 */
  textMuted: string;

  // 资源条颜色
  /** 生命值颜色 */
  resourceHp: string;
  /** 法力值颜色 */
  resourceMp: string;
  /** 体力值颜色 */
  resourceSp: string;
  /** 经验值颜色 */
  resourceExp: string;
  /** 资源数值文字颜色 */
  resourceText: string;

  // 品质颜色
  /** 普通品质 */
  qualityCommon: string;
  /** 唯一品质 */
  qualityUnique: string;
  /** 神话品质 */
  qualityMythic: string;
  /** 传说品质 */
  qualityLegendary: string;
  /** 史诗品质 */
  qualityEpic: string;
  /** 稀有品质 */
  qualityRare: string;
  /** 精良品质 */
  qualityUncommon: string;

  // 交互状态
  /** 主按钮背景 */
  primaryBg: string;
  /** 主按钮文字 */
  primaryText: string;
  /** 成功状态 */
  success: string;
  /** 警告状态 */
  warning: string;
  /** 错误状态 */
  error: string;
  /** 错误正文文字 */
  errorText: string;
  /** 实底错误控件文字 */
  errorSolidText: string;

  // 命定系统专用
  /** 好感度条颜色 */
  affection: string;
  /** 好感度条背景 */
  affectionBg: string;
  /** 好感度文本 */
  affectionText: string;
  /** 在场标签背景 */
  tagPresent: string;
  /** 在场标签文本 */
  tagPresentText: string;
  /** 契约标签背景 */
  tagContract: string;
  /** 契约标签文本 */
  tagContractText: string;

  // 登神长阶颜色
  /** 要素颜色 */
  ascensionElement: string;
  /** 权能颜色 */
  ascensionPower: string;
  /** 法则颜色 */
  ascensionLaw: string;

  // 货币颜色
  /** 金币颜色 */
  currencyGold: string;
  /** 银币颜色 */
  currencySilver: string;
  /** 铜币颜色 */
  currencyCopper: string;
}

/**
 * 预设主题ID
 */
export type ThemePresetId =
  | 'parchment' // 西幻羊皮纸（默认）
  | 'crimson' // 暗酒红
  | 'indigo' // 深靛蓝
  | 'bronze' // 古铜金
  | 'sakura' // 粉紫色
  | 'obsidian' // 墨黑
  | 'ivory' // 羊皮纸米黄
  | 'misty-lilac'; // 雾紫

/**
 * 主题配置
 */
export interface Theme {
  id: ThemePresetId;
  name: string;
  colors: ThemeColors;
}
