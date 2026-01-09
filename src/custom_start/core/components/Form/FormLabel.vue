<script setup lang="ts">
interface Props {
  label: string;
  required?: boolean;
  htmlFor?: string;
}

withDefaults(defineProps<Props>(), {
  required: false,
});
</script>

<template>
  <label :for="htmlFor" class="form-label" :class="{ 'is-required': required }">
    <slot name="icon"></slot>
    <span>{{ label }}</span>
    <span v-if="required" class="required-mark">*</span>
  </label>
</template>

<style lang="scss" scoped>
.form-label {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 1rem;
  font-weight: 600;
  color: var(--title-color);
  margin-bottom: var(--spacing-xs);
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: color var(--transition-fast);

  &:hover {
    color: var(--accent-color);
  }

  .required-mark {
    color: var(--error-color);
    font-weight: 700;
    font-size: 1.1rem;
    line-height: 1;
  }
}
</style>
