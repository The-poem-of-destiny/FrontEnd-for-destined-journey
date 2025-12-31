import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { DefaultTheme } from '../hooks';
import type { Theme, ThemeColors } from '../types';

interface ThemeState {
  /** 当前主题 */
  currentTheme: Theme;
  /** 用户自定义颜色（覆盖默认） */
  userColors: Partial<ThemeColors> | null;
  /** 是否已加载 */
  loaded: boolean;
}

interface ThemeActions {
  /** 从酒馆变量加载主题 */
  loadTheme: () => void;
  /** 保存主题到酒馆变量 */
  saveTheme: () => Promise<void>;
  /** 更新单个颜色 */
  updateColor: (key: keyof ThemeColors, value: string) => void;
  /** 更新多个颜色 */
  updateColors: (colors: Partial<ThemeColors>) => void;
  /** 重置为默认主题 */
  reset: () => Promise<void>;
  /** 应用 CSS 变量到 DOM */
  applyCssVariables: () => void;
  /** 获取有效颜色（合并用户自定义和默认） */
  getEffectiveColors: () => ThemeColors;
}

type ThemeStore = ThemeState & ThemeActions;

export const useThemeStore = create<ThemeStore>()(
  immer((set, get) => ({
    // State
    currentTheme: DefaultTheme,
    userColors: null,
    loaded: false,

    // Actions

    loadTheme: () => {
      try {
        const variables = getVariables({ type: 'character' });
        const themeData = _.get(variables, 'status_theme', null);

        if (themeData && typeof themeData === 'object') {
          set(state => {
            state.userColors = themeData as Partial<ThemeColors>;
          });
        }

        set(state => {
          state.loaded = true;
        });

        // 应用 CSS 变量
        get().applyCssVariables();
      } catch (error) {
        console.error('[StatusBar] 加载主题失败:', error);
        set(state => {
          state.loaded = true;
        });
      }
    },

    saveTheme: async () => {
      try {
        await insertOrAssignVariables(
          { status_theme: get().userColors || {} },
          { type: 'character' },
        );
      } catch (error) {
        console.error('[StatusBar] 保存主题失败:', error);
      }
    },

    updateColor: (key, value) => {
      set(state => {
        if (!state.userColors) {
          state.userColors = {};
        }
        state.userColors[key] = value;
      });
      get().applyCssVariables();
    },

    updateColors: colors => {
      set(state => {
        if (!state.userColors) {
          state.userColors = {};
        }
        Object.assign(state.userColors, colors);
      });
      get().applyCssVariables();
    },

    reset: async () => {
      set(state => {
        state.userColors = null;
      });

      try {
        await deleteVariable('status_theme', { type: 'character' });
      } catch (error) {
        console.error('[StatusBar] 重置主题失败:', error);
      }

      get().applyCssVariables();
    },

    getEffectiveColors: () => {
      const { currentTheme, userColors } = get();
      if (!userColors) return currentTheme.colors;
      return { ...currentTheme.colors, ...userColors };
    },

    applyCssVariables: () => {
      const colors = get().getEffectiveColors();
      const root = document.documentElement;

      Object.entries(colors).forEach(([key, value]) => {
        // 驼峰转 kebab-case: windowBg -> window-bg
        const cssVarName = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVarName, String(value));
      });
    },
  })),
);
