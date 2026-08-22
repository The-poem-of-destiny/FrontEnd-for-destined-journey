<script setup lang="ts">
import type { Asset } from '../types';
import { getRarityColor, getRarityLabel } from '../utils/form-options';
import { resolvePlayerPlaceholders } from '../utils/asset';
import CardActionFooter from './CardActionFooter.vue';

interface Props {
  asset: Asset;
  selected?: boolean;
  disabled?: boolean;
  detailsOpen?: boolean;
  detailsToggleable?: boolean;
  playerName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  disabled: false,
  detailsToggleable: true,
  playerName: '',
});

const emit = defineEmits<{
  (event: 'select', asset: Asset): void;
  (event: 'deselect', asset: Asset): void;
  (event: 'toggle-details', asset: Asset): void;
}>();

const displayAsset = computed(() =>
  resolvePlayerPlaceholders(props.asset, props.playerName),
);

const selectButtonText = computed(() => {
  if (props.selected) return '取消选择';
  if (props.disabled) return '点数不足';
  return '选择';
});

const toggleDetails = () => {
  if (props.detailsToggleable) emit('toggle-details', props.asset);
};

const toggleSelect = () => {
  if (props.disabled && !props.selected) return;
  emit(props.selected ? 'deselect' : 'select', props.asset);
};
</script>

<template>
  <div
    class="asset-card selectable-card"
    :class="{ 'is-selected': selected, 'is-disabled': disabled, 'is-details-open': detailsOpen }"
    :style="{ '--rarity-color': getRarityColor(displayAsset.rarity) }"
    :tabindex="detailsToggleable ? 0 : undefined"
    :aria-expanded="detailsToggleable ? detailsOpen : undefined"
    @click="toggleDetails"
    @keydown.enter.prevent="toggleDetails"
    @keydown.space.prevent="toggleDetails"
  >
    <div class="card-header">
      <div class="asset-name">{{ displayAsset.name }}</div>
      <div class="asset-rarity" :style="{ color: getRarityColor(displayAsset.rarity) }">
        {{ getRarityLabel(displayAsset.rarity) }}
      </div>
    </div>

    <div class="card-body themed-scrollbar">
      <div class="asset-info"><span class="info-label">类型:</span><span>{{ displayAsset.类型 }}</span></div>
      <div v-if="displayAsset.标签?.length" class="asset-info">
        <span class="info-label">标签:</span>
        <div class="tag-list"><span v-for="tag in displayAsset.标签" :key="tag" class="tag-chip">{{ tag }}</span></div>
      </div>
      <div v-if="displayAsset.总空间" class="asset-info"><span class="info-label">总空间:</span><span>{{ displayAsset.总空间 }}</span></div>
      <div v-if="displayAsset.位置" class="asset-info"><span class="info-label">位置:</span><span>{{ displayAsset.位置 }}</span></div>
      <div v-if="displayAsset.结算" class="asset-info"><span class="info-label">结算:</span><span>{{ displayAsset.结算 }}</span></div>
      <div v-if="displayAsset.描述" class="asset-description">{{ displayAsset.描述 }}</div>
      <div v-if="Object.keys(displayAsset.内部资产 ?? {}).length" class="asset-internals">
        <div class="internals-label">内部资产:</div>
        <div v-for="([name, internal]) in Object.entries(displayAsset.内部资产 ?? {})" :key="name" class="asset-internal">
          <div class="internal-title">
            <strong>{{ name }}<span v-if="internal.数量 > 1"> ×{{ internal.数量 }}</span></strong>
            <span v-if="internal.品质" class="internal-rarity">{{ getRarityLabel(internal.品质 as Asset['rarity']) }}</span>
          </div>
          <div v-if="internal.标签?.length" class="internal-tags">{{ internal.标签.join('、') }}</div>
          <div v-if="internal.总占用空间" class="internal-space">占用：{{ internal.总占用空间 }}</div>
          <div v-for="([key, value]) in Object.entries(internal.效果 || {})" :key="key" class="internal-effect">
            <span class="effect-key">{{ key }}:</span><span>{{ value }}</span>
          </div>
          <div v-if="internal.描述" class="internal-description">{{ internal.描述 }}</div>
        </div>
      </div>
    </div>

    <CardActionFooter
      class="card-footer-slot"
      :selected="selected"
      :disabled="disabled && !selected"
      :details-open="detailsOpen"
      :show-detail-state="detailsToggleable"
      :select-label="selectButtonText"
      :cost-text="`${asset.cost} 点`"
      @toggle-select="toggleSelect"
    />
  </div>
</template>

<style scoped lang="scss">
.asset-card {
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

  &:hover:not(.is-disabled) {
    border-color: var(--accent-color);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
}

.asset-card.is-selected {
  border-color: var(--accent-color);
}

.asset-card.is-disabled {
  opacity: 0.58;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color-light);
}

.asset-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--title-color);
  overflow-wrap: anywhere;
}

.asset-rarity {
  flex: none;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.1);
  font-size: 0.9rem;
  font-weight: 600;
}

.card-body {
  display: none;
  max-height: 520px;
  margin-bottom: var(--spacing-md);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-color-light);
  overflow-y: auto;
}

.is-details-open .card-body {
  display: block;
}

.asset-info {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}

.info-label,
.internals-label {
  color: var(--text-light);
  font-weight: 600;
  flex: none;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-chip {
  padding: 2px 8px;
  border: 1px solid rgba(212, 175, 55, 0.35);
  border-radius: 999px;
  background: rgba(212, 175, 55, 0.15);
  color: var(--accent-color);
  font-family: var(--font-mono);
  font-size: 0.8rem;
}

.asset-internals {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}

.asset-internal {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--spacing-sm);
  border: 1px solid var(--border-color-light);
  border-left: 3px solid var(--rarity-color);
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.08);
  overflow-wrap: anywhere;
}

.internal-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xs);
}

.internal-rarity,
.effect-key {
  color: var(--accent-color);
  font-weight: 600;
}

.internal-tags,
.internal-space,
.internal-description {
  color: var(--text-light);
  font-size: 0.82rem;
}

.internal-effect {
  display: flex;
  gap: var(--spacing-xs);
  font-size: 0.85rem;
  line-height: 1.5;
}

.asset-description {
  margin-top: var(--spacing-sm);
  color: var(--text-light);
  font-size: 0.85rem;
  font-style: italic;
  line-height: 1.6;
}

.card-footer-slot {
  margin-top: auto;
}

@media (max-width: 768px) {
  .asset-card {
    min-height: 58px;
    padding: 0;
    border-width: 1px;
    border-radius: var(--radius-md);
  }

  .asset-card:hover:not(.is-disabled) {
    transform: none;
  }

  .card-header {
    margin-bottom: 0;
    padding: 7px var(--spacing-sm) 7px 12px;
    border-bottom: none;
  }

  .asset-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.92rem;
  }

  .asset-rarity {
    padding: 1px 6px;
    font-size: 0.72rem;
  }

  .card-body {
    max-height: 380px;
    margin: 0;
    padding: var(--spacing-sm);
  }

  .card-footer-slot {
    padding: 6px var(--spacing-sm);
  }
}

.asset-description {
  color: var(--text-light);
}
</style>
