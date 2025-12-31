<script setup lang="ts">
import { computed, ref } from 'vue';
import { FormNumber } from '../../../components/Form';

interface Props {
  availablePoints: number;
  currentDestinyPoints: number;
}

interface Emits {
  (e: 'exchange', reincarnationPoints: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 要兑换的转生点数
const pointsToExchange = ref(0);

// 计算可以获得的命运点数
const destinyPointsToGain = computed(() => {
  return pointsToExchange.value * 10;
});

// 最大可兑换点数
const maxExchangeable = computed(() => {
  return props.availablePoints;
});

// 执行兑换
const handleExchange = () => {
  if (pointsToExchange.value > 0 && pointsToExchange.value <= maxExchangeable.value) {
    emit('exchange', pointsToExchange.value);
    pointsToExchange.value = 0;
  }
};
</script>

<template>
  <div class="destiny-exchange">
    <div class="exchange-header">
      <span class="exchange-icon">💫</span>
      <span class="exchange-title">命运点数</span>
      <span class="exchange-rate">(1转生点 = 2命运点)</span>
    </div>

    <div class="exchange-body">
      <div class="current-display">
        <span class="label">剩余：</span>
        <span class="value">{{ currentDestinyPoints }}</span>
      </div>

      <div class="exchange-controls">
        <FormNumber
          v-model="pointsToExchange"
          :min="0"
          :max="maxExchangeable"
          placeholder="0"
          class="exchange-input"
        />

        <button
          class="exchange-button"
          :disabled="pointsToExchange <= 0 || pointsToExchange > maxExchangeable"
          @click="handleExchange"
        >
          兑换 {{ destinyPointsToGain }} 命运点
        </button>

        <button
          class="exchange-all-button"
          :disabled="maxExchangeable <= 0"
          title="将所有剩余转生点数兑换为命运点数"
          @click="emit('exchange', maxExchangeable)"
        >
          全部兑换
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.destiny-exchange {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
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
    background: linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(156, 39, 176, 0.05) 100%);
    border: 1px solid rgba(156, 39, 176, 0.3);
    border-radius: var(--radius-md);
    white-space: nowrap;

    .label {
      font-size: 0.9rem;
      color: var(--text-light);
    }

    .value {
      font-size: 1.2rem;
      font-weight: 700;
      color: #9c27b0;
      font-family: var(--font-mono);
      min-width: 40px;
      text-align: right;
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
      background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition-normal);
      white-space: nowrap;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #ab47bc 0%, #8e24aa 100%);
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
      background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #e0c04a 0%, #c9a842 100%);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .exchange-body {
    flex-direction: column;
    align-items: stretch;

    .current-display {
      justify-content: space-between;
    }

    .exchange-controls {
      flex-wrap: wrap;

      .exchange-input {
        flex: 1;
      }

      .exchange-button,
      .exchange-all-button {
        flex-shrink: 0;
      }
    }
  }
}
</style>
