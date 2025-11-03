<script setup lang="ts">
import { ref } from 'vue';
import FormTextarea from '../../../components/Form/FormTextarea.vue';
import type { Background } from '../../../types';

interface Props {
  items: Background[];
  selectedItem: Background | null;
  characterRace: string;
  characterLocation: string;
}

interface Emits {
  (e: 'select', item: Background): void;
  (e: 'update:customDescription', value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 折叠状态管理
const expandedCards = ref<Set<string>>(new Set());

// 切换折叠状态
const toggleExpand = (name: string, event: Event) => {
  event.stopPropagation();
  if (expandedCards.value.has(name)) {
    expandedCards.value.delete(name);
  } else {
    expandedCards.value.add(name);
  }
};

// 检查是否展开
const isExpanded = (name: string) => {
  return expandedCards.value.has(name);
};

// 检查是否已选择
const isSelected = (item: Background) => {
  return props.selectedItem?.name === item.name;
};

// 检查是否满足要求
const meetsRequirements = (item: Background) => {
  // 检查种族要求
  if (item.requiredRace && props.characterRace !== '自定义') {
    if (item.requiredRace !== props.characterRace) {
      return false;
    }
  }

  // 检查地区要求
  if (item.requiredLocation && props.characterLocation !== '自定义') {
    if (item.requiredLocation !== props.characterLocation) {
      return false;
    }
  }

  return true;
};

// 自定义开局描述
const customDescription = ref('');

// 处理选择
const handleSelect = (item: Background) => {
  if (meetsRequirements(item)) {
    emit('select', item);
  }
};

// 处理自定义描述更新
const handleCustomDescriptionUpdate = (value: string) => {
  customDescription.value = value;
  emit('update:customDescription', value);
};

// 检查是否为自定义开局
const isCustomBackground = (item: Background) => {
  return item.name === '【自定义开局】';
};
</script>

<template>
  <div class="background-list">
    <div v-if="items.length === 0" class="empty-message">该分类暂无初始剧情</div>
    <div
      v-for="item in items"
      :key="item.name"
      class="background-card"
      :class="{
        selected: isSelected(item),
        disabled: !meetsRequirements(item),
        expanded: isExpanded(item.name),
      }"
      @click="handleSelect(item)"
    >
      <div class="card-header">
        <h3 class="background-name">{{ item.name }}</h3>
        <button
          v-if="item.description.length > 100 || item.requiredRace || item.requiredLocation"
          class="expand-btn"
          @click="toggleExpand(item.name, $event)"
        >
          {{ isExpanded(item.name) ? '收起' : '展开' }}
        </button>
      </div>

      <!-- 简要描述（始终显示） -->
      <p class="background-summary">
        {{ item.description.substring(0, 100) }}{{ item.description.length > 100 ? '...' : '' }}
      </p>

      <!-- 详细内容（可折叠） -->
      <div v-if="isExpanded(item.name)" class="background-details">
        <p v-if="item.description.length > 100" class="background-description">
          {{ item.description }}
        </p>

        <div v-if="item.requiredRace || item.requiredLocation" class="requirements">
          <div v-if="item.requiredRace" class="requirement-item">
            <span class="requirement-label">种族要求：</span>
            <span
              class="requirement-value"
              :class="{
                'requirement-met': characterRace === item.requiredRace || characterRace === '自定义',
                'requirement-unmet': characterRace !== item.requiredRace && characterRace !== '自定义',
              }"
            >
              {{ item.requiredRace }}
            </span>
          </div>
          <div v-if="item.requiredLocation" class="requirement-item">
            <span class="requirement-label">地区要求：</span>
            <span
              class="requirement-value"
              :class="{
                'requirement-met': characterLocation === item.requiredLocation || characterLocation === '自定义',
                'requirement-unmet': characterLocation !== item.requiredLocation && characterLocation !== '自定义',
              }"
            >
              {{ item.requiredLocation }}
            </span>
          </div>
        </div>
      </div>

      <!-- 不满足要求时显示提示 -->
      <div v-if="!meetsRequirements(item)" class="requirement-warning">⚠️ 不满足该剧情的限定条件</div>

      <!-- 自定义开局输入框 -->
      <div v-if="isCustomBackground(item) && isSelected(item)" class="custom-input-area">
        <div class="custom-input-label">请编写您的自定义开局剧情：</div>
        <FormTextarea
          :model-value="customDescription"
          :rows="6"
          placeholder="在这里发挥您的想象力，编写您自己的人物初始剧情...&#10;&#10;例如：您可以描述角色的出身、经历的事件、当前的处境等等。"
          @update:model-value="handleCustomDescriptionUpdate"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.background-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  height: 100%;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
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

  &:hover:not(.disabled) {
    border-color: var(--accent-color);
    background: rgba(212, 175, 55, 0.1);
    transform: translateX(4px);
  }

  &.selected {
    border-color: var(--accent-color);
    background: rgba(212, 175, 55, 0.15);
    box-shadow: var(--shadow-md);
    border-left-width: 4px;
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;

    &:hover {
      transform: none;
    }
  }

  &.expanded {
    .background-details {
      max-height: 1000px;
      opacity: 1;
      margin-top: var(--spacing-sm);
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

  .expand-btn {
    padding: 2px var(--spacing-sm);
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 0.75rem;
    color: var(--text-color);
    transition: all var(--transition-fast);
    white-space: nowrap;

    &:hover {
      background: var(--accent-color);
      color: var(--primary-bg);
      border-color: var(--accent-color);
    }
  }
}

.background-summary {
  color: var(--text-color);
  line-height: 1.6;
  margin: 0;
  font-size: 0.9rem;
}

.background-details {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: all var(--transition-normal);
}

.background-description {
  color: var(--text-color);
  line-height: 1.6;
  margin: 0 0 var(--spacing-sm) 0;
  font-size: 0.9rem;
}

.requirements {
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-color-light);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.requirement-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.85rem;

  .requirement-label {
    color: var(--text-light);
    font-weight: 500;
  }

  .requirement-value {
    font-weight: 600;

    &.requirement-met {
      color: var(--success-color);
    }

    &.requirement-unmet {
      color: var(--error-color);
    }
  }
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
    gap: var(--spacing-sm);
  }

  .background-card {
    padding: var(--spacing-sm);
  }

  .card-header {
    .background-name {
      font-size: 1rem;
    }
  }

  .background-summary,
  .background-description {
    font-size: 0.85rem;
  }
}
</style>
