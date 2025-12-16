<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PresetModal from '../components/PresetModal.vue';
import { useCharacterStore } from '../store';
import { generateAIPrompt, writeCharacterToMvu } from '../utils/data-exporter';
import { findMatchingPreset, hasPresets } from '../utils/preset-manager';
import Steps from './component/Steps.vue';

const router = useRouter();
const route = useRoute();
const characterStore = useCharacterStore();
const { character } = storeToRefs(characterStore);

// 预设弹窗控制
const showPresetModal = ref(false);
const presetModalMode = ref<'manage' | 'load'>('manage');

// 踏上旅程前询问是否保存预设
const showSaveBeforeJourneyConfirm = ref(false);

// 滚动到 iframe 位置（让父页面滚动到 iframe 可见区域）
const scrollToIframe = () => {
  nextTick(() => {
    const frameElement = window.frameElement;
    if (frameElement) {
      // 直接调用 scrollIntoView，因为 frameElement 属于父页面 DOM
      frameElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
};

// 打开预设管理弹窗
const handleOpenPresetModal = () => {
  presetModalMode.value = 'manage';
  showPresetModal.value = true;
};

// 关闭预设弹窗
const handleClosePresetModal = () => {
  showPresetModal.value = false;
};

// 预设加载完成回调
const handlePresetLoaded = () => {
  // 加载预设后跳转到第一步
  router.push({ name: 'BasicInfo' });
};

// 预设保存完成后继续旅程
const handlePresetSavedThenJourney = () => {
  showPresetModal.value = false;
  executeJourney();
};

// 组件挂载时检查是否有预设
onMounted(() => {
  // 延迟检查，确保页面渲染完成
  setTimeout(() => {
    if (hasPresets()) {
      presetModalMode.value = 'load';
      showPresetModal.value = true;
    }
  }, 300);
});

// 计算可用点数
const availablePoints = computed(() => {
  const consumed = characterStore.consumedPoints;
  return character.value.reincarnationPoints - consumed;
});

// 判断是否可以 Roll 点数（只有在没有消耗点数时才允许）
const canRollPoints = computed(() => {
  return characterStore.consumedPoints === 0;
});

const stepRef = ref<InstanceType<typeof Steps> | null>(null);

// 创建事件触发器
const randomGenerateTrigger = ref(0);
const resetPageTrigger = ref(0);

// 通过 provide 提供给子组件
provide('randomGenerateTrigger', randomGenerateTrigger);
provide('resetPageTrigger', resetPageTrigger);

// Roll 转生点数
const handleRollPoints = () => {
  characterStore.rollInitialPoints();
};

// 随机生成当前页面内容
const handleRandomGenerate = () => {
  randomGenerateTrigger.value++;
};

// 重置当前页面内容
const handleReset = () => {
  resetPageTrigger.value++;
};

const stepTitles = ref([
  { title: '信息/属性' },
  { title: '装备/技能' },
  { title: '对象/背景' },
  { title: '确认' },
]);

// 路由到步骤的映射
const routeToStep: Record<string, number> = {
  BasicInfo: 1,
  Selections: 2,
  Background: 3,
  Confirm: 4,
};

// 步骤到路由的映射
const stepToRoute: Record<number, string> = {
  1: 'BasicInfo',
  2: 'Selections',
  3: 'Background',
  4: 'Confirm',
};

// 从路由元信息或路由名获取当前步骤
const currentStep = computed(() => {
  const step = route.meta?.step as number;
  if (step) return step;

  const routeName = route.name as string;
  return routeToStep[routeName] || 1;
});

// 上一页
const handlePrevious = () => {
  const prevStep = currentStep.value - 1;
  if (prevStep >= 1) {
    const routeName = stepToRoute[prevStep];
    router.push({ name: routeName });
  }
};

// 下一页
const handleNext = async () => {
  // 如果是最后一步，检查是否需要询问保存预设
  if (currentStep.value === stepTitles.value.length) {
    // 先检查当前数据是否已与某个预设相同
    const matchingPresetName = findMatchingPreset(characterStore);
    if (matchingPresetName) {
      // 已有相同预设，直接开始旅程
      toastr.info(`当前配置与预设「${matchingPresetName}」相同，直接开始旅程`);
      executeJourney();
    } else {
      // 没有相同预设，询问是否保存
      showSaveBeforeJourneyConfirm.value = true;
      scrollToIframe();
    }
    return;
  }

  // 否则跳转到下一步
  const nextStep = currentStep.value + 1;
  if (nextStep <= stepTitles.value.length) {
    const routeName = stepToRoute[nextStep];
    router.push({ name: routeName });
  }
};

// 选择保存预设后再开始旅程
const handleSavePresetBeforeJourney = () => {
  showSaveBeforeJourneyConfirm.value = false;
  presetModalMode.value = 'manage';
  showPresetModal.value = true;
};

// 选择不保存直接开始旅程
const handleSkipSaveAndJourney = () => {
  showSaveBeforeJourneyConfirm.value = false;
  executeJourney();
};

// 取消踏上旅程
const handleCancelJourney = () => {
  showSaveBeforeJourneyConfirm.value = false;
};

// 执行踏上旅程逻辑
const executeJourney = async () => {
  try {
    // 1. 写入 MVU 变量
    await writeCharacterToMvu(
      character.value,
      characterStore.selectedItems,
      characterStore.selectedSkills,
      characterStore.selectedDestinedOnes,
    );
    console.log('✅ 角色数据已写入 MVU 变量');

    // 2. 生成 AI 提示词
    const aiPrompt = generateAIPrompt(
      character.value,
      characterStore.selectedEquipments,
      characterStore.selectedDestinedOnes,
      characterStore.selectedBackground,
      characterStore.selectedItems,
      characterStore.selectedSkills,
    );
    console.log('✅ AI 提示词已生成：\n', aiPrompt);

    // 3. 发送给 AI（使用 createChatMessages 函数，避免 slash 命令解析问题）
    await createChatMessages([{ role: 'user', message: aiPrompt }]);

    console.log('✅ 角色信息已发送给 AI');

    // 4. 触发 AI 回复
    await triggerSlash('/trigger');
  } catch (error) {
    console.error('❌ 踏上旅程时发生错误：', error);
  }
};

// 判断是否可以点击上一页
const canGoPrevious = computed(() => currentStep.value > 1);

// 判断“踏上旅程”按钮是否应被禁用
const isNextButtonDisabled = computed(() => {
  if (currentStep.value === stepTitles.value.length) {
    return availablePoints.value < 0;
  }
  return false;
});

// 下一步按钮文字
const nextButtonText = computed(() => {
  return currentStep.value === stepTitles.value.length ? '踏上旅程' : '下一步';
});

// 过渡动画方向
const transitionName = ref('slide-left');

// 监听路由变化，设置过渡方向
watch(
  () => route.name,
  (newRoute, oldRoute) => {
    const newStep = routeToStep[newRoute as string] || 1;
    const oldStep = routeToStep[oldRoute as string] || 1;

    // 根据步骤变化决定动画方向
    transitionName.value = newStep > oldStep ? 'slide-left' : 'slide-right';
  },
);
</script>

<template>
  <div class="layout">
    <h1 class="main-title">命定之诗与黄昏之歌</h1>

    <!-- 转生点数显示和 Roll 点按钮 -->
    <div class="points-panel">
      <div class="points-display">
        <span class="points-label">可用转生点：</span>
        <span class="points-value" :class="{ negative: availablePoints < 0 }">
          {{ availablePoints }}
        </span>
        <span class="points-total">/ {{ character.reincarnationPoints }}</span>
      </div>
      <button
        class="roll-button"
        :disabled="!canRollPoints"
        :title="canRollPoints ? '随机生成新的转生点数' : '已消耗点数，无法重新 Roll（请先重置）'"
        @click="handleRollPoints"
      >
        <span class="button-text">🎲 Roll 点数</span>
      </button>
    </div>

    <Steps ref="stepRef" :steps="stepTitles" :step="currentStep" />

    <!-- 操作按钮区域 -->
    <div class="action-buttons">
      <!-- 随机生成和重置按钮（确认页面不显示） -->
      <template v-if="currentStep !== 4">
        <button
          class="action-button random-button"
          title="随机生成当前页面内容"
          @click="handleRandomGenerate"
        >
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          <span class="text">随机当前页</span>
        </button>
        <button class="action-button reset-button" title="重置当前页面" @click="handleReset">
          <i class="fa-solid fa-rotate-left"></i>
          <span class="text">重置当前页</span>
        </button>
      </template>
      <!-- 预设管理按钮（始终显示） -->
      <button
        class="action-button preset-button"
        title="管理角色预设"
        @click="handleOpenPresetModal"
      >
        <i class="fa-solid fa-bookmark"></i>
        <span class="text">预设管理</span>
      </button>
    </div>

    <div class="content-area">
      <router-view v-slot="{ Component, route: slotRoute }">
        <transition :name="transitionName" mode="out-in">
          <component :is="Component" :key="slotRoute.path" />
        </transition>
      </router-view>
    </div>

    <div class="navigation">
      <button class="nav-button prev-button" :disabled="!canGoPrevious" @click="handlePrevious">
        <span class="text">上一步</span>
      </button>

      <button
        class="nav-button next-button"
        :disabled="isNextButtonDisabled"
        :title="isNextButtonDisabled ? '可用转生点数不能为负' : undefined"
        @click="handleNext"
      >
        <span class="text">{{ nextButtonText }}</span>
      </button>
    </div>

    <!-- 预设管理弹窗 -->
    <PresetModal
      :visible="showPresetModal"
      :mode="presetModalMode"
      @close="handleClosePresetModal"
      @loaded="handlePresetLoaded"
      @saved="handlePresetSavedThenJourney"
    />

    <!-- 踏上旅程前询问是否保存预设 -->
    <Teleport to="body">
      <div
        v-if="showSaveBeforeJourneyConfirm"
        class="confirm-overlay"
        @click.self="handleCancelJourney"
      >
        <div class="confirm-dialog">
          <div class="confirm-header">
            <i class="fa-solid fa-bookmark"></i>
            <h3>保存预设</h3>
          </div>
          <div class="confirm-body">
            <p>是否在踏上旅程前保存当前配置为预设？</p>
            <p class="confirm-hint">保存后下次可以快速加载相同配置</p>
          </div>
          <div class="confirm-actions">
            <button class="confirm-button save" @click="handleSavePresetBeforeJourney">
              <i class="fa-solid fa-floppy-disk"></i>
              保存预设
            </button>
            <button class="confirm-button skip" @click="handleSkipSaveAndJourney">
              <i class="fa-solid fa-forward"></i>
              不保存
            </button>
            <button class="confirm-button cancel" @click="handleCancelJourney">
              <i class="fa-solid fa-xmark"></i>
              取消
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 500px;
  padding: var(--spacing-xl);
}

.main-title {
  text-align: center;
  margin-bottom: var(--spacing-lg);
  color: var(--title-color);
}

// 转生点数面板
.points-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.points-display {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  font-size: 1.1rem;
  font-weight: 600;

  .points-label {
    color: var(--text-color);
  }

  .points-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--accent-color);
    transition: var(--transition-normal);

    &.negative {
      color: var(--error-color);
      animation: shake 0.3s ease-in-out;
    }
  }

  .points-total {
    color: var(--text-light);
    font-size: 1rem;
  }
}

.roll-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  background: linear-gradient(135deg, var(--accent-color) 0%, #b8941f 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  box-shadow: var(--shadow-sm);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    background: linear-gradient(135deg, #e0c04a 0%, #d4af37 100%);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--border-color-light);
    color: var(--text-light);

    &:hover {
      transform: none;
      box-shadow: var(--shadow-sm);
    }
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

.content-area {
  margin: var(--spacing-md) 0;
  padding: var(--spacing-md);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
  min-height: 400px;
}

// 向左滑动过渡（前进）
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease-out;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

// 向右滑动过渡（后退）
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease-out;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
}

// 操作按钮组
.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  justify-content: center;
  margin-top: var(--spacing-md);
}

.action-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  box-shadow: var(--shadow-sm);

  i {
    font-size: 1rem;
  }

  &.random-button {
    background: linear-gradient(135deg, #e8d5c4 0%, #d4c4b0 100%);
    color: var(--title-color);

    &:hover {
      background: linear-gradient(135deg, #f0ddd0 0%, #e0d5c7 100%);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
  }

  &.reset-button {
    background: linear-gradient(135deg, #c6b8a5 0%, #b0a295 100%);
    color: var(--title-color);

    &:hover {
      background: linear-gradient(135deg, #d4c4b0 0%, #c6b8a5 100%);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
  }

  &.preset-button {
    background: linear-gradient(135deg, var(--accent-color) 0%, #b8941f 100%);
    color: white;
    border-color: var(--accent-color);

    &:hover {
      background: linear-gradient(135deg, #e0c04a 0%, #d4af37 100%);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
  }
}

.nav-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-xl);
  background: var(--button-bg);
  color: var(--title-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  box-shadow: var(--shadow-sm);

  &:hover:not(:disabled) {
    background: var(--button-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--border-color-light);
    color: var(--text-light);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .layout {
    padding: var(--spacing-md);
  }

  .points-display {
    font-size: 1rem;

    .points-value {
      font-size: 1.3rem;
    }
  }

  .action-buttons {
    flex-wrap: wrap;
  }

  .navigation {
    flex-wrap: wrap;
    justify-content: center;
  }

  .nav-button {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }

  .action-button {
    flex: 1;
  }
}

// 确认弹窗样式
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.confirm-dialog {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.confirm-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
  border-bottom: 1px solid var(--border-color);

  i {
    font-size: 1.3rem;
    color: var(--accent-color);
  }

  h3 {
    margin: 0;
    font-size: 1.2rem;
    color: var(--title-color);
    font-weight: 700;
  }
}

.confirm-body {
  padding: var(--spacing-lg);
  text-align: center;

  p {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--text-color);
    font-size: 1rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .confirm-hint {
    font-size: 0.9rem;
    color: var(--text-light);
    font-style: italic;
  }
}

.confirm-actions {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
  justify-content: center;
}

.confirm-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);

  i {
    font-size: 0.9rem;
  }

  &.save {
    background: linear-gradient(135deg, var(--accent-color) 0%, #b8941f 100%);
    color: white;
    border-color: var(--accent-color);

    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
  }

  &.skip {
    background: linear-gradient(135deg, var(--success-color) 0%, #2e7d32 100%);
    color: white;
    border-color: var(--success-color);

    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
  }

  &.cancel {
    background: var(--card-bg);
    color: var(--text-color);
    border-color: var(--border-color);

    &:hover {
      background: var(--button-bg);
    }
  }
}
</style>
