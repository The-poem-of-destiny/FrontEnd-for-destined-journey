<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import ConfirmModal from './ConfirmModal.vue';
import { FormNumber } from './Form';

type ExchangeTheme = 'gold' | 'violet';

type ExchangeCardProps = {
  title: string;
  rateText: string;
  iconClass: string;
  currentLabel: string;
  currentValue: number | string;
  currentUnit?: string;
  gainUnit: string;
  gainPerPoint: number;
  maxExchangeable: number;
  modelValue: number;
  theme?: ExchangeTheme;
  exchangeAllTitle?: string;
  resetTitle?: string;
  resetDisabled?: boolean;
  defaultExpanded?: boolean;
  forceExpanded?: boolean;
};

const props = withDefaults(defineProps<ExchangeCardProps>(), {
  currentUnit: '',
  theme: 'gold',
  exchangeAllTitle: '将所有剩余转生点数兑换',
  resetTitle: '重置已兑换内容',
  resetDisabled: false,
  defaultExpanded: false,
  forceExpanded: false,
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: number): void;
  (event: 'exchange'): void;
  (event: 'exchange-all'): void;
  (event: 'reset'): void;
}>();

const localValue = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
});

const gainValue = computed(() => Math.max(0, Math.round(localValue.value)) * props.gainPerPoint);
const isExchangeDisabled = computed(
  () => localValue.value <= 0 || localValue.value > props.maxExchangeable,
);
const isAllDisabled = computed(() => props.maxExchangeable <= 0);
const themeClass = computed(() => `exchange-card--${props.theme}`);
const isExpanded = ref(props.defaultExpanded);
const isMobileViewport = ref(false);
const showResetConfirm = ref(false);

let mediaQuery: MediaQueryList | null = null;

const updateViewportMode = () => {
  isMobileViewport.value = Boolean(mediaQuery?.matches);
};

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 768px)');
  updateViewportMode();
  mediaQuery.addEventListener('change', updateViewportMode);
});

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', updateViewportMode);
});

const isBodyVisible = computed(
  () => props.forceExpanded || !isMobileViewport.value || isExpanded.value,
);

const toggleExpanded = () => {
  if (props.forceExpanded) return;
  if (!isMobileViewport.value) return;
  isExpanded.value = !isExpanded.value;
};

const requestReset = () => {
  if (props.resetDisabled) return;
  showResetConfirm.value = true;
};

const confirmReset = () => {
  showResetConfirm.value = false;
  emit('reset');
};

const cancelReset = () => {
  showResetConfirm.value = false;
};
</script>

<template>
  <div class="exchange-card" :class="themeClass">
    <div class="exchange-header">
      <span class="exchange-icon" aria-hidden="true">
        <i :class="iconClass"></i>
      </span>
      <span class="exchange-title">{{ title }}</span>
      <span class="exchange-rate">{{ rateText }}</span>
      <span class="mobile-current">
        {{ currentValue }}<span v-if="currentUnit"> {{ currentUnit }}</span>
      </span>
      <button
        v-if="!forceExpanded"
        class="exchange-toggle"
        type="button"
        :aria-expanded="isBodyVisible"
        @click="toggleExpanded"
      >
        <span>{{ isExpanded ? '收起' : '兑换' }}</span>
        <i class="fa-solid fa-chevron-down" :class="{ rotated: isExpanded }"></i>
      </button>
    </div>

    <div v-show="isBodyVisible" class="exchange-body">
      <div class="current-display">
        <span class="label">{{ currentLabel }}</span>
        <span class="value">{{ currentValue }}</span>
        <span v-if="currentUnit" class="unit">{{ currentUnit }}</span>
      </div>

      <div class="exchange-controls">
        <FormNumber
          v-model="localValue"
          :min="0"
          :max="maxExchangeable"
          placeholder="0"
          class="exchange-input"
        />

        <button class="exchange-button" :disabled="isExchangeDisabled" @click="emit('exchange')">
          兑换 {{ gainValue }} {{ gainUnit }}
        </button>

        <button
          class="exchange-all-button"
          :disabled="isAllDisabled"
          :title="exchangeAllTitle"
          @click="emit('exchange-all')"
        >
          全部兑换
        </button>

        <button
          class="exchange-reset-icon"
          :disabled="resetDisabled"
          :title="resetTitle"
          aria-label="重置"
          @click="requestReset"
        >
          <i class="fa-solid fa-rotate-left"></i>
        </button>
      </div>
    </div>

    <ConfirmModal
      :visible="showResetConfirm"
      title="确认重置兑换"
      :message="`${resetTitle}？此操作会清除当前已兑换数值。`"
      confirm-text="确认重置"
      cancel-text="取消"
      type="danger"
      @confirm="confirmReset"
      @cancel="cancelReset"
    />
  </div>
</template>

<style scoped lang="scss">
.exchange-card {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

.exchange-card--gold {
  --exchange-accent: #d4af37;
  --exchange-accent-strong: #b8941f;
  --exchange-surface-start: rgba(212, 175, 55, 0.1);
  --exchange-surface-end: rgba(212, 175, 55, 0.05);
  --exchange-border: rgba(212, 175, 55, 0.3);
  --exchange-secondary-start: #caa336;
  --exchange-secondary-end: #a57f1a;
}

.exchange-card--violet {
  --exchange-accent: #9c27b0;
  --exchange-accent-strong: #7b1fa2;
  --exchange-surface-start: rgba(156, 39, 176, 0.1);
  --exchange-surface-end: rgba(156, 39, 176, 0.05);
  --exchange-border: rgba(156, 39, 176, 0.3);
  --exchange-secondary-start: #d4af37;
  --exchange-secondary-end: #b8941f;
}

.exchange-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);

  .exchange-icon {
    font-size: 1.2rem;
    color: var(--exchange-accent);
  }

  .exchange-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--title-color);
  }

  .exchange-rate {
    font-size: 0.85rem;
    color: var(--text-light);
  }

  .mobile-current,
  .exchange-toggle {
    display: none;
  }
}

.exchange-body {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);

  .current-display {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    background: linear-gradient(
      135deg,
      var(--exchange-surface-start) 0%,
      var(--exchange-surface-end) 100%
    );
    border: 1px solid var(--exchange-border);
    border-radius: var(--radius-md);
    white-space: nowrap;

    .label {
      font-size: 0.9rem;
      color: var(--text-light);
    }

    .value {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--exchange-accent);
      font-family: var(--font-mono);
      min-width: 40px;
      text-align: right;
    }

    .unit {
      font-size: 0.85rem;
      color: var(--text-light);
    }
  }

  .exchange-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex: 1;

    .exchange-input {
      width: 150px;
    }

    .exchange-button,
    .exchange-all-button {
      padding: var(--spacing-sm) var(--spacing-lg);
      background: linear-gradient(
        135deg,
        var(--exchange-accent) 0%,
        var(--exchange-accent-strong) 100%
      );
      color: var(--primary-bg);
      border: none;
      border-radius: var(--radius-md);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition-normal);
      white-space: nowrap;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: var(--border-color-light);
        color: var(--text-light);

        &:hover {
          transform: none;
          box-shadow: none;
        }
      }
    }

    .exchange-all-button {
      background: linear-gradient(
        135deg,
        var(--exchange-secondary-start) 0%,
        var(--exchange-secondary-end) 100%
      );
    }

    .exchange-reset-icon {
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--text-light);
      cursor: pointer;
      transition: var(--transition-fast);

      &:hover:not(:disabled) {
        color: var(--exchange-accent-strong);
        border-color: var(--exchange-accent-strong);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  }
}

@media (max-width: 768px) {
  .exchange-card {
    padding: var(--spacing-sm);
    border-width: 1px;
    border-radius: var(--radius-md);
  }

  .exchange-header {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;

    .exchange-icon {
      font-size: 1rem;
    }

    .exchange-title {
      font-size: 0.9rem;
    }

    .exchange-rate {
      display: none;
    }

    .mobile-current {
      display: inline-flex;
      margin-left: auto;
      color: var(--exchange-accent-strong);
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.9rem;
      white-space: nowrap;
    }

    .exchange-toggle {
      min-height: 34px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 8px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--input-bg);
      color: var(--title-color);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;

      i {
        font-size: 0.7rem;
        transition: transform var(--transition-fast);

        &.rotated {
          transform: rotate(180deg);
        }
      }
    }
  }

  .exchange-body {
    margin-top: var(--spacing-sm);
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--border-color);
    flex-direction: column;
    align-items: stretch;

    .current-display {
      justify-content: space-between;
    }

    .exchange-controls {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: var(--spacing-xs);

      .exchange-input {
        width: auto;
        min-width: 0;
      }

      .exchange-button,
      .exchange-all-button,
      .exchange-reset-icon {
        min-height: 38px;
        flex-shrink: 0;
      }

      .exchange-button {
        grid-column: 1 / -1;
      }

      .exchange-all-button {
        padding: var(--spacing-sm);
      }

      .exchange-reset-icon {
        width: 38px;
        height: 38px;
      }
    }
  }
}
</style>
