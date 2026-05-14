<script setup lang="ts">
/**
 * 头部控制区组件
 * 包含转生点显示、Roll 点数按钮和自定义内容管理按钮
 */
import { storeToRefs } from 'pinia';

import { usePoints } from '../../composables';
import { useCharacterStore } from '../../store';

const characterStore = useCharacterStore();
const { character } = storeToRefs(characterStore);
const { availablePoints, canRollPoints, rollPoints } = usePoints();

interface Props {
  isFullscreen?: boolean;
}

withDefaults(defineProps<Props>(), {
  isFullscreen: false,
});

const emit = defineEmits<{
  openPreset: [];
  toggleFullscreen: [];
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
      <button
        class="control-button preset-button"
        title="管理预设、武器、技能和道具"
        @click="emit('openPreset')"
      >
        <i class="fa-solid fa-folder-tree"></i>
        <span class="button-text">内容管理</span>
      </button>
      <button
        class="control-button fullscreen-button"
        :title="isFullscreen ? '退出全屏' : '进入全屏'"
        @click="emit('toggleFullscreen')"
      >
        <i :class="isFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand'"></i>
        <span class="button-text">{{ isFullscreen ? '退出全屏' : '全屏' }}</span>
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
  background: linear-gradient(135deg, #6b8e9f 0%, #5a7a8a 100%);
  color: white;

  &:hover {
    background: linear-gradient(135deg, #7a9fb0 0%, #6b8e9f 100%);
  }
}

.fullscreen-button {
  background: linear-gradient(135deg, #7b6a58 0%, #5c4033 100%);
  color: white;

  &:hover {
    background: linear-gradient(135deg, #8b7a68 0%, #6d5042 100%);
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
    flex: none;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 0;
    flex-wrap: nowrap;
    min-width: 0;
  }

  .points-display {
    flex: 1 1 auto;
    justify-content: flex-start;
    flex-wrap: wrap;
    min-width: 0;
    gap: 4px;
    font-size: 0.78rem;

    .points-label {
      white-space: nowrap;
    }

    .points-value {
      font-size: 1rem;
    }

    .points-total {
      font-size: 0.78rem;
    }
  }

  .control-buttons {
    flex: 0 0 auto;
    display: flex;
    gap: 6px;
    width: auto;
    min-width: 0;
  }

  .control-button {
    min-height: 30px;
    padding: 5px 7px;
    border-radius: var(--radius-md);
    font-size: 0.72rem;
    justify-content: center;
    min-width: 0;
  }

  .fullscreen-button .button-text {
    display: none;
  }

  .button-text {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
