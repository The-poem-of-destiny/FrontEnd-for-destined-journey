<script setup lang="ts">
import ItemCard from '../../../components/ItemCard.vue';
import { useSelectableList } from '../../../composables';
import { useStorePoints } from '../../../composables/use-store-points';
import type { Equipment, Item, Skill } from '../../../types';

interface Props {
  items: (Equipment | Item | Skill)[];
  selectedItems: (Equipment | Item | Skill)[];
}

interface Emits {
  (e: 'select', item: Equipment | Item | Skill): void;
  (e: 'deselect', item: Equipment | Item | Skill): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { availablePoints } = useStorePoints();

// 使用通用可选列表逻辑
const { isSelected, isDisabled } = useSelectableList(
  () => props.selectedItems,
  () => availablePoints.value,
);

const handleSelect = (item: Equipment | Item | Skill) => {
  emit('select', item);
};

const handleDeselect = (item: Equipment | Item | Skill) => {
  emit('deselect', item);
};
</script>

<template>
  <div class="item-list">
    <div v-if="items.length === 0" class="empty-state">
      <div class="empty-icon"><i class="fa-solid fa-box-open" aria-hidden="true"></i></div>
      <div class="empty-text">该分类下暂无物品</div>
    </div>
    <div v-else class="item-grid">
      <ItemCard
        v-for="item in items"
        :key="item.name"
        :item="item"
        :selected="isSelected(item)"
        :disabled="isDisabled(item)"
        @select="handleSelect"
        @deselect="handleDeselect"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.item-list {
  min-height: 400px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  min-height: 400px;

  .empty-icon {
    font-size: 4rem;
    margin-bottom: var(--spacing-lg);
    opacity: 0.5;
  }

  .empty-text {
    font-size: 1.1rem;
    color: var(--text-light);
    font-style: italic;
  }
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
}

// 响应式设计
@media (max-width: 1200px) {
  .item-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-md);
  }
}

@media (max-width: 768px) {
  .item-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
    padding: var(--spacing-sm);
  }

  .empty-state {
    padding: var(--spacing-xl);
    min-height: 300px;

    .empty-icon {
      font-size: 3rem;
    }

    .empty-text {
      font-size: 1rem;
    }
  }
}
</style>
