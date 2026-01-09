<script setup lang="ts">
export type CategoryType = 'equipment' | 'item' | 'skill';

interface Props {
  modelValue: CategoryType;
}

interface Emits {
  (e: 'update:modelValue', value: CategoryType): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const categories = [
  { key: 'equipment', label: '装备', icon: 'fa-solid fa-shield-halved' },
  { key: 'item', label: '道具', icon: 'fa-solid fa-box-open' },
  { key: 'skill', label: '技能', icon: 'fa-solid fa-wand-magic' },
] as const;

const handleTabClick = (key: CategoryType) => {
  emit('update:modelValue', key);
};
</script>

<template>
  <div class="category-tabs">
    <button
      v-for="category in categories"
      :key="category.key"
      class="tab-button"
      :class="{ active: modelValue === category.key }"
      @click="handleTabClick(category.key as CategoryType)"
    >
      <span class="tab-icon" aria-hidden="true">
        <i :class="category.icon"></i>
      </span>
      <span class="tab-label">{{ category.label }}</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.category-tabs {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  margin-bottom: var(--spacing-lg);
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-normal);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);

  &:hover {
    border-color: var(--accent-color);
    background: rgba(212, 175, 55, 0.1);
  }

  &.active {
    background: var(--accent-color);
    border-color: var(--accent-color);
    color: var(--primary-bg);

    .tab-icon {
      transform: scale(1.1);
    }
  }

  .tab-icon {
    font-size: 1.2rem;
    transition: transform var(--transition-normal);
  }

  .tab-label {
    font-family: var(--font-title);
    font-size: 0.9rem;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .category-tabs {
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
  }

  .tab-button {
    flex-direction: column;
    padding: var(--spacing-sm);
    gap: var(--spacing-xs);

    .tab-icon {
      font-size: 1.2rem;
    }

    .tab-label {
      font-size: 0.85rem;
    }
  }
}
</style>
