<script setup lang="ts">
/**
 * 五维属性编辑器组件
 * 简洁版，复用 Form 组件
 */
import { computed } from 'vue';
import { FormLabel, FormNumber } from '../../../components/Form';

// 属性接口
export interface Attributes {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  mind: number;
}

interface Props {
  modelValue: Attributes;
  min?: number;
  max?: number;
  disabled?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: Attributes): void;
}

const props = withDefaults(defineProps<Props>(), {
  min: 1,
  max: 100,
  disabled: false,
});

const emit = defineEmits<Emits>();

// 属性配置
const attributeConfig = [
  { key: 'strength', label: '力量', icon: 'fa-solid fa-dumbbell' },
  { key: 'dexterity', label: '敏捷', icon: 'fa-solid fa-person-running' },
  { key: 'constitution', label: '体质', icon: 'fa-solid fa-heart-pulse' },
  { key: 'intelligence', label: '智力', icon: 'fa-solid fa-brain' },
  { key: 'mind', label: '精神', icon: 'fa-solid fa-wand-magic-sparkles' },
] as const;

// 计算总属性点
const totalPoints = computed(() => {
  return Object.values(props.modelValue).reduce((sum, val) => sum + val, 0);
});

// 更新单个属性
const updateAttribute = (key: keyof Attributes, value: number) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  });
};
</script>

<template>
  <div class="attribute-editor" :class="{ 'is-disabled': disabled }">
    <div class="attribute-grid">
      <div v-for="attr in attributeConfig" :key="attr.key" class="attribute-item">
        <FormLabel :label="attr.label">
          <template #icon>
            <i :class="['label-icon', attr.icon]" aria-hidden="true"></i>
          </template>
        </FormLabel>
        <FormNumber
          :model-value="modelValue[attr.key]"
          :min="min"
          :max="max"
          :disabled="disabled"
          @update:model-value="updateAttribute(attr.key, $event)"
        />
      </div>
    </div>
    <div class="total-points">
      <span class="total-label">属性总和：</span>
      <span class="total-value">{{ totalPoints }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.attribute-editor {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);

  &.is-disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  :deep(.label-icon) {
    color: var(--accent-color);
  }
}

.attribute-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--spacing-md);
}

.attribute-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.total-points {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-color-light);
  font-size: 0.9rem;

  .total-label {
    color: var(--text-light);
  }

  .total-value {
    font-weight: 700;
    color: var(--accent-color);
    margin-left: var(--spacing-xs);
  }
}
</style>
