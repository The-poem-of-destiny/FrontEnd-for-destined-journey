import type { Theme } from '../types/theme';

/** 默认主题 - 西幻羊皮纸 */
export const DefaultTheme: Theme = {
  id: 'default',
  name: '西幻羊皮纸',
  colors: {
    // 窗口容器
    windowBg: '#1a1410',
    windowBorder: '#5a3f2b',
    windowShadow: '0 12px 28px rgba(10, 6, 4, 0.55)',

    // 标题栏
    titleBarBg: '#2b2018',
    titleBarText: '#e7d4b5',
    titleBarIcon: '#c7a37a',
    titleBarBtnHover: 'rgba(199, 163, 122, 0.16)',

    // Tab 栏
    tabBarBg: '#221811',
    tabText: '#c3aa86',
    tabActiveText: '#f6e7cf',
    tabIndicator: '#b8905b',
    tabHoverBg: 'rgba(184, 144, 91, 0.14)',

    // 内容区域
    contentBg: '#231a14',
    cardBg: '#2a2018',
    cardBorder: '#4d392a',

    // 文本颜色
    textPrimary: '#f1e1c6',
    textSecondary: '#cfb38c',
    textMuted: '#9b8366',

    // 资源条
    resourceHp: '#b83a2c',
    resourceMp: '#2a6bb6',
    resourceSp: '#3a8b4f',
    resourceExp: '#c08b2f',

    // 品质颜色
    qualityUnique: '#d38b3d',
    qualityMythic: '#c33d5b',
    qualityLegendary: '#d7b25c',
    qualityEpic: '#8e4fb3',
    qualityRare: '#3f7fc4',
    qualityUncommon: '#4d8b5a',

    // 交互状态
    primaryBg: '#8b5a2b',
    primaryText: '#f7e9d2',
    success: '#4e9a62',
    warning: '#d9a441',
    error: '#c4493d',
  },
};
