<script setup lang="ts">
import type { Equipment, Item, Rarity, Skill } from '../types';

interface Props {
  item: Equipment | Item | Skill;
  selected?: boolean;
  disabled?: boolean;
}

interface Emits {
  (e: 'select', item: Equipment | Item | Skill): void;
  (e: 'deselect', item: Equipment | Item | Skill): void;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  disabled: false,
});

const emit = defineEmits<Emits>();

// 稀有度对应的颜色
const rarityColors: Record<Rarity, string> = {
  only: '#ff6f00',
  common: '#9e9e9e',
  uncommon: '#388e3c',
  rare: '#193c96',
  epic: '#9c27b0',
  legendary: '#9e7121',
  mythic: '#d32f2f',
};

const rarityNames: Record<Rarity, string> = {
  only: '唯一',
  common: '普通',
  uncommon: '优良',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
  mythic: '神话',
};

const handleClick = () => {
  if (props.disabled) return;

  if (props.selected) {
    emit('deselect', props.item);
  } else {
    emit('select', props.item);
  }
};

// 判断是否为技能类型
const isSkill = (item: Equipment | Item | Skill): item is Skill => {
  return 'consume' in item;
};

// 判断是否为物品类型
const isItem = (item: Equipment | Item | Skill): item is Item => {
  return 'quantity' in item;
};

const formatEffectEntries = (effect?: Record<string, string>) =>
  effect ? Object.entries(effect) : [];
</script>

<template>
  <div
    class="item-card"
    :class="{
      'is-selected': selected,
      'is-disabled': disabled,
    }"
    :style="{ '--rarity-color': rarityColors[item.rarity] }"
    @click="handleClick"
  >
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="item-name">{{ item.name }}</div>
      <div class="item-rarity" :style="{ color: rarityColors[item.rarity] }">
        {{ rarityNames[item.rarity] }}
      </div>
    </div>

    <!-- 卡片内容 -->
    <div class="card-body">
      <div class="item-info">
        <span class="info-label">类型:</span>
        <span class="info-value">{{ item.type }}</span>
      </div>

      <div v-if="'tag' in item && item.tag && item.tag.length > 0" class="item-info">
        <span class="info-label">标签:</span>
        <div class="tag-list">
          <span v-for="tag in item.tag" :key="tag" class="tag-chip">{{ tag }}</span>
        </div>
      </div>

      <div v-if="isItem(item) && item.quantity" class="item-info">
        <span class="info-label">数量:</span>
        <span class="info-value quantity">{{ item.quantity }}</span>
      </div>

      <div v-if="isSkill(item) && item.consume" class="item-info">
        <span class="info-label">消耗:</span>
        <span class="info-value consume">{{ item.consume }}</span>
      </div>

      <div v-if="'effect' in item && Object.keys(item.effect || {}).length > 0" class="item-effect">
        <div class="effect-label">效果:</div>
        <div class="effect-grid">
          <div
            v-for="([key, value], index) in formatEffectEntries(item.effect)"
            :key="`${key}-${index}`"
            class="effect-row"
          >
            <span class="effect-key">{{ key }}</span>
            <span class="effect-value">{{ value }}</span>
          </div>
        </div>
      </div>

      <div class="item-description">{{ item.description }}</div>
    </div>

    <!-- 卡片底部 -->
    <div class="card-footer">
      <div class="item-cost">
        <span class="cost-label">消耗点数:</span>
        <span class="cost-value">{{ item.cost }}</span>
      </div>
      <div v-if="selected" class="selected-badge">✓ 已选择</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.item-card {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--rarity-color);
    opacity: 0.6;
  }

  &:hover:not(.is-disabled) {
    border-color: var(--accent-color);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  &.is-selected {
    border-color: var(--accent-color);
    background: linear-gradient(to bottom, var(--card-bg), rgba(212, 175, 55, 0.05));
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);

    &::before {
      height: 4px;
      opacity: 1;
    }
  }

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color-light);

  .item-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--title-color);
  }

  .item-rarity {
    font-size: 0.9rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    background: rgba(0, 0, 0, 0.1);
  }
}

.card-body {
  margin-bottom: var(--spacing-md);

  .item-info {
    display: flex;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-xs);
    font-size: 0.9rem;

    .info-label {
      color: var(--text-light);
      font-weight: 600;
      min-width: 50px;
    }

    .info-value {
      color: var(--text-color);
      flex: 1;

      &.quantity {
        font-family: monospace;
        font-size: 0.9rem;
        font-weight: 600;
        color: #4caf50;
      }

      &.consume {
        font-family: monospace;
        font-size: 0.85rem;
        color: #2196f3;
      }
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }

    .tag-chip {
      padding: 2px 8px;
      font-size: 0.8rem;
      border-radius: 999px;
      background: rgba(212, 175, 55, 0.15);
      color: var(--accent-color);
      border: 1px solid rgba(212, 175, 55, 0.35);
      font-family: var(--font-mono);
    }
  }

  .item-effect {
    margin: var(--spacing-sm) 0;
    padding: var(--spacing-sm);
    background: rgba(212, 175, 55, 0.05);
    border-left: 3px solid var(--accent-color);
    border-radius: var(--radius-sm);

    .effect-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--accent-color);
      margin-bottom: var(--spacing-xs);
    }

    .effect-grid {
      display: grid;
      grid-template-columns: minmax(80px, 120px) 1fr;
      gap: 6px 12px;
      font-size: 0.85rem;
      color: var(--text-color);
    }

    .effect-row {
      display: contents;
    }

    .effect-key {
      color: var(--text-light);
      font-weight: 600;
    }

    .effect-value {
      color: var(--text-color);
    }
  }

  .item-description {
    margin-top: var(--spacing-sm);
    font-size: 0.85rem;
    line-height: 1.6;
    color: var(--text-light);
    font-style: italic;
  }
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-color-light);

  .item-cost {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;

    .cost-label {
      font-size: 0.9rem;
      color: var(--text-light);
    }

    .cost-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--accent-color);
    }
  }

  .selected-badge {
    padding: 4px 12px;
    background: var(--accent-color);
    color: var(--primary-bg);
    border-radius: var(--radius-md);
    font-size: 0.85rem;
    font-weight: 600;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .item-card {
    padding: var(--spacing-sm);
  }

  .card-header {
    .item-name {
      font-size: 1rem;
    }

    .item-rarity {
      font-size: 0.8rem;
    }
  }

  .card-body {
    .item-info {
      font-size: 0.85rem;
    }

    .item-effect {
      .effect-label {
        font-size: 0.85rem;
      }

      .effect-content {
        font-size: 0.8rem;
      }
    }

    .item-description {
      font-size: 0.8rem;
    }
  }

  .card-footer {
    .item-cost {
      .cost-label {
        font-size: 0.85rem;
      }

      .cost-value {
        font-size: 1rem;
      }
    }

    .selected-badge {
      font-size: 0.8rem;
      padding: 3px 10px;
    }
  }
}
</style>
