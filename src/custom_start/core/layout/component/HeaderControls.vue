<script setup lang="ts">
/**
 * 头部控制区组件
 * 包含转生点显示、Roll 点数按钮和预设管理按钮
 */
import { storeToRefs } from 'pinia';

import { usePoints } from '../../composables';
import { useCharacterStore } from '../../store';

const characterStore = useCharacterStore();
const { character } = storeToRefs(characterStore);
const { availablePoints, canRollPoints, rollPoints } = usePoints();

const emit = defineEmits<{
  openPreset: [];
}>();
</script>

<template>
  <div class="header-controls">
    <div class="points-display">
      <span class="points-label">可用转生点：</span>
      <span class="points-value" :class="{ negative: availablePoints < 0 }">
        {{ availablePoints }}
      </span>
      <span class="points-total">/ {{ character.reincarnationPoints }}</span>
    </div>
    <div class="control-buttons">
      <button
        class="control-button roll-button"
        :disabled="!canRollPoints"
        :title="canRollPoints ? '随机生成新的转生点数' : '已消耗点数，无法重新 Roll（请先重置）'"
        @click="rollPoints"
      >
        <i class="fa-solid fa-dice"></i>
        <span class="button-text">Roll 点数</span>
      </button>
      <button class="control-button preset-button" title="管理角色预设" @click="emit('openPreset')">
        <i class="fa-solid fa-bookmark"></i>
        <span class="button-text">预设管理</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.header-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.points-display {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  font-size: 1.1rem;
  font-weight: 600;

  .points-label {
    color: var(--text-color);
  }

  .points-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--accent-color);
    transition: var(--transition-normal);

    &.negative {
      color: var(--error-color);
      animation: shake 0.3s ease-in-out;
    }
  }

  .points-total {
    color: var(--text-light);
    font-size: 1rem;
  }
}

.control-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.control-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  box-shadow: var(--shadow-sm);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
  }
}

.roll-button {
  background: linear-gradient(135deg, var(--accent-color) 0%, #b8941f 100%);
  color: white;

  &:hover {
    background: linear-gradient(135deg, #e0c04a 0%, #d4af37 100%);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--border-color-light);
    color: var(--text-light);

    &:hover {
      transform: none;
      box-shadow: var(--shadow-sm);
    }
  }
}

.preset-button {
  background: linear-gradient(135deg, #8b7355 0%, #6f5840 100%);
  color: white;

  &:hover {
    background: linear-gradient(135deg, #9a8060 0%, #8b7355 100%);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@media (max-width: 768px) {
  .header-controls {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .points-display {
    font-size: 1rem;

    .points-value {
      font-size: 1.3rem;
    }
  }

  .control-buttons {
    width: 100%;
    flex-direction: column;
  }

  .control-button {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .points-display {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
