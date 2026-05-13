<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

import PresetModal from '../components/PresetModal.vue';
import { useJourney, usePoints, usePresetModal, useStepNavigation } from '../composables';
import { STEP_CONFIGS } from '../router/route-constants';
import { useCharacterStore } from '../store';
import { syncLibraryStorageFromWorldbook } from '../utils/custom-library';
import { findMatchingPreset } from '../utils/preset-manager';
import { scrollToIframe } from '../utils/scroll';

import ContentArea from './component/ContentArea.vue';
import HeaderControls from './component/HeaderControls.vue';
import NavigationButtons from './component/NavigationButtons.vue';
import SavePresetConfirm from './component/SavePresetConfirm.vue';
import StartJourneyConfirm from './component/StartJourneyConfirm.vue';
import Steps from './component/Steps.vue';

// 使用 composables
const characterStore = useCharacterStore();
const {
  currentStep,
  canGoPrevious,
  isLastStep,
  transitionName,
  goToPrevious,
  goToFirst,
  goToStep,
} = useStepNavigation();
const { showModal, modalMode, openManageModal, closeModal, checkAndShowLoadModal } =
  usePresetModal();

const shouldStartJourneyAfterSave = ref(false);
const { executeJourney } = useJourney();
const { availablePoints } = usePoints();

// 保存确认弹窗
const showSaveConfirm = ref(false);
const showStartConfirm = ref(false);
const isFullscreen = ref(false);
const isFullscreenFallback = ref(false);
let originalFrameStyle: Partial<CSSStyleDeclaration> | null = null;

// 步骤标题（用于 Steps 组件）
const stepTitles = STEP_CONFIGS.map(c => ({ title: c.shortTitle }));

// 组件挂载时检查是否有预设
onMounted(() => {
  void syncLibraryStorageFromWorldbook({ silent: true });

  setTimeout(() => {
    checkAndShowLoadModal();
  }, 300);

  document.addEventListener('fullscreenchange', updateFullscreenState);

  try {
    window.parent?.document?.addEventListener('fullscreenchange', updateFullscreenState);
  } catch {
    // Parent access may be blocked outside srcdoc; local fullscreen state still works.
  }
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', updateFullscreenState);

  try {
    window.parent?.document?.removeEventListener('fullscreenchange', updateFullscreenState);
  } catch {
    // Ignore cross-origin parent documents.
  }

  restoreFrameFullscreen();
});

// 预设加载完成回调
const handlePresetLoaded = () => {
  goToFirst();
};

// 预设保存后继续旅程（仅在“踏上旅程”流程触发）
const handlePresetSavedThenJourney = () => {
  if (!shouldStartJourneyAfterSave.value) {
    return;
  }

  shouldStartJourneyAfterSave.value = false;
  closeModal();
  showStartJourneyConfirm();
};

const showStartJourneyConfirm = () => {
  showStartConfirm.value = true;
  scrollToIframe();
};

// 下一步/踏上旅程
const handleNext = async () => {
  if (isLastStep.value) {
    const matchingPresetName = findMatchingPreset(characterStore);
    if (matchingPresetName) {
      toastr.info(`当前配置与预设「${matchingPresetName}」相同`);
      showStartJourneyConfirm();
    } else {
      showSaveConfirm.value = true;
      scrollToIframe();
    }
    return;
  }

  goToStep(currentStep.value + 1);
};

// 保存确认弹窗回调
const handleSavePreset = () => {
  showSaveConfirm.value = false;
  shouldStartJourneyAfterSave.value = true;
  openManageModal();
};

const handleSkipSave = () => {
  showSaveConfirm.value = false;
  showStartJourneyConfirm();
};

const handleCancelJourney = () => {
  showSaveConfirm.value = false;
};

const startJourney = async (autoTrigger: boolean) => {
  showStartConfirm.value = false;

  if (isFullscreen.value) {
    await exitBestFullscreen();
  }

  executeJourney({ autoTrigger });
};

const handleGenerateNow = () => {
  void startJourney(true);
};

const handleCreateOnly = () => {
  void startJourney(false);
};

const handleCancelStart = () => {
  showStartConfirm.value = false;
};

const handleOpenPresetManage = () => {
  shouldStartJourneyAfterSave.value = false;
  openManageModal();
};

const getParentFullscreenElement = (): Element | null => {
  try {
    return window.parent?.document?.fullscreenElement ?? null;
  } catch {
    return null;
  }
};

const updateFullscreenState = () => {
  isFullscreen.value = Boolean(
    document.fullscreenElement || getParentFullscreenElement() || isFullscreenFallback.value,
  );
};

const applyFrameFullscreen = () => {
  const frame = window.frameElement as HTMLElement | null;

  if (!frame) {
    return false;
  }

  if (!originalFrameStyle) {
    originalFrameStyle = {
      position: frame.style.position,
      inset: frame.style.inset,
      width: frame.style.width,
      height: frame.style.height,
      zIndex: frame.style.zIndex,
      border: frame.style.border,
      background: frame.style.background,
    };
  }

  Object.assign(frame.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100dvh',
    zIndex: '2147483647',
    border: '0',
    background: '#f5efe6',
  });

  document.documentElement.classList.add('creator-fullscreen');
  isFullscreenFallback.value = true;
  updateFullscreenState();
  return true;
};

const restoreFrameFullscreen = () => {
  const frame = window.frameElement as HTMLElement | null;

  if (frame && originalFrameStyle) {
    Object.assign(frame.style, originalFrameStyle);
  }

  originalFrameStyle = null;
  isFullscreenFallback.value = false;
  document.documentElement.classList.remove('creator-fullscreen');
  updateFullscreenState();
};

const requestBestFullscreen = async () => {
  const frame = window.frameElement as HTMLElement | null;
  const target = frame || document.documentElement;

  try {
    if (target.requestFullscreen) {
      await target.requestFullscreen();
      return;
    }

    await document.documentElement.requestFullscreen();
  } catch {
    if (!applyFrameFullscreen()) {
      toastr.warning('当前浏览器不允许进入全屏');
    }
  } finally {
    updateFullscreenState();
  }
};

const exitBestFullscreen = async () => {
  if (isFullscreenFallback.value) {
    restoreFrameFullscreen();
    return;
  }

  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    const parentDocument = window.parent?.document;
    if (parentDocument?.fullscreenElement) {
      await parentDocument.exitFullscreen();
    }
  } catch {
    restoreFrameFullscreen();
  } finally {
    updateFullscreenState();
  }
};

const toggleFullscreen = () => {
  if (isFullscreen.value) {
    void exitBestFullscreen();
    return;
  }

  void requestBestFullscreen();
};

// 计算属性
const isNextButtonDisabled = computed(() => {
  if (isLastStep.value) {
    return availablePoints.value < 0;
  }
  return false;
});

const nextButtonText = computed(() => {
  return isLastStep.value ? '踏上旅程' : '下一步';
});
</script>

<template>
  <div class="layout" :class="{ 'is-fullscreen': isFullscreen }">
    <h1 class="main-title">命定之诗与黄昏之歌</h1>

    <HeaderControls
      :is-fullscreen="isFullscreen"
      @open-preset="handleOpenPresetManage"
      @toggle-fullscreen="toggleFullscreen"
    />

    <Steps :steps="stepTitles" :step="currentStep" />

    <ContentArea :transition-name="transitionName" />

    <NavigationButtons
      :can-go-previous="canGoPrevious"
      :is-next-disabled="isNextButtonDisabled"
      :next-button-text="nextButtonText"
      next-disabled-title="可用转生点数不能为负"
      @previous="goToPrevious"
      @next="handleNext"
    />

    <PresetModal
      :visible="showModal"
      :mode="modalMode"
      @close="closeModal"
      @loaded="handlePresetLoaded"
      @saved="handlePresetSavedThenJourney"
    />

    <SavePresetConfirm
      :visible="showSaveConfirm"
      @save="handleSavePreset"
      @skip="handleSkipSave"
      @cancel="handleCancelJourney"
    />

    <StartJourneyConfirm
      :visible="showStartConfirm"
      @generate="handleGenerateNow"
      @wait="handleCreateOnly"
      @cancel="handleCancelStart"
    />
  </div>
</template>

<style lang="scss" scoped>
.layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  min-height: 500px;
  padding: var(--spacing-xl);

  &.is-fullscreen {
    min-height: 100dvh;
  }
}

.main-title {
  text-align: center;
  margin-bottom: var(--spacing-lg);
  color: var(--title-color);
}

@media (max-width: 768px) {
  .layout {
    aspect-ratio: 9 / 17.5;
    min-height: 0;
    padding: var(--spacing-sm);
    gap: var(--spacing-sm);
    overflow: hidden;

    &.is-fullscreen {
      width: 100%;
      min-height: 100dvh;
      aspect-ratio: auto;
    }
  }

  .main-title {
    flex: none;
    margin-bottom: 0;
    font-size: 1.1rem;
    line-height: 1.2;
    letter-spacing: 0;
    white-space: normal;
  }
}

@media (max-width: 480px) {
  .layout {
    aspect-ratio: 9 / 19.5;
  }
}
</style>
