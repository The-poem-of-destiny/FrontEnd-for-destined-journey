<script setup lang="ts">
import type { Equipment, Item, Rarity, Skill } from '../types';
import CardActionFooter from './CardActionFooter.vue';

interface Props {
  item: Equipment | Item | Skill;
  selected?: boolean;
  disabled?: boolean;
  detailsOpen?: boolean;
  detailsToggleable?: boolean;
}

interface Emits {
  (e: 'select', item: Equipment | Item | Skill): void;
  (e: 'deselect', item: Equipment | Item | Skill): void;
  (e: 'toggle-details', item: Equipment | Item | Skill): void;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  disabled: false,
  detailsToggleable: true,
});

const emit = defineEmits<Emits>();
const internalDetailsOpen = ref(false);
const isDetailsOpen = computed(() => props.detailsOpen ?? internalDetailsOpen.value);
const selectButtonText = computed(() => {
  if (props.selected) return '取消选择';
  if (props.disabled) return '点数不足';
  return '选择';
});

// 稀有度对应的颜色
const rarityColors: Record<Rarity, string> = {
  only: '#ff6f00',
  common: '#9e9e9e',
  uncommon: '#b88a2c',
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

const handleToggleSelect = () => {
  if (props.disabled && !props.selected) return;
  if (props.selected) {
    emit('deselect', props.item);
  } else {
    emit('select', props.item);
  }
};

const handleToggleDetails = () => {
  if (!props.detailsToggleable) return;

  if (props.detailsOpen === undefined) {
    internalDetailsOpen.value = !internalDetailsOpen.value;
  }
  emit('toggle-details', props.item);
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
    class="item-card selectable-card"
    :class="{
      'is-selected': selected,
      'is-disabled': disabled,
      'is-details-open': isDetailsOpen,
      'is-details-static': !detailsToggleable,
    }"
    :style="{ '--rarity-color': rarityColors[item.rarity] }"
    :tabindex="detailsToggleable ? 0 : undefined"
    :aria-expanded="detailsToggleable ? isDetailsOpen : undefined"
    @click="handleToggleDetails"
    @keydown.enter.prevent="handleToggleDetails"
    @keydown.space.prevent="handleToggleDetails"
  >
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="item-name">{{ item.name }}</div>
      <div class="item-rarity" :style="{ color: rarityColors[item.rarity] }">
        {{ rarityNames[item.rarity] }}
      </div>
    </div>

    <!-- 卡片内容 -->
    <div class="card-body themed-scrollbar">
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
    <CardActionFooter
      class="card-footer-slot"
      :selected="selected"
      :disabled="disabled && !selected"
      :details-open="isDetailsOpen"
      :show-detail-state="detailsToggleable"
      :select-label="selectButtonText"
      :cost-text="`${item.cost} 点`"
      @toggle-select="handleToggleSelect"
    />
  </div>
</template>

<style lang="scss" scoped>
.item-card {
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-normal);
  min-width: 0;

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

  &:hover:not(.is-disabled):not(.is-details-static) {
    border-color: var(--accent-color);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  &.is-details-static {
    cursor: default;
  }

  &.is-disabled {
    border-style: dashed;
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
    overflow-wrap: anywhere;
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
  display: none;
  max-height: 260px;
  margin-bottom: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color-light);
  overflow-y: auto;

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
        color: var(--success-color);
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
      overflow-wrap: anywhere;
    }
  }

  .item-description {
    margin-top: var(--spacing-sm);
    font-size: 0.85rem;
    line-height: 1.6;
    color: var(--text-light);
    font-style: italic;
    overflow-wrap: anywhere;
  }
}

.is-details-open {
  .card-body {
    display: block;
  }
}

.card-footer-slot {
  margin-top: auto;
}

// 响应式设计
@media (max-width: 768px) {
  .item-card {
    align-items: stretch;
    min-height: 58px;
    padding: 0;
    border-width: 1px;
    border-radius: var(--radius-md);

    &::before {
      top: 0;
      right: 0;
      bottom: auto;
      width: auto;
      height: 3px;
    }

    &:hover:not(.is-disabled) {
      transform: none;
    }
  }

  .card-header {
    align-items: center;
    gap: 6px;
    margin-bottom: 0;
    padding: 7px var(--spacing-sm) 7px 12px;
    border-bottom: none;
    min-width: 0;

    .item-name {
      font-size: 0.92rem;
      line-height: 1.35;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-rarity {
      font-size: 0.72rem;
      padding: 1px 6px;
      flex: none;
    }
  }

  .card-body {
    max-height: 190px;
    margin: 0;
    overflow-y: auto;
    padding: var(--spacing-sm);

    .item-info {
      font-size: 0.85rem;
    }

    .item-effect {
      .effect-label {
        font-size: 0.85rem;
      }

      .effect-grid {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .effect-row {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-left: var(--spacing-xs);
        border-left: 2px solid var(--accent-color);
      }

      .effect-key {
        font-size: 0.85rem;
        color: var(--accent-color);
      }

      .effect-value {
        font-size: 0.8rem;
        line-height: 1.5;
      }
    }

    .item-description {
      font-size: 0.8rem;
    }
  }

  .card-footer-slot {
    padding: 6px var(--spacing-sm);
    border-top: none;
  }
}

@media (max-width: 480px) {
  .card-header {
    .item-name {
      font-size: 0.86rem;
    }

    .item-rarity {
      font-size: 0.68rem;
    }
  }

  .card-footer-slot {
    padding-right: 7px;
  }
}
</style>
