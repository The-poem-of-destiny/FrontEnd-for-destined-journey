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
  /** 窗口阴影 */
  windowShadow: string;

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

  // 品质颜色
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
}

/**
 * 主题配置
 */
export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}
