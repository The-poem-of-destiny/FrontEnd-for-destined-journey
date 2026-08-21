<script setup lang="ts">
import type { Asset } from '../types';
import { getRarityLabel } from '../utils/form-options';
import CardActionFooter from './CardActionFooter.vue';

interface Props {
  asset: Asset;
  selected?: boolean;
  disabled?: boolean;
  detailsOpen?: boolean;
  detailsToggleable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  disabled: false,
  detailsToggleable: true,
});

const emit = defineEmits<{
  (event: 'select', asset: Asset): void;
  (event: 'deselect', asset: Asset): void;
  (event: 'toggle-details', asset: Asset): void;
}>();

const effects = computed(() =>
  Object.entries(props.asset.内部资产 || {}).flatMap(([, internal]) =>
    Object.entries(internal.效果 || {}),
  ),
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
    tabindex="0"
    @click="toggleDetails"
    @keydown.enter.prevent="toggleDetails"
    @keydown.space.prevent="toggleDetails"
  >
    <div class="asset-header">
      <strong>{{ asset.name }}</strong>
      <span>{{ getRarityLabel(asset.rarity) }}</span>
    </div>

    <div class="asset-body">
      <div><b>类型：</b>{{ asset.类型 }}</div>
      <div v-if="asset.标签?.length"><b>标签：</b>{{ asset.标签.join('、') }}</div>
      <div v-if="asset.结算"><b>结算：</b>{{ asset.结算 }}</div>
      <div v-if="effects.length" class="asset-effects">
        <b>效果：</b>
        <span v-for="([key, value], index) in effects" :key="`${key}-${index}`">
          {{ key }}：{{ value }}<span v-if="index < effects.length - 1">；</span>
        </span>
      </div>
      <div v-if="asset.描述" class="asset-description">{{ asset.描述 }}</div>
    </div>

    <CardActionFooter
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
  min-height: 280px;
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.asset-card.is-selected {
  border-color: var(--accent-color);
}

.asset-card.is-disabled {
  opacity: 0.58;
}

.asset-header,
.asset-body {
  padding: var(--spacing-md);
}

.asset-header {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
}

.asset-header span {
  color: var(--accent-color);
  white-space: nowrap;
}

.asset-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--spacing-sm);
  color: var(--text-color);
}

.asset-effects,
.asset-description {
  line-height: 1.5;
}

.asset-description {
  color: var(--text-light);
}
</style>
