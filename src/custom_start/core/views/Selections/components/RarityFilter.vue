<script setup lang="ts">
import { useDragScroll } from '../../../composables';
import type { Rarity } from '../../../types';
import { RARITY_OPTIONS } from '../../../utils/form-options';

interface Props {
  modelValue: Rarity | 'all';
}

interface Emits {
  (e: 'update:modelValue', value: Rarity | 'all'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const {
  scrollRef: filterButtonsRef,
  isDragging,
  shouldSuppressClick,
  dragScrollHandlers,
} = useDragScroll();

// 基于 RARITY_OPTIONS 构建筛选选项（添加 "all" 选项，并按从高到低排序）
const rarityOptions: { value: Rarity | 'all'; label: string; color: string }[] = [
  { value: 'all', label: '全部', color: '#666' },
  // 按从高到低的顺序排列
  ...RARITY_OPTIONS.slice().reverse(),
];

const handleSelect = (value: Rarity | 'all') => {
  if (shouldSuppressClick()) return;
  emit('update:modelValue', value);
};
</script>

<template>
  <div class="rarity-filter">
    <div
      ref="filterButtonsRef"
      class="filter-buttons drag-scroll-x"
      :class="{ dragging: isDragging }"
      aria-label="品质筛选"
      v-on="dragScrollHandlers"
    >
      <button
        v-for="option in rarityOptions"
        :key="option.value"
        class="filter-btn"
        :class="{ active: modelValue === option.value }"
        :style="{ '--rarity-color': option.color }"
        @click="handleSelect(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.rarity-filter {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-xs);
  background: var(--card-bg);
  flex-wrap: wrap;

  .filter-buttons {
    display: flex;
    gap: var(--spacing-xs);
    flex-wrap: wrap;
    flex: 1;
    min-width: 0;
  }

  .filter-btn {
    padding: 4px var(--spacing-sm);
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: 0.85rem;
    color: var(--text-color);
    white-space: nowrap;

    &:hover {
      border-color: var(--rarity-color);
      background: var(--card-bg);
      color: var(--rarity-color);
      transform: translateY(-1px);
    }

    &.active {
      background: var(--rarity-color);
      border-color: var(--rarity-color);
      color: white;
      font-weight: 600;
      box-shadow:
        0 0 0 2px color-mix(in srgb, var(--rarity-color) 28%, transparent),
        0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .rarity-filter {
    padding: var(--spacing-xs) var(--spacing-sm);
    gap: var(--spacing-sm);
    flex-wrap: nowrap;

    .filter-buttons {
      gap: 4px;
      flex-wrap: nowrap;
      overflow-x: auto;
      overflow-y: hidden;
    }

    .filter-btn {
      flex: 0 0 auto;
      font-size: 0.8rem;
      padding: 3px var(--spacing-xs);
    }
  }
}

@media (max-width: 480px) {
  .rarity-filter {
    align-items: center;
    gap: var(--spacing-xs);

    .filter-buttons {
      justify-content: flex-start;
    }

    .filter-btn {
      font-size: 0.75rem;
      padding: 2px 6px;
    }
  }
}
</style>
