<script setup lang="ts">
interface Props {
  selected?: boolean;
  disabled?: boolean;
  detailsOpen?: boolean;
  showDetailState?: boolean;
  selectLabel: string;
  costText?: string;
}

withDefaults(defineProps<Props>(), {
  selected: false,
  disabled: false,
  detailsOpen: false,
  showDetailState: true,
  costText: '',
});

const emit = defineEmits<{
  toggleSelect: [];
}>();
</script>

<template>
  <div class="card-action-footer" :class="{ 'has-cost': costText }">
    <div v-if="costText" class="card-cost">
      <span class="cost-label">消耗</span>
      <span class="cost-value">{{ costText }}</span>
    </div>

    <div class="card-actions">
      <span v-if="showDetailState" class="detail-state" aria-hidden="true">
        <i class="fa-solid" :class="detailsOpen ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        {{ detailsOpen ? '收起详情' : '展开详情' }}
      </span>

      <button
        type="button"
        class="select-toggle"
        :class="{ 'is-selected': selected }"
        :disabled="disabled"
        :aria-pressed="selected"
        @click.stop="emit('toggleSelect')"
        @keydown.enter.stop
        @keydown.space.stop
      >
        <i class="fa-solid" :class="selected ? 'fa-check' : 'fa-plus'"></i>
        <span>{{ selectLabel }}</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card-action-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--spacing-md);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-color-light);

  &.has-cost {
    justify-content: space-between;
  }
}

.card-cost {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;

  .cost-label {
    font-size: 0.9rem;
    color: var(--text-light);
  }

  .cost-value {
    font-size: 1rem;
    font-weight: 700;
    color: var(--accent-color);
    white-space: nowrap;
  }
}

.card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  min-width: 0;
}

.detail-state {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-light);
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.select-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 32px;
  padding: 4px 12px;
  border: 1px solid var(--accent-color);
  border-radius: var(--radius-md);
  background: var(--input-bg);
  color: var(--accent-color);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: var(--accent-color);
    color: var(--primary-bg);
  }

  &:disabled {
    border-color: var(--border-color);
    background: var(--button-bg);
    color: var(--text-light);
    cursor: not-allowed;
    opacity: 0.72;
  }

  &.is-selected {
    background: var(--accent-color);
    color: var(--primary-bg);
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.18);
  }
}

@media (max-width: 768px) {
  .card-action-footer {
    flex-wrap: nowrap;
    gap: 6px;
    padding-top: 6px;
  }

  .card-cost {
    gap: 2px;

    .cost-label {
      display: none;
    }

    .cost-value {
      font-size: 0.88rem;
    }
  }

  .card-actions {
    gap: 4px;
  }

  .detail-state {
    display: none;
  }

  .select-toggle {
    min-height: 28px;
    padding: 3px 8px;
    font-size: 0.78rem;
  }
}
</style>
