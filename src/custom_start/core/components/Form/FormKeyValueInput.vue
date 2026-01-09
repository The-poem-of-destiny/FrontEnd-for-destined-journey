<script setup lang="ts">
/**
 * 键值对输入组件（用于效果等结构化字段）
 */
import { computed, ref, watch } from 'vue';

type KeyValueItem = {
  key: string;
  value: string;
};

interface Props {
  modelValue: Record<string, string>;
  placeholderKey?: string;
  placeholderValue?: string;
  maxItems?: number;
  minItems?: number;
  disabled?: boolean;
  addButtonText?: string;
  emptyText?: string;
}

interface Emits {
  (e: 'update:modelValue', value: Record<string, string>): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholderKey: '请输入字段名',
  placeholderValue: '请输入对应内容',
  maxItems: 20,
  minItems: 0,
  disabled: false,
  addButtonText: '添加条目',
  emptyText: '暂无条目，点击下方按钮添加',
});

const emit = defineEmits<Emits>();

const items = ref<KeyValueItem[]>([]);
const newKey = ref('');
const newValue = ref('');
const editingIndex = ref<number | null>(null);
const editingItem = ref<KeyValueItem | null>(null);

const canAddMore = computed(() => !props.disabled && items.value.length < props.maxItems);
const canRemove = computed(() => !props.disabled && items.value.length > props.minItems);

const syncToModel = (next_items: KeyValueItem[]) => {
  const next_value: Record<string, string> = {};
  next_items.forEach(item => {
    if (!item.key.trim()) return;
    next_value[item.key.trim()] = item.value?.trim() ?? '';
  });
  emit('update:modelValue', next_value);
};

watch(
  () => props.modelValue,
  value => {
    items.value = Object.entries(value || {}).map(([key, val]) => ({
      key,
      value: val ?? '',
    }));
  },
  { immediate: true, deep: true },
);

const addItem = () => {
  if (!canAddMore.value) return;

  const key = newKey.value.trim();
  if (!key) return;

  const value = newValue.value.trim();
  const existingIndex = items.value.findIndex(item => item.key === key);
  if (existingIndex >= 0) {
    const next_items = [...items.value];
    next_items[existingIndex] = { key, value };
    items.value = next_items;
    syncToModel(next_items);
  } else {
    const next_items = [...items.value, { key, value }];
    items.value = next_items;
    syncToModel(next_items);
  }

  newKey.value = '';
  newValue.value = '';
};

const removeItem = (index: number) => {
  if (!canRemove.value) return;
  const next_items = [...items.value];
  next_items.splice(index, 1);
  items.value = next_items;
  syncToModel(next_items);
};

const startEdit = (index: number) => {
  if (props.disabled) return;
  editingIndex.value = index;
  editingItem.value = { ...items.value[index] };
};

const cancelEdit = () => {
  editingIndex.value = null;
  editingItem.value = null;
};

const saveEdit = () => {
  if (editingIndex.value === null || !editingItem.value) return;

  const key = editingItem.value.key.trim();
  const value = editingItem.value.value.trim();
  if (!key) return;

  const duplicated = items.value.some(
    (item, index) => index !== editingIndex.value && item.key === key,
  );
  if (duplicated) return;

  const next_items = [...items.value];
  next_items[editingIndex.value] = { key, value };
  items.value = next_items;
  syncToModel(next_items);
  cancelEdit();
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addItem();
  }
};
</script>

<template>
  <div class="form-key-value" :class="{ 'is-disabled': disabled }">
    <div v-if="items.length > 0" class="kv-list">
      <TransitionGroup name="kv-list">
        <div v-for="(item, index) in items" :key="`kv-${index}-${item.key}`" class="kv-row">
          <span class="row-index">{{ index + 1 }}</span>

          <template v-if="editingIndex === index && editingItem">
            <div class="row-inputs">
              <input
                v-model="editingItem.key"
                class="kv-input"
                :placeholder="placeholderKey"
                @keydown.enter="saveEdit"
              />
              <input
                v-model="editingItem.value"
                class="kv-input"
                :placeholder="placeholderValue"
                @keydown.enter="saveEdit"
              />
            </div>
            <div class="row-actions">
              <button type="button" class="action-btn" @click="saveEdit">保存</button>
              <button type="button" class="action-btn subtle" @click="cancelEdit">取消</button>
            </div>
          </template>

          <template v-else>
            <div class="row-text">
              <span class="kv-key">{{ item.key }}</span>
              <span class="kv-separator">:</span>
              <span class="kv-value">{{ item.value }}</span>
            </div>
            <div class="row-actions">
              <button
                type="button"
                class="action-btn"
                :disabled="disabled"
                @click="startEdit(index)"
              >
                编辑
              </button>
              <button
                type="button"
                class="action-btn danger"
                :disabled="!canRemove"
                @click="removeItem(index)"
              >
                删除
              </button>
            </div>
          </template>
        </div>
      </TransitionGroup>
    </div>

    <div v-else class="empty-state">
      <span class="empty-text">{{ emptyText }}</span>
    </div>

    <div v-if="canAddMore" class="add-row">
      <input
        v-model="newKey"
        class="kv-input"
        :placeholder="placeholderKey"
        :disabled="disabled"
        @keydown="handleKeydown"
      />
      <input
        v-model="newValue"
        class="kv-input"
        :placeholder="placeholderValue"
        :disabled="disabled"
        @keydown="handleKeydown"
      />
      <button type="button" class="add-btn" :disabled="disabled || !newKey.trim()" @click="addItem">
        {{ addButtonText }}
      </button>
    </div>

    <div class="count-info">
      <span class="count-current">{{ items.length }}</span>
      <span class="count-separator">/</span>
      <span class="count-max">{{ maxItems }}</span>
      <span class="count-label">项</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.form-key-value {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--input-bg);
  overflow: hidden;

  &.is-disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

.kv-list {
  max-height: 240px;
  overflow-y: auto;
  padding: var(--spacing-sm);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--border-color-light);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;

    &:hover {
      background: var(--border-color-strong);
    }
  }
}

.kv-row {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--card-bg);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-xs);
  transition: all var(--transition-fast);

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    border-color: var(--accent-color);
    box-shadow: var(--shadow-sm);
  }
}

.row-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--accent-color);
  color: var(--primary-bg);
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
}

.row-text {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.9rem;
  color: var(--text-color);
}

.kv-key {
  font-weight: 600;
  color: var(--title-color);
}

.kv-separator {
  color: var(--text-light);
}

.kv-value {
  color: var(--text-color);
}

.row-inputs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-sm);
}

.kv-input {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  color: var(--text-color);
  outline: none;
  transition: all var(--transition-fast);

  &::placeholder {
    color: var(--text-light);
  }

  &:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.15);
  }

  &:disabled {
    background: var(--border-color-light);
    cursor: not-allowed;
  }
}

.row-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.action-btn {
  padding: 4px 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--card-bg);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    border-color: var(--accent-color);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.danger:hover:not(:disabled) {
    border-color: var(--error-color);
    color: var(--error-color);
    background: rgba(211, 47, 47, 0.05);
  }

  &.subtle {
    background: var(--input-bg);
  }
}

.add-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-top: 1px solid var(--border-color-light);
  background: rgba(212, 175, 55, 0.03);
}

.add-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--accent-color);
  color: var(--primary-bg);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    background: #c9a842;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
}

.empty-state {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--text-light);
  font-size: 0.85rem;
}

.count-info {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--border-color-light);
  font-size: 0.75rem;
  color: var(--text-light);
  gap: 2px;

  .count-current {
    font-weight: 700;
    color: var(--accent-color);
  }

  .count-max {
    font-weight: 600;
  }
}

.kv-list-enter-active,
.kv-list-leave-active {
  transition: all 0.3s ease;
}

.kv-list-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.kv-list-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

.kv-list-move {
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .kv-row {
    grid-template-columns: 24px 1fr;
  }

  .row-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }

  .add-row {
    grid-template-columns: 1fr;
  }
}
</style>
