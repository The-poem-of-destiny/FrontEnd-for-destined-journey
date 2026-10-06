import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { DefaultTheme, ThemePresets } from '../../config/theme-presets';
import type { Theme, ThemeColors, ThemePresetId } from '../types';

interface QualityUniqueGradientOverride {
  start: string;
  end: string;
  angle: number;
}

interface ThemeState {
  /** 当前选中的主题ID */
  currentThemeId: ThemePresetId;
  /** 唯一品质颜色覆盖值；为空时使用当前预设颜色 */
  qualityUniqueOverride: string | null;
  /** 唯一品质渐变覆盖值；为空时使用纯色 */
  qualityUniqueGradientOverride: QualityUniqueGradientOverride | null;
  /** 是否已加载 */
  loaded: boolean;
}

const UNIQUE_COLOR_VARIABLE = 'status_theme_quality_unique_color';
const UNIQUE_GRADIENT_VARIABLE = 'status_theme_quality_unique_gradient';
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const GRADIENT_ANGLE_MIN = 0;
const GRADIENT_ANGLE_MAX = 360;

const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' && HEX_COLOR_PATTERN.test(value);

const normalizeGradient = (value: unknown): QualityUniqueGradientOverride | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const angle = Number(raw.angle);
  if (
    !isHexColor(raw.start) ||
    !isHexColor(raw.end) ||
    !Number.isFinite(angle) ||
    angle < GRADIENT_ANGLE_MIN ||
    angle > GRADIENT_ANGLE_MAX
  ) {
    return null;
  }
  return { start: raw.start, end: raw.end, angle };
};

const gradientCss = (gradient: QualityUniqueGradientOverride | null): string =>
  gradient
    ? `linear-gradient(${gradient.angle}deg, ${gradient.start}, ${gradient.end})`
    : 'currentColor';

const getThemeWithOverride = (theme: Theme, qualityUniqueOverride: string | null): Theme => {
  if (!qualityUniqueOverride) {
    return theme;
  }

  return {
    ...theme,
    colors: {
      ...theme.colors,
      qualityUnique: qualityUniqueOverride,
    },
  };
};

interface ThemeActions {
  /** 从酒馆变量加载主题 */
  loadTheme: () => void;
  /** 保存主题到酒馆变量 */
  saveTheme: () => Promise<void>;
  /** 切换主题 */
  setTheme: (themeId: ThemePresetId) => void;
  /** 设置唯一品质颜色覆盖值 */
  setQualityUniqueOverride: (color: string) => void;
  /** 设置唯一品质渐变覆盖值 */
  setQualityUniqueGradientOverride: (gradient: QualityUniqueGradientOverride) => void;
  /** 清除唯一品质颜色覆盖值，恢复当前预设颜色 */
  resetQualityUniqueOverride: () => Promise<void>;
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
    qualityUniqueOverride: null,
    qualityUniqueGradientOverride: null,

    // Actions

    loadTheme: () => {
      try {
        const variables = getVariables({ type: 'character' });
        const savedThemeId = _.get(variables, 'status_theme_id', null) as ThemePresetId | null;
        const savedUniqueColor = _.get(variables, UNIQUE_COLOR_VARIABLE, null);
        let savedUniqueGradient: QualityUniqueGradientOverride | null = null;
        try {
          savedUniqueGradient = normalizeGradient(
            JSON.parse(String(_.get(variables, UNIQUE_GRADIENT_VARIABLE, ''))),
          );
        } catch {
          savedUniqueGradient = null;
        }

        set(state => {
          if (savedThemeId && ThemePresets[savedThemeId]) {
            state.currentThemeId = savedThemeId;
          }
          state.qualityUniqueGradientOverride = savedUniqueGradient;
          state.qualityUniqueOverride =
            savedUniqueGradient?.start ?? (isHexColor(savedUniqueColor) ? savedUniqueColor : null);
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
        const variablesToSave: Record<string, string> = {
          status_theme_id: get().currentThemeId,
        };
        const { qualityUniqueOverride, qualityUniqueGradientOverride } = get();
        if (qualityUniqueOverride) {
          variablesToSave[UNIQUE_COLOR_VARIABLE] = qualityUniqueOverride;
        }
        if (qualityUniqueGradientOverride) {
          variablesToSave[UNIQUE_GRADIENT_VARIABLE] = JSON.stringify(qualityUniqueGradientOverride);
        }

        await insertOrAssignVariables(variablesToSave, { type: 'character' });
        if (!qualityUniqueOverride) {
          await deleteVariable(UNIQUE_COLOR_VARIABLE, { type: 'character' });
        }
        if (!qualityUniqueGradientOverride) {
          await deleteVariable(UNIQUE_GRADIENT_VARIABLE, { type: 'character' });
        }
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

    setQualityUniqueOverride: color => {
      if (!isHexColor(color)) {
        console.warn(`[StatusBar] 无效的唯一品质颜色: ${color}`);
        return;
      }

      set(state => {
        state.qualityUniqueOverride = color;
        state.qualityUniqueGradientOverride = null;
      });
      get().applyCssVariables();
    },

    setQualityUniqueGradientOverride: gradient => {
      const normalized = normalizeGradient(gradient);
      if (!normalized) {
        console.warn('[StatusBar] 无效的唯一品质渐变');
        return;
      }

      set(state => {
        state.qualityUniqueOverride = normalized.start;
        state.qualityUniqueGradientOverride = normalized;
      });
      get().applyCssVariables();
    },

    resetQualityUniqueOverride: async () => {
      set(state => {
        state.qualityUniqueOverride = null;
        state.qualityUniqueGradientOverride = null;
      });

      try {
        await deleteVariable(UNIQUE_COLOR_VARIABLE, { type: 'character' });
        await deleteVariable(UNIQUE_GRADIENT_VARIABLE, { type: 'character' });
      } catch (error) {
        console.error('[StatusBar] 恢复唯一品质默认颜色失败:', error);
      }

      get().applyCssVariables();
    },

    reset: async () => {
      set(state => {
        state.currentThemeId = DefaultTheme.id;
        state.qualityUniqueOverride = null;
        state.qualityUniqueGradientOverride = null;
      });

      try {
        await deleteVariable('status_theme_id', { type: 'character' });
        await deleteVariable(UNIQUE_COLOR_VARIABLE, { type: 'character' });
        await deleteVariable(UNIQUE_GRADIENT_VARIABLE, { type: 'character' });
      } catch (error) {
        console.error('[StatusBar] 重置主题失败:', error);
      }

      get().applyCssVariables();
    },

    getCurrentTheme: () => {
      const { currentThemeId, qualityUniqueOverride } = get();
      const theme = ThemePresets[currentThemeId] || DefaultTheme;
      return getThemeWithOverride(theme, qualityUniqueOverride);
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
      root.style.setProperty(
        '--theme-quality-unique-gradient',
        gradientCss(get().qualityUniqueGradientOverride),
      );

      // 标记主题明暗，供样式层按浅色/深色主题适配
      const bg = colors.windowBg;
      const match = /^#([0-9a-f]{6})$/i.exec(bg);
      if (match) {
        const channels = [0, 2, 4].map(i => parseInt(match[1].slice(i, i + 2), 16) / 255);
        const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
        root.dataset.themeMode = luminance > 0.5 ? 'light' : 'dark';
      }
    },
  })),
);
