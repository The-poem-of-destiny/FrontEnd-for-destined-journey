/**
 * 预设弹窗管理 Composable
 */
import { useCharacterStore, useCustomContentStore } from '../store';
import { findMatchingPreset, hasPresets } from '../utils/preset-manager';

type PresetModalMode = 'manage' | 'load';

interface UsePresetModalReturn {
  /** 弹窗是否可见 */
  showModal: Ref<boolean>;
  /** 弹窗模式 */
  modalMode: Ref<PresetModalMode>;
  /** 打开管理模式弹窗 */
  openManageModal: () => void;
  /** 打开加载模式弹窗 */
  openLoadModal: () => void;
  /** 关闭弹窗 */
  closeModal: () => void;
  /** 检查并显示加载弹窗 (用于初始化) */
  checkAndShowLoadModal: () => void;
  /** 检查当前配置是否匹配已有预设 */
  checkMatchingPreset: () => string | null;
}

/**
 * 使用预设弹窗管理
 */
export function usePresetModal(): UsePresetModalReturn {
  const characterStore = useCharacterStore();
  const customContentStore = useCustomContentStore();
  const showModal = ref(false);
  const modalMode = ref<PresetModalMode>('manage');

  const openManageModal = () => {
    modalMode.value = 'manage';
    showModal.value = true;
  };

  const openLoadModal = () => {
    modalMode.value = 'load';
    showModal.value = true;
  };

  const closeModal = () => {
    showModal.value = false;
  };

  const checkAndShowLoadModal = () => {
    if (hasPresets()) {
      openLoadModal();
    }
  };

  const checkMatchingPreset = (): string | null => {
    return findMatchingPreset(characterStore, customContentStore.customInjectionSettings);
  };

  return {
    showModal,
    modalMode,
    openManageModal,
    openLoadModal,
    closeModal,
    checkAndShowLoadModal,
    checkMatchingPreset,
  };
}
