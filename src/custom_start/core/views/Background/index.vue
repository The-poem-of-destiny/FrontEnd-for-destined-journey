<script setup lang="ts">
import CategorySelectionLayout from '../../components/CategorySelectionLayout.vue';
import ConfirmModal from '../../components/ConfirmModal.vue';
import { getBackgrounds } from '../../data/backgrounds';
import { getAllPartners } from '../../data/destined-ones';
import { useCharacterStore } from '../../store/character';
import { useCustomContentStore } from '../../store/customContent';
import type { Background, Partner } from '../../types';

import BackgroundList from './components/BackgroundList.vue';
import CustomPartnerForm from './components/CustomPartnerForm.vue';
import DestinyPointsExchange from './components/DestinyPointsExchange.vue';
import LevelTabs from './components/LevelTabs.vue';
import PartnerList from './components/PartnerList.vue';

const characterStore = useCharacterStore();
const customContentStore = useCustomContentStore();
const customPartnerFormRef = ref<InstanceType<typeof CustomPartnerForm> | null>(null);
const partnerToRemove = ref<Partner | null>(null);
const showClearConfirm = ref(false);

// 伙伴相关状态
const currentLevel = ref<string>('');

// 初始剧情相关状态
const currentBackgroundCategory = ref<string>('');

// 提取分类和层级为计算属性，遵循 DRY 原则
const partnerLevels = computed(() => Object.keys(getAllPartners()));
const backgroundCategories = computed(() => Object.keys(getBackgrounds()));

const syncCurrentOption = (current: { value: string }, options: string[]) => {
  if (!options.includes(current.value)) {
    current.value = options[0] || '';
  }
};

// 获取当前层级的伙伴列表
const currentPartners = computed<Partner[]>(() => {
  if (!currentLevel.value) return [];
  return getAllPartners()[currentLevel.value] || [];
});

// 获取当前分类的背景列表
const currentBackgrounds = computed<Background[]>(() => {
  if (!currentBackgroundCategory.value) return [];
  return getBackgrounds()[currentBackgroundCategory.value] || [];
});

// 计算可用点数
const availablePoints = computed(() => {
  return characterStore.character.reincarnationPoints - characterStore.consumedPoints;
});

// 伙伴操作
const handleSelectPartner = (partner: Partner) => {
  characterStore.addPartner(partner);
};

const handleDeselectPartner = (partner: Partner) => {
  partnerToRemove.value = partner;
};

const handleAddCustomPartner = (partner: Partner, replaceName?: string) => {
  const targetName = replaceName?.trim();
  if (targetName) {
    characterStore.replacePartnerByName(partner, targetName);
  } else {
    characterStore.addPartner(partner);
  }
  customContentStore.updateEditingCustomPartnerName('');
};

const handleEditCustomPartner = (partner: Partner) => {
  if (!partner.isCustom) return;
  customPartnerFormRef.value?.fillFormByPartner(partner);
  toastr.info(`已回填自定义伙伴「${partner.name}」`);
};

// 背景操作
const handleSelectBackground = (background: Background) => {
  if (background.name === '【自定义开局】') {
    const customDescription = customContentStore.customBackgroundDescription?.trim();
    const mergedBackground = {
      ...background,
      description: customDescription ? customDescription : background.description,
    };
    characterStore.setBackground(mergedBackground);
    return;
  }
  characterStore.setBackground(background);
};

// 更新自定义开局描述
const handleUpdateCustomDescription = (value: string) => {
  customContentStore.updateCustomBackgroundDescription(value);

  if (characterStore.selectedBackground?.name === '【自定义开局】') {
    characterStore.setBackground({
      ...characterStore.selectedBackground,
      description: value,
    });
  }
};

// 清空所有选择
const handleClearAll = () => {
  showClearConfirm.value = true;
};

const confirmRemovePartner = () => {
  if (!partnerToRemove.value) return;
  characterStore.removePartner(partnerToRemove.value);
  partnerToRemove.value = null;
};

const cancelRemovePartner = () => {
  partnerToRemove.value = null;
};

const confirmClearAll = () => {
  characterStore.clearPartners();
  characterStore.setBackground(null);
  customContentStore.updateCustomBackgroundDescription('');
  showClearConfirm.value = false;
};

const cancelClearAll = () => {
  showClearConfirm.value = false;
};

watch(partnerLevels, (levels) => syncCurrentOption(currentLevel, levels), { immediate: true });
watch(backgroundCategories, (categories) => syncCurrentOption(currentBackgroundCategory, categories), {
  immediate: true,
});
</script>

<template>
  <div class="background-page">
    <!-- 伙伴区域 -->
    <section class="destined-ones-section">
      <h2 class="section-title">选择伙伴</h2>

      <!-- 层级导航 -->
      <LevelTabs v-model="currentLevel" :levels="partnerLevels" />

      <!-- 伙伴列表 -->
      <div class="destined-ones-content">
        <PartnerList
          :items="currentPartners"
          @select="handleSelectPartner"
          @deselect="handleDeselectPartner"
        />
      </div>
    </section>

    <!-- 自定义伙伴表单 -->
    <CustomPartnerForm ref="customPartnerFormRef" @add="handleAddCustomPartner" />

    <!-- 命运点数兑换 -->
    <DestinyPointsExchange />

    <!-- 初始剧情区域 - 使用通用布局组件 -->
    <section class="background-section">
      <h2 class="section-title">选择初始开局剧情</h2>

      <CategorySelectionLayout
        v-model="currentBackgroundCategory"
        :categories="backgroundCategories"
      >
        <template #content>
          <BackgroundList
            :items="currentBackgrounds"
            :selected-item="characterStore.selectedBackground"
            :character-race="characterStore.character.race"
            :character-location="characterStore.character.startLocation"
            :character-identity="characterStore.character.identity"
            @select="handleSelectBackground"
            @update:custom-description="handleUpdateCustomDescription"
          />
        </template>
      </CategorySelectionLayout>
    </section>

    <!-- 已选信息面板 -->
    <section class="summary-section">
      <div class="summary-card">
        <div class="summary-header">
          <div class="summary-title-row">
            <h3 class="summary-title">已选择</h3>
            <div class="points-info">
              <span class="points-value" :class="{ insufficient: availablePoints < 0 }">{{
                availablePoints
              }}</span>
              <span class="points-separator">/</span>
              <span class="points-total">{{ characterStore.character.reincarnationPoints }}</span>
            </div>
          </div>
          <button
            v-if="characterStore.selectedPartners.length > 0 || characterStore.selectedBackground"
            class="clear-btn"
            @click="handleClearAll"
          >
            清空选择
          </button>
        </div>

        <div class="summary-content">
          <!-- 伙伴摘要 -->
          <div v-if="characterStore.selectedPartners.length > 0" class="summary-group">
            <div class="summary-label">伙伴列表 ({{ characterStore.selectedPartners.length }})</div>
            <div class="summary-items">
              <div
                v-for="partner in characterStore.selectedPartners"
                :key="partner.name"
                class="summary-item"
                :class="{ 'is-custom': partner.isCustom }"
                @click="handleEditCustomPartner(partner)"
              >
                <span class="item-name">
                  <span class="name-text">{{ partner.name }}</span>
                  <span v-if="partner.isCustom" class="custom-tag">
                    <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                  </span>
                </span>
                <span class="item-cost">{{ partner.cost }} 点</span>
                <button class="remove-btn" @click.stop="handleDeselectPartner(partner)">
                  <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- 背景摘要 -->
          <div v-if="characterStore.selectedBackground" class="summary-group">
            <div class="summary-label">初始开局剧情</div>
            <div class="summary-items">
              <div class="summary-item full">
                <span class="item-name">{{ characterStore.selectedBackground.name }}</span>
              </div>
            </div>
          </div>

          <!-- 空状态提示 -->
          <div
            v-if="
              characterStore.selectedPartners.length === 0 && !characterStore.selectedBackground
            "
            class="empty-state"
          >
            尚未选择任何内容
          </div>
        </div>
      </div>
    </section>

    <ConfirmModal
      :visible="Boolean(partnerToRemove)"
      title="确认移除伙伴"
      :message="`确定要移除「${partnerToRemove?.name || ''}」吗？`"
      confirm-text="确认移除"
      cancel-text="取消"
      type="danger"
      @confirm="confirmRemovePartner"
      @cancel="cancelRemovePartner"
    />

    <ConfirmModal
      :visible="showClearConfirm"
      title="确认清空选择"
      message="确定要清空已选伙伴和开局剧情吗？自定义开局草稿也会被清空。"
      confirm-text="清空选择"
      cancel-text="取消"
      type="danger"
      @confirm="confirmClearAll"
      @cancel="cancelClearAll"
    />
  </div>
</template>

<style lang="scss" scoped>
.background-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  max-width: 1600px;
  margin: 0 auto;
  padding: var(--spacing-md);
}

.section-title {
  font-size: 1.5rem;
  color: var(--title-color);
  margin: 0 0 var(--spacing-md) 0;
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--border-color);
}

// 伙伴区域
.destined-ones-section {
  display: flex;
  flex-direction: column;

  .section-title {
    margin-bottom: 0;
  }
}

.destined-ones-content {
  max-height: 600px;
  overflow-y: auto;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--input-bg);

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: var(--input-bg);
    border-radius: var(--radius-md);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: var(--radius-md);

    &:hover {
      background: var(--border-color-strong);
    }
  }
}

// 初始剧情区域
.background-section {
  display: flex;
  flex-direction: column;
}

// 已选信息面板
.summary-section {
  position: sticky;
  bottom: 0;
}

.summary-card {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
}

.summary-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.summary-title {
  font-size: 1.2rem;
  color: var(--title-color);
  margin: 0;
}

.points-info {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  font-size: 1rem;
  font-weight: 600;

  .points-value {
    color: var(--accent-color);
    font-size: 1.2rem;

    &.insufficient {
      color: var(--error-color);
    }
  }

  .points-separator {
    color: var(--text-light);
    font-size: 1rem;
  }

  .points-total {
    color: var(--text-light);
    font-size: 1rem;
  }
}

.clear-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--error-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all var(--transition-fast);

  &:hover {
    background: #b71c1c;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.summary-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.summary-label {
  font-weight: 600;
  color: var(--title-color);
  font-size: 0.95rem;
}

.summary-items {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  transition: all var(--transition-fast);

  &.full {
    flex: 1 1 100%;
  }

  &.is-custom {
    cursor: pointer;
    border-style: dashed;

    &:hover {
      border-color: #43a047;
      box-shadow: 0 0 0 1px rgba(67, 160, 71, 0.2);
    }
  }

  .item-name {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--text-color);

    .name-text {
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .custom-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      background: rgba(76, 175, 80, 0.15);
      color: #43a047;
      font-size: 0.75rem;
      font-weight: 600;

      i {
        font-size: 0.7rem;
      }
    }
  }

  .item-cost {
    color: var(--accent-color);
    font-weight: 600;
  }

  .remove-btn {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--error-color);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 0.65rem;
    margin-left: auto;

    &:hover {
      background: #b71c1c;
    }
  }
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-light);
  font-size: 0.95rem;
}

// 响应式设计
@media (max-width: 768px) {
  .background-page {
    gap: var(--spacing-md);
    padding: var(--spacing-sm);
  }

  .section-title {
    font-size: 1.3rem;
  }

  .destined-ones-content {
    max-height: 500px;
  }

  .summary-section {
    position: static;
  }

  .background-section {
    :deep(.category-selection-layout) {
      display: flex;
      flex-direction: column;
      height: auto !important;
      max-height: none !important;
      min-height: 0;
      overflow: visible !important;
    }

    :deep(.content-area),
    :deep(.content-main),
    :deep(.background-list) {
      display: flex;
      flex-direction: column;
      height: auto !important;
      max-height: none !important;
      min-height: 140px;
      overflow: visible !important;
    }
  }

  .summary-items {
    flex-direction: column;
  }

  .summary-item {
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .section-title {
    font-size: 1.1rem;
  }

  .summary-header {
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .summary-title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
    flex: 1 1 100%;
  }

  .clear-btn {
    width: 100%;
  }
}
</style>
