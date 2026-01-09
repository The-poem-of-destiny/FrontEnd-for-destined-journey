<script setup lang="ts">
/**
 * 动态数组输入组件
 */
import { computed, ref } from 'vue';

interface Props {
  modelValue: string[];
  placeholder?: string;
  maxItems?: number;
  minItems?: number;
  disabled?: boolean;
  addButtonText?: string;
  emptyText?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请输入内容',
  maxItems: 10,
  minItems: 0,
  disabled: false,
  addButtonText: '添加项目',
  emptyText: '暂无项目，点击下方按钮添加',
});

const emit = defineEmits<Emits>();

// 新增项的输入值
const newItemValue = ref('');

// 当前编辑项的索引
const editingIndex = ref<number | null>(null);

// 计算属性：是否可以添加更多
const canAddMore = computed(() => {
  return !props.disabled && props.modelValue.length < props.maxItems;
});

// 计算属性：是否可以删除
const canRemove = computed(() => {
  return !props.disabled && props.modelValue.length > props.minItems;
});

// 添加新项
const addItem = () => {
  if (!canAddMore.value) return;

  const trimmedValue = newItemValue.value.trim();
  if (trimmedValue && !props.modelValue.includes(trimmedValue)) {
    emit('update:modelValue', [...props.modelValue, trimmedValue]);
    newItemValue.value = '';
  }
};

// 删除项
const removeItem = (index: number) => {
  if (!canRemove.value) return;

  const newArray = [...props.modelValue];
  newArray.splice(index, 1);
  emit('update:modelValue', newArray);
};

// 更新项
const updateItem = (index: number, value: string) => {
  const newArray = [...props.modelValue];
  newArray[index] = value;
  emit('update:modelValue', newArray);
};

// 开始编辑
const startEdit = (index: number) => {
  if (props.disabled) return;
  editingIndex.value = index;
};

// 结束编辑
const finishEdit = () => {
  editingIndex.value = null;
};

// 移动项目（上移/下移）
const moveItem = (index: number, direction: 'up' | 'down') => {
  if (props.disabled) return;

  const newIndex = direction === 'up' ? index - 1 : index + 1;
  if (newIndex < 0 || newIndex >= props.modelValue.length) return;

  const newArray = [...props.modelValue];
  [newArray[index], newArray[newIndex]] = [newArray[newIndex], newArray[index]];
  emit('update:modelValue', newArray);
};

// 处理回车键
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addItem();
  }
};
</script>

<template>
  <div class="form-array-input" :class="{ 'is-disabled': disabled }">
    <!-- 已有项目列表 -->
    <div v-if="modelValue.length > 0" class="array-items">
      <TransitionGroup name="list">
        <div v-for="(item, index) in modelValue" :key="`item-${index}-${item}`" class="array-item">
          <!-- 序号标识 -->
          <span class="item-index">{{ index + 1 }}</span>

          <!-- 编辑模式 -->
          <input
            v-if="editingIndex === index"
            :value="item"
            class="item-input editing"
            :placeholder="placeholder"
            @input="updateItem(index, ($event.target as HTMLInputElement).value)"
            @blur="finishEdit"
            @keydown.enter="finishEdit"
          />

          <!-- 显示模式 -->
          <span v-else class="item-text" @dblclick="startEdit(index)">
            {{ item }}
          </span>

          <!-- 操作按钮组 -->
          <div class="item-actions">
            <button
              type="button"
              class="action-btn edit-btn"
              title="编辑"
              :disabled="disabled"
              @click="startEdit(index)"
            >
              <i class="fa-solid fa-pen"></i>
            </button>
            <button
              type="button"
              class="action-btn move-btn"
              title="上移"
              :disabled="disabled || index === 0"
              @click="moveItem(index, 'up')"
            >
              <i class="fa-solid fa-arrow-up"></i>
            </button>
            <button
              type="button"
              class="action-btn move-btn"
              title="下移"
              :disabled="disabled || index === modelValue.length - 1"
              @click="moveItem(index, 'down')"
            >
              <i class="fa-solid fa-arrow-down"></i>
            </button>
            <button
              type="button"
              class="action-btn remove-btn"
              title="删除"
              :disabled="!canRemove"
              @click="removeItem(index)"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <span class="empty-icon"><i class="fa-solid fa-clipboard-list"></i></span>
      <span class="empty-text">{{ emptyText }}</span>
    </div>

    <!-- 添加新项 -->
    <div v-if="canAddMore" class="add-item-section">
      <input
        v-model="newItemValue"
        type="text"
        class="add-input"
        :placeholder="placeholder"
        :disabled="disabled"
        @keydown="handleKeydown"
      />
      <button
        type="button"
        class="add-btn"
        :disabled="disabled || !newItemValue.trim()"
        @click="addItem"
      >
        <span class="add-icon">+</span>
        <span class="add-text">{{ addButtonText }}</span>
      </button>
    </div>

    <!-- 数量提示 -->
    <div class="count-info">
      <span class="count-current">{{ modelValue.length }}</span>
      <span class="count-separator">/</span>
      <span class="count-max">{{ maxItems }}</span>
      <span class="count-label">项</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.form-array-input {
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

.array-items {
  max-height: 200px;
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

.array-item {
  display: flex;
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

.item-index {
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
  flex-shrink: 0;
}

.item-text {
  flex: 1;
  font-size: 0.95rem;
  color: var(--text-color);
  cursor: pointer;
  padding: var(--spacing-xs) 0;
  min-height: 28px;
  display: flex;
  align-items: center;

  &:hover {
    color: var(--accent-color);
  }
}

.item-input {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: #fff;
  border: 1px solid var(--accent-color);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  color: var(--text-color);
  outline: none;

  &:focus {
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
  }
}

.item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--transition-fast);

  .array-item:hover & {
    opacity: 1;
  }
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--card-bg);
  cursor: pointer;
  font-size: 0.75rem;
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    border-color: var(--accent-color);
    background: rgba(212, 175, 55, 0.1);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.remove-btn:hover:not(:disabled) {
    border-color: var(--error-color);
    background: rgba(211, 47, 47, 0.1);
    color: var(--error-color);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  color: var(--text-light);
  gap: var(--spacing-sm);

  .empty-icon {
    font-size: 1.5rem;
    opacity: 0.6;
  }

  .empty-text {
    font-size: 0.85rem;
  }
}

.add-item-section {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-top: 1px solid var(--border-color-light);
  background: rgba(212, 175, 55, 0.03);
}

.add-input {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  color: var(--text-color);
  outline: none;
  transition: all var(--transition-fast);

  &::placeholder {
    color: var(--text-light);
  }

  &:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.1);
  }

  &:disabled {
    background: var(--border-color-light);
    cursor: not-allowed;
  }
}

.add-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--accent-color);
  color: var(--primary-bg);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #c9a842;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .add-icon {
    font-size: 1rem;
    font-weight: 700;
  }
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

// 列表动画
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.list-move {
  transition: transform 0.3s ease;
}

// 响应式设计
@media (max-width: 768px) {
  .add-item-section {
    flex-direction: column;
  }

  .add-btn {
    justify-content: center;
  }

  .item-actions {
    opacity: 1;
  }

  .action-btn {
    width: 28px;
    height: 28px;
  }
}
</style>
