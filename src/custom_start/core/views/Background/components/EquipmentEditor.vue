<script setup lang="ts">
/**
 * 装备编辑器组件
 */
import { computed, ref, watch } from 'vue';
import {
  FormArrayInput,
  FormInput,
  FormKeyValueInput,
  FormLabel,
  FormSelect,
  FormTextarea,
} from '../../../components/Form';
import {
  EQUIPMENT_TYPE_OPTIONS,
  getRarityColor,
  getRarityLabel,
  RARITY_OPTIONS,
} from '../../../utils/form-options';

// 装备项目接口
export interface EquipmentItem {
  name: string;
  type: string;
  tag: string[];
  rarity: string;
  effect: Record<string, string>;
  description: string;
}

interface Props {
  modelValue: EquipmentItem[];
  maxItems?: number;
  disabled?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: EquipmentItem[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  maxItems: 10,
  disabled: false,
});

const emit = defineEmits<Emits>();

// 转换选项格式供 FormSelect 使用
const rarityOptions = RARITY_OPTIONS.map(opt => ({ label: opt.label, value: opt.value }));
const typeOptions = EQUIPMENT_TYPE_OPTIONS.map(opt => ({ label: opt.label, value: opt.value }));

// 当前编辑的装备索引
const editingIndex = ref<number | null>(null);

// 新装备表单
const newEquipment = ref<EquipmentItem>({
  name: '',
  type: EQUIPMENT_TYPE_OPTIONS[0].value,
  tag: [],
  rarity: 'common',
  effect: {},
  description: '',
});

// 编辑中的装备（临时存储）
const editingEquipment = ref<EquipmentItem | null>(null);

// 是否显示添加表单
const showAddForm = ref(false);

// 计算属性：是否可以添加更多
const canAddMore = computed(() => {
  return !props.disabled && props.modelValue.length < props.maxItems;
});

// 重置新装备表单
const resetNewEquipment = () => {
  newEquipment.value = {
    name: '',
    type: EQUIPMENT_TYPE_OPTIONS[0].value,
    tag: [],
    rarity: 'common',
    effect: {},
    description: '',
  };
};

// 添加装备
const addEquipment = () => {
  if (!canAddMore.value || !newEquipment.value.name.trim()) return;

  const newItem: EquipmentItem = {
    ...newEquipment.value,
    name: newEquipment.value.name.trim(),
    tag: newEquipment.value.tag.filter(tag => tag.trim() !== ''),
    effect: { ...newEquipment.value.effect },
    description: newEquipment.value.description?.trim() || '',
  };

  emit('update:modelValue', [...props.modelValue, newItem]);
  resetNewEquipment();
  showAddForm.value = false;
};

// 删除装备
const removeEquipment = (index: number) => {
  if (props.disabled) return;

  const newArray = [...props.modelValue];
  newArray.splice(index, 1);
  emit('update:modelValue', newArray);
};

// 开始编辑
const startEdit = (index: number) => {
  if (props.disabled) return;

  editingIndex.value = index;
  editingEquipment.value = { ...props.modelValue[index] };
};

// 保存编辑
const saveEdit = () => {
  if (editingIndex.value === null || !editingEquipment.value) return;

  const newArray = [...props.modelValue];
  newArray[editingIndex.value] = {
    ...editingEquipment.value,
    name: editingEquipment.value.name.trim(),
    tag: editingEquipment.value.tag.filter(tag => tag.trim() !== ''),
    effect: { ...editingEquipment.value.effect },
    description: editingEquipment.value.description?.trim() || '',
  };

  emit('update:modelValue', newArray);
  cancelEdit();
};

// 取消编辑
const cancelEdit = () => {
  editingIndex.value = null;
  editingEquipment.value = null;
};

// 切换添加表单显示
const toggleAddForm = () => {
  showAddForm.value = !showAddForm.value;
  if (!showAddForm.value) {
    resetNewEquipment();
  }
};

// 监听禁用状态变化
watch(
  () => props.disabled,
  disabled => {
    if (disabled) {
      cancelEdit();
      showAddForm.value = false;
    }
  },
);
</script>

<template>
  <div class="equipment-editor" :class="{ 'is-disabled': disabled }">
    <!-- 装备列表 -->
    <div v-if="modelValue.length > 0" class="equipment-list">
      <TransitionGroup name="equip-list">
        <div
          v-for="(item, index) in modelValue"
          :key="`equip-${index}-${item.name}`"
          class="equipment-item"
          :class="{ editing: editingIndex === index }"
        >
          <!-- 编辑模式 -->
          <template v-if="editingIndex === index && editingEquipment">
            <div class="edit-form">
              <div class="form-row">
                <FormLabel label="装备名称" />
                <FormInput v-model="editingEquipment.name" placeholder="请输入装备名称" />
              </div>
              <div class="form-row-group">
                <div class="form-row half">
                  <FormLabel label="类型" />
                  <FormSelect v-model="editingEquipment.type" :options="typeOptions" />
                </div>
                <div class="form-row half">
                  <FormLabel label="品质" />
                  <FormSelect v-model="editingEquipment.rarity" :options="rarityOptions" />
                </div>
              </div>
              <div class="form-row">
                <FormLabel label="标签" />
                <FormArrayInput
                  v-model="editingEquipment.tag"
                  placeholder="输入标签后按回车添加"
                  add-button-text="添加标签"
                  empty-text="暂无标签"
                />
              </div>
              <div class="form-row">
                <FormLabel label="效果" />
                <FormKeyValueInput
                  v-model="editingEquipment.effect"
                  placeholder-key="效果名"
                  placeholder-value="效果内容"
                  add-button-text="添加效果"
                  empty-text="暂无效果条目"
                />
              </div>
              <div class="form-row">
                <FormLabel label="描述" />
                <FormTextarea
                  v-model="editingEquipment.description"
                  :rows="2"
                  placeholder="请输入装备描述（可选）"
                />
              </div>
              <div class="edit-actions">
                <button type="button" class="btn-cancel" @click="cancelEdit">取消</button>
                <button
                  type="button"
                  class="btn-save"
                  :disabled="!editingEquipment.name.trim()"
                  @click="saveEdit"
                >
                  保存
                </button>
              </div>
            </div>
          </template>

          <!-- 显示模式 -->
          <template v-else>
            <div class="item-header">
              <span class="item-type">{{ item.type || '武器' }}</span>
              <span class="item-name">{{ item.name }}</span>
              <span
                class="item-rarity"
                :style="{
                  '--rarity-color': getRarityColor(item.rarity),
                }"
              >
                {{ getRarityLabel(item.rarity) }}
              </span>
            </div>

            <div v-if="item.tag && item.tag.length > 0" class="item-tag">
              <span v-for="tag in item.tag" :key="tag" class="tag-text">{{ tag }}</span>
            </div>

            <div v-if="Object.keys(item.effect || {}).length > 0" class="item-effect">
              <span class="effect-label">效果：</span>
              <div class="effect-list">
                <div v-for="(value, key) in item.effect" :key="key" class="effect-row">
                  <span class="effect-key">{{ key }}：</span>
                  <span class="effect-value">{{ value }}</span>
                </div>
              </div>
            </div>

            <div v-if="item.description" class="item-description">
              {{ item.description }}
            </div>

            <div class="item-actions">
              <button
                type="button"
                class="action-btn edit"
                title="编辑"
                :disabled="disabled"
                @click="startEdit(index)"
              >
                <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                编辑
              </button>
              <button
                type="button"
                class="action-btn delete"
                title="删除"
                :disabled="disabled"
                @click="removeEquipment(index)"
              >
                <i class="fa-solid fa-trash" aria-hidden="true"></i>
                删除
              </button>
            </div>
          </template>
        </div>
      </TransitionGroup>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <span class="empty-icon"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i></span>
      <span class="empty-text">暂无装备，点击下方按钮添加</span>
    </div>

    <!-- 添加装备表单 -->
    <div v-if="showAddForm && canAddMore" class="add-form">
      <div class="add-form-header">
        <span class="form-title">添加新装备</span>
        <button type="button" class="close-btn" @click="toggleAddForm">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </div>
      <div class="form-row">
        <FormLabel label="装备名称" required />
        <FormInput v-model="newEquipment.name" placeholder="请输入装备名称" />
      </div>
      <div class="form-row-group">
        <div class="form-row half">
          <FormLabel label="类型" />
          <FormSelect v-model="newEquipment.type" :options="typeOptions" />
        </div>
        <div class="form-row half">
          <FormLabel label="品质" />
          <FormSelect v-model="newEquipment.rarity" :options="rarityOptions" />
        </div>
      </div>
      <div class="form-row">
        <FormLabel label="标签" />
        <FormArrayInput
          v-model="newEquipment.tag"
          placeholder="输入标签后按回车添加"
          add-button-text="添加标签"
          empty-text="暂无标签"
        />
      </div>
      <div class="form-row">
        <FormLabel label="效果" />
        <FormKeyValueInput
          v-model="newEquipment.effect"
          placeholder-key="效果名"
          placeholder-value="效果内容"
          add-button-text="添加效果"
          empty-text="暂无效果条目"
        />
      </div>
      <div class="form-row">
        <FormLabel label="描述" />
        <FormTextarea
          v-model="newEquipment.description"
          :rows="2"
          placeholder="请输入装备描述（可选）"
        />
      </div>
      <div class="add-form-actions">
        <button type="button" class="btn-cancel" @click="toggleAddForm">取消</button>
        <button
          type="button"
          class="btn-add"
          :disabled="!newEquipment.name.trim()"
          @click="addEquipment"
        >
          添加装备
        </button>
      </div>
    </div>

    <!-- 添加按钮 -->
    <div v-if="canAddMore && !showAddForm" class="add-section">
      <button type="button" class="add-btn" :disabled="disabled" @click="toggleAddForm">
        <span class="add-icon">+</span>
        <span class="add-text">添加装备</span>
      </button>
    </div>

    <!-- 数量提示 -->
    <div class="count-info">
      <span class="count-current">{{ modelValue.length }}</span>
      <span class="count-separator">/</span>
      <span class="count-max">{{ maxItems }}</span>
      <span class="count-label">件装备</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.equipment-editor {
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

.equipment-list {
  max-height: 400px;
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

.equipment-item {
  background: var(--card-bg);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  transition: all var(--transition-fast);

  &:last-child {
    margin-bottom: 0;
  }

  &:hover:not(.editing) {
    border-color: var(--accent-color);
    box-shadow: var(--shadow-sm);
  }

  &.editing {
    border-color: var(--accent-color);
    background: rgba(212, 175, 55, 0.05);
  }
}

.item-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.item-type {
  padding: 2px 8px;
  background: var(--border-color-light);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  color: var(--text-light);
}

.item-name {
  flex: 1;
  font-size: 1rem;
  font-weight: 600;
  color: var(--title-color);
}

.item-rarity {
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--rarity-color);
  color: #fff;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
}

.item-effect {
  font-size: 0.9rem;
  color: var(--text-color);
  margin-bottom: var(--spacing-xs);

  .effect-label {
    color: var(--accent-color);
    font-weight: 600;
  }
}

.item-tag {
  margin-bottom: var(--spacing-xs);
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  .tag-text {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    color: var(--accent-color);
  }
}

.effect-list {
  margin-top: var(--spacing-xs);
  display: grid;
  gap: 4px;
}

.effect-row {
  display: grid;
  grid-template-columns: minmax(64px, max-content) 1fr;
  gap: var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--text-color);
}

.effect-key {
  color: var(--text-light);
  font-weight: 600;
}

.effect-value {
  color: var(--text-color);
}

.item-description {
  font-size: 0.85rem;
  color: var(--text-light);
  font-style: italic;
  padding-top: var(--spacing-xs);
  border-top: 1px dashed var(--border-color-light);
}

.item-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-color-light);

  i {
    margin-right: var(--spacing-xs);
  }
}

.action-btn {
  padding: var(--spacing-xs) var(--spacing-md);
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

  &.delete:hover:not(:disabled) {
    border-color: var(--error-color);
    color: var(--error-color);
    background: rgba(211, 47, 47, 0.05);
  }
}

.edit-form,
.add-form {
  padding: var(--spacing-md);
}

.add-form {
  border-top: 1px solid var(--border-color-light);
  background: rgba(212, 175, 55, 0.03);
}

.add-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);

  .form-title {
    font-weight: 600;
    color: var(--title-color);
  }

  .close-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--text-light);
    transition: color var(--transition-fast);

    &:hover {
      color: var(--error-color);
    }
  }
}

.form-row {
  margin-bottom: var(--spacing-sm);

  &.half {
    flex: 1;
  }
}

.form-row-group {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.edit-actions,
.add-form-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  justify-content: flex-end;
}

.btn-cancel,
.btn-save,
.btn-add {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-cancel {
  background: var(--border-color-light);
  color: var(--text-color);

  &:hover {
    background: var(--border-color);
  }
}

.btn-save,
.btn-add {
  background: var(--accent-color);
  color: var(--primary-bg);

  &:hover:not(:disabled) {
    background: #c9a842;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--text-light);
  gap: var(--spacing-sm);

  .empty-icon {
    font-size: 2rem;
    opacity: 0.6;
  }

  .empty-text {
    font-size: 0.9rem;
  }
}

.add-section {
  padding: var(--spacing-sm);
  border-top: 1px solid var(--border-color-light);
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-md);
  background: rgba(212, 175, 55, 0.1);
  border: 2px dashed var(--accent-color);
  border-radius: var(--radius-md);
  color: var(--accent-color);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    background: rgba(212, 175, 55, 0.2);
    border-style: solid;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .add-icon {
    font-size: 1.2rem;
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
.equip-list-enter-active,
.equip-list-leave-active {
  transition: all 0.3s ease;
}

.equip-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.equip-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.equip-list-move {
  transition: transform 0.3s ease;
}

// 响应式设计
@media (max-width: 768px) {
  .form-row-group {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .item-header {
    flex-wrap: wrap;
  }

  .item-actions {
    flex-wrap: wrap;
  }
}
</style>
