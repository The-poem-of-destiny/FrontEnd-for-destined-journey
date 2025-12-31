import { Schema } from '@/data_schema/schema';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { StatData } from '../types';

interface MvuDataState {
  /** MVU 数据 */
  data: StatData | null;
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 最后刷新时间 */
  lastRefreshTime: Date | null;
}

interface MvuDataActions {
  /** 刷新数据 (Read) */
  refresh: () => void;
  /** 更新指定路径的值 */
  updateField: (path: string, value: unknown) => Promise<boolean>;
  /** 删除指定路径的值 */
  deleteField: (path: string) => Promise<boolean>;
}

type MvuDataStore = MvuDataState & MvuDataActions;

export const useMvuDataStore = create<MvuDataStore>()(
  immer((set, get) => ({
    // State
    data: null,
    loading: true,
    error: null,
    lastRefreshTime: null,

    // Actions

    /**
     * 刷新数据
     */
    refresh: () => {
      set(state => {
        state.loading = true;
      });

      try {
        // 获取当前消息楼层的变量数据
        const variables = getVariables({
          type: 'message',
          message_id: getCurrentMessageId(),
        });

        // 提取并解析 stat_data
        const rawData = _.get(variables, 'stat_data', {});
        const result = Schema.safeParse(rawData);

        if (!result.success) {
          console.warn('[StatusBar] 数据校验失败:', result.error);
          set(state => {
            state.error = `数据格式错误：${result.error.message || '未知错误'}`;
            state.loading = false;
          });

          return;
        }

        set(state => {
          state.data = result.data;
          state.loading = false;
          state.error = null;
          state.lastRefreshTime = new Date();
        });

        console.log('[StatusBar] 数据已刷新');
      } catch (e) {
        console.error('[StatusBar] 加载数据失败:', e);
        set(state => {
          state.error = e instanceof Error ? e.message : '未知错误';
          state.loading = false;
        });
      }
    },

    /**
     * 更新指定路径的值
     */
    updateField: async (path: string, value: unknown): Promise<boolean> => {
      try {
        await waitGlobalInitialized('Mvu');
        const mvuData = Mvu.getMvuData({
          type: 'message',
          message_id: getCurrentMessageId(),
        });

        // 更新值
        _.set(mvuData, `stat_data.${path}`, value);

        // 写回
        await Mvu.replaceMvuData(mvuData, {
          type: 'message',
          message_id: getCurrentMessageId(),
        });

        // 刷新本地状态
        get().refresh();

        return true;
      } catch (e) {
        console.error('[StatusBar] 更新数据失败:', e);
        return false;
      }
    },

    /**
     * 删除指定路径的值
     */
    deleteField: async (path: string): Promise<boolean> => {
      try {
        await waitGlobalInitialized('Mvu');
        const mvuData = Mvu.getMvuData({
          type: 'message',
          message_id: getCurrentMessageId(),
        });

        // 删除值
        _.unset(mvuData, `stat_data.${path}`);

        // 写回
        await Mvu.replaceMvuData(mvuData, {
          type: 'message',
          message_id: getCurrentMessageId(),
        });

        // 刷新本地状态
        get().refresh();

        return true;
      } catch (e) {
        console.error('[StatusBar] 删除数据失败:', e);
        return false;
      }
    },
  })),
);
