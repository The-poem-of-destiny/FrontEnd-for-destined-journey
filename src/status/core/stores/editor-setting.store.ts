import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface EditorSettingState {
  /** 是否允许编辑 */
  editEnabled: boolean;
}

interface EditorSettingActions {
  /** 设置是否允许编辑 */
  setEditEnabled: (enabled: boolean) => void;
  /** 从酒馆变量加载设置 */
  loadSettings: () => void;
  /** 保存设置到酒馆变量 */
  saveSettings: () => Promise<void>;
}

type EditorSettingStore = EditorSettingState & EditorSettingActions;

export const useEditorSettingStore = create<EditorSettingStore>()(
  immer((set, get) => ({
    editEnabled: false,

    setEditEnabled: enabled => {
      set(state => {
        state.editEnabled = enabled;
      });
    },

    loadSettings: () => {
      try {
        const variables = getVariables({ type: 'character' });
        const setting = _.get(variables, 'status_edit_enabled', null);
        if (typeof setting === 'boolean') {
          set(state => {
            state.editEnabled = setting;
          });
        }
      } catch (error) {
        console.error('[StatusBar] 加载编辑设置失败:', error);
      }
    },

    saveSettings: async () => {
      try {
        await insertOrAssignVariables(
          { status_edit_enabled: get().editEnabled },
          { type: 'character' },
        );
      } catch (error) {
        console.error('[StatusBar] 保存编辑设置失败:', error);
      }
    },
  })),
);
