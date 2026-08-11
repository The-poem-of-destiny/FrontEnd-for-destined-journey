import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { DefaultTheme, ThemePresets } from '../../config/theme-presets';
import type { Theme, ThemeColors, ThemePresetId } from '../types';

interface ThemeState {
  /** 当前选中的主题ID */
  currentThemeId: ThemePresetId;
  /** 是否已加载 */
  loaded: boolean;
}

interface ThemeActions {
  /** 从酒馆变量加载主题 */
  loadTheme: () => void;
  /** 保存主题到酒馆变量 */
  saveTheme: () => Promise<void>;
  /** 切换主题 */
  setTheme: (themeId: ThemePresetId) => void;
  /** 重置为默认主题 */
  reset: () => Promise<void>;
  /** 应用 CSS 变量到 DOM */
  applyCssVariables: () => void;
  /** 获取当前主题 */
  getCurrentTheme: () => Theme;
  /** 获取当前主题颜色 */
  getColors: () => ThemeColors;
}

type ThemeStore = ThemeState & ThemeActions;

export const useThemeStore = create<ThemeStore>()(
  immer((set, get) => ({
    // State
    currentThemeId: DefaultTheme.id,
    loaded: false,

    // Actions

    loadTheme: () => {
      try {
        const variables = getVariables({ type: 'character' });
        const savedThemeId = _.get(variables, 'status_theme_id', null) as ThemePresetId | null;

        if (savedThemeId && ThemePresets[savedThemeId]) {
          set(state => {
            state.currentThemeId = savedThemeId;
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
          { status_theme_id: get().currentThemeId },
          { type: 'character' },
        );
      } catch (error) {
        console.error('[StatusBar] 保存主题失败:', error);
      }
    },

    setTheme: themeId => {
      if (!ThemePresets[themeId]) {
        console.warn(`[StatusBar] 未知主题ID: ${themeId}`);
        return;
      }

      set(state => {
        state.currentThemeId = themeId;
      });

      get().applyCssVariables();
    },

    reset: async () => {
      set(state => {
        state.currentThemeId = DefaultTheme.id;
      });

      try {
        await deleteVariable('status_theme_id', { type: 'character' });
      } catch (error) {
        console.error('[StatusBar] 重置主题失败:', error);
      }

      get().applyCssVariables();
    },

    getCurrentTheme: () => {
      const { currentThemeId } = get();
      return ThemePresets[currentThemeId] || DefaultTheme;
    },

    getColors: () => {
      return get().getCurrentTheme().colors;
    },

    applyCssVariables: () => {
      const colors = get().getColors();
      const root = document.documentElement;

      Object.entries(colors).forEach(([key, value]) => {
        // 驼峰转 kebab-case: windowBg -> window-bg
        const cssVarName = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVarName, String(value));
      });

      // 标记主题明暗，供样式层按浅色/深色主题适配
      const bg = colors.windowBg;
      const match = /^#([0-9a-f]{6})$/i.exec(bg);
      if (match) {
        const channels = [0, 2, 4].map(i => parseInt(match[1].slice(i, i + 2), 16) / 255);
        const luminance =
          0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
        root.dataset.themeMode = luminance > 0.5 ? 'light' : 'dark';
      }
    },
  })),
);
