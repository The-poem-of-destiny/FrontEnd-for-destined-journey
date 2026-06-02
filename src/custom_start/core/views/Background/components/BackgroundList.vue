<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import CardActionFooter from '../../../components/CardActionFooter.vue';
import FormTextarea from '../../../components/Form/FormTextarea.vue';
import { useActiveCard } from '../../../composables';
import { parseMacroDeep } from '../../../composables/use-macro';
import { useCustomContentStore } from '../../../store/customContent';
import type { Background } from '../../../types';
import RequirementBadge from './RequirementBadge.vue';

interface Props {
  items: Background[];
  selectedItem: Background | null;
  characterRace: string;
  characterLocation: string;
  characterIdentity: string;
}

interface Emits {
  (e: 'select', item: Background): void;
  (e: 'deselect', item: Background): void;
  (e: 'update:customDescription', value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 使用自定义内容 store
const customContentStore = useCustomContentStore();

const { toggleActive, isActive: isDetailsOpen, clearIfMissing } = useActiveCard();

// 检查是否已选择
const isSelected = (item: Background) => {
  return props.selectedItem?.name === item.name;
};

// 检查单个要求是否满足
const checkRequirement = (required_value: string | undefined, current_value: string): boolean => {
  // 无要求时，视为满足
  if (!required_value) {
    return true;
  }
  // 有要求时，必须完全匹配（自定义不视为满足）
  return required_value === current_value;
};

// 检查地点要求是否满足
const checkLocationRequirement = (
  required_value: string | undefined,
  current_value: string,
): boolean => {
  if (!required_value) {
    return true;
  }
  // 完全匹配，或当前地点是要求地点的子地点
  return current_value === required_value || current_value.startsWith(required_value + '-');
};

// 检查是否满足所有要求（任一不满足则无法选择）
const meetsRequirements = (item: Background): boolean => {
  // 种族和身份使用精确匹配
  if (!checkRequirement(item.requiredRace, props.characterRace)) {
    return false;
  }
  if (!checkRequirement(item.requiredIdentity, props.characterIdentity)) {
    return false;
  }
  // 地点使用层级前缀匹配
  if (!checkLocationRequirement(item.requiredLocation, props.characterLocation)) {
    return false;
  }
  return true;
};

// 自定义开局描述
const customDescription = computed({
  get: () => customContentStore.customBackgroundDescription,
  set: (value: string) => customContentStore.updateCustomBackgroundDescription(value),
});

// 处理选择
const handleToggleSelect = (item: Background) => {
  if (isSelected(item)) {
    emit('deselect', item);
  } else if (meetsRequirements(item)) {
    emit('select', item);
  }
};

const handleToggleDetails = (item: Background) => {
  toggleActive(item.name);
};

const getSelectButtonText = (item: Background) => {
  if (isSelected(item)) return '取消选择';
  if (!meetsRequirements(item)) return '条件不符';
  return '选择';
};

// 处理自定义描述更新
const handleCustomDescriptionUpdate = (value: string) => {
  customContentStore.updateCustomBackgroundDescription(value);
  emit('update:customDescription', value);
};

// 检查是否为自定义开局
const isCustomBackground = (item: Background) => item.name === '【自定义开局】';

// 解析后的背景数据
const parsedItems = ref<Background[]>([]);

// 解析所有背景
const itemsKey = ref('');

watch(
  () => props.items,
  async items => {
    // 比较是否有变化
    const newKey = items.map(i => i.name).join('|');
    if (newKey === itemsKey.value && parsedItems.value.length > 0) {
      return;
    }

    itemsKey.value = newKey;
    parsedItems.value = await Promise.all(items.map(parseMacroDeep));
    clearIfMissing(items.map(item => item.name));
  },
  { immediate: true },
);
</script>

<template>
  <div class="background-list">
    <div v-if="parsedItems.length === 0" class="empty-message">该分类暂无初始剧情</div>
    <div
      v-for="item in parsedItems"
      :key="item.name"
      class="background-card selectable-card"
      :class="{
        'is-selected': isSelected(item),
        'is-disabled': !isSelected(item) && !meetsRequirements(item),
        'is-details-open': isDetailsOpen(item.name),
      }"
      tabindex="0"
      :aria-expanded="isDetailsOpen(item.name)"
      @click="handleToggleDetails(item)"
      @keydown.enter.prevent="handleToggleDetails(item)"
      @keydown.space.prevent="handleToggleDetails(item)"
    >
      <div class="card-header">
        <h3 class="background-name">{{ item.name }}</h3>
      </div>

      <!-- 限制要求 -->
      <div
        v-if="item.requiredRace || item.requiredLocation || item.requiredIdentity"
        class="requirements"
      >
        <RequirementBadge
          v-if="item.requiredRace"
          label="种族要求"
          :required-value="item.requiredRace"
          :current-value="characterRace"
        />
        <RequirementBadge
          v-if="item.requiredLocation"
          label="地区要求"
          :required-value="item.requiredLocation"
          :current-value="characterLocation"
          match-mode="prefix"
        />
        <RequirementBadge
          v-if="item.requiredIdentity"
          label="身份要求"
          :required-value="item.requiredIdentity"
          :current-value="characterIdentity"
        />
      </div>

      <!-- 描述内容（过长时可折叠） -->
      <p class="background-summary">
        <template v-if="isDetailsOpen(item.name) || item.description.length <= 100">
          {{ item.description }}
        </template>
        <template v-else> {{ item.description.substring(0, 100) }}... </template>
      </p>

      <!-- 不满足要求时显示提示 -->
      <div v-if="!meetsRequirements(item)" class="requirement-warning">
        ⚠️ 不满足该剧情的限定条件
      </div>

      <!-- 自定义开局输入框 -->
      <div
        v-show="isCustomBackground(item) && isSelected(item)"
        class="custom-input-area"
        @click.stop
      >
        <div class="custom-input-label">请编写您的自定义开局剧情：</div>
        <FormTextarea
          :model-value="customDescription"
          :rows="6"
          placeholder="在这里发挥您的想象力，编写您自己的人物初始剧情...&#10;&#10;例如：您可以描述角色的出身、经历的事件、当前的处境等等。"
          @update:model-value="handleCustomDescriptionUpdate"
        />
      </div>

      <CardActionFooter
        class="card-footer-slot"
        :selected="isSelected(item)"
        :disabled="!isSelected(item) && !meetsRequirements(item)"
        :details-open="isDetailsOpen(item.name)"
        :select-label="getSelectButtonText(item)"
        @toggle-select="handleToggleSelect(item)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.background-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

.empty-message {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-light);
  font-size: 1.1rem;
}

.background-card {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover:not(.is-disabled):not(.is-selected) {
    border-color: var(--accent-color);
    background: rgba(212, 175, 55, 0.1);
    transform: translateX(4px);
  }

  &.is-disabled {
    opacity: 0.6;
    border-style: dashed;

    &:hover {
      transform: none;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);

  .background-name {
    font-size: 1.1rem;
    color: var(--title-color);
    margin: 0;
    font-weight: 600;
    flex: 1;
  }
}

.requirements {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--input-bg);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--accent-color);
}

.background-summary {
  color: var(--text-color);
  line-height: 1.6;
  margin: 0;
  font-size: 0.9rem;
}

.card-footer-slot {
  margin-top: var(--spacing-sm);
}

.requirement-warning {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: rgba(211, 47, 47, 0.1);
  border-left: 3px solid var(--error-color);
  border-radius: var(--radius-sm);
  color: var(--error-color);
  font-size: 0.8rem;
  font-weight: 500;
}

.custom-input-area {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 2px dashed var(--border-color);
  animation: slideDown var(--transition-normal) ease-out;
}

.custom-input-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--title-color);
  margin-bottom: var(--spacing-sm);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .background-list {
    padding: var(--spacing-sm);
    gap: 6px;
  }

  .background-card {
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .card-header {
    margin-bottom: 4px;

    .background-name {
      font-size: 0.95rem;
      line-height: 1.35;
    }
  }

  .requirements {
    margin-bottom: 4px;
    padding: 4px 6px;
  }

  .background-card:not(.is-details-open) {
    .background-summary {
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
  }

  .background-card.is-details-open {
    .background-summary {
      max-height: 220px;
      overflow-y: auto;
      padding-right: 2px;
    }
  }

  .background-summary,
  .background-description {
    font-size: 0.85rem;
    line-height: 1.45;
  }

  .card-footer-slot {
    margin-top: 6px;
    padding-top: 6px;
  }

  .custom-input-area {
    margin-top: var(--spacing-sm);
    padding-top: var(--spacing-sm);

    :deep(textarea) {
      max-height: 160px;
      overflow-y: auto;
    }
  }
}
</style>
