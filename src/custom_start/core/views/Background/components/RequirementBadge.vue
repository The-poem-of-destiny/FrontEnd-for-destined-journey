<script setup lang="ts">
/**
 * 限制条件徽章组件
 * 用于显示背景/开局的各种限制条件（种族、地区、身份等）
 */

interface Props {
  /** 限制条件标签 */
  label: string;
  /** 限制条件要求的值 */
  requiredValue: string;
  /** 当前角色的实际值 */
  currentValue: string;
  /** 匹配模式：'exact' 精确匹配（默认），'prefix' 前缀匹配（用于层级地点） */
  matchMode?: 'exact' | 'prefix';
}

const props = withDefaults(defineProps<Props>(), {
  matchMode: 'exact',
});

// 检查是否满足要求
const isMet = computed(() => {
  if (props.matchMode === 'prefix') {
    // 完全匹配，或当前地点是要求地点的子地点
    return (
      props.currentValue === props.requiredValue ||
      props.currentValue.startsWith(props.requiredValue + '-')
    );
  }
  return props.currentValue === props.requiredValue;
});
</script>

<script lang="ts">
import { computed } from 'vue';
</script>

<template>
  <div class="requirement-item">
    <span class="requirement-label">{{ label }}：</span>
    <span
      class="requirement-value"
      :class="{
        'requirement-met': isMet,
        'requirement-unmet': !isMet,
      }"
    >
      {{ requiredValue }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.requirement-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.75rem;

  .requirement-label {
    color: var(--text-light);
    font-weight: 500;
    font-size: 0.85rem;
  }

  .requirement-value {
    font-weight: 600;
    word-break: break-word;
    line-height: 1.4;

    &.requirement-met {
      color: var(--success-color);
    }

    &.requirement-unmet {
      color: var(--error-color);
    }
  }
}
</style>
