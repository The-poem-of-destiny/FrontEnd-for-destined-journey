<script setup lang="ts">
import { onMounted } from 'vue';

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

// 步骤标题（用于 Steps 组件）
const stepTitles = STEP_CONFIGS.map(c => ({ title: c.shortTitle }));

// 组件挂载时检查是否有预设
onMounted(() => {
  void syncLibraryStorageFromWorldbook({ silent: true });

  setTimeout(() => {
    checkAndShowLoadModal();
  }, 300);
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
  executeJourney();
};

// 下一步/踏上旅程
const handleNext = async () => {
  if (isLastStep.value) {
    const matchingPresetName = findMatchingPreset(characterStore);
    if (matchingPresetName) {
      toastr.info(`当前配置与预设「${matchingPresetName}」相同，直接开始旅程`);
      executeJourney();
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
  executeJourney();
};

const handleCancelJourney = () => {
  showSaveConfirm.value = false;
};

const handleOpenPresetManage = () => {
  shouldStartJourneyAfterSave.value = false;
  openManageModal();
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
  <div class="layout">
    <h1 class="main-title">命定之诗与黄昏之歌</h1>

    <HeaderControls @open-preset="handleOpenPresetManage" />

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
