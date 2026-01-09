<script setup lang="ts">
import ExchangeCard from '../../../components/exchange-card.vue';
import { useStorePoints } from '../../../composables';
import { useCharacterStore } from '../../../store/character';

const characterStore = useCharacterStore();
const { availablePoints } = useStorePoints();

const pointsToExchange = ref(0);

const handleExchange = () => {
  if (pointsToExchange.value > 0 && pointsToExchange.value <= availablePoints.value) {
    characterStore.exchangeDestinyPoints(pointsToExchange.value);
    pointsToExchange.value = 0;
  }
};

const handleExchangeAll = () => {
  if (availablePoints.value <= 0) return;
  characterStore.exchangeDestinyPoints(availablePoints.value);
  pointsToExchange.value = 0;
};

const handleReset = () => {
  characterStore.resetDestinyExchange();
  pointsToExchange.value = 0;
};
</script>

<template>
  <ExchangeCard
    v-model="pointsToExchange"
    title="命运点数"
    rate-text="(1转生点 = 2命运点)"
    icon-class="fa-solid fa-stars"
    current-label="剩余："
    :current-value="characterStore.character.destinyPoints"
    gain-unit="命运点"
    :gain-per-point="2"
    :max-exchangeable="availablePoints"
    theme="violet"
    exchange-all-title="将所有剩余转生点数兑换为命运点数"
    reset-title="重置已兑换的命运点数"
    :reset-disabled="characterStore.character.destinyPoints <= 0"
    @exchange="handleExchange"
    @exchange-all="handleExchangeAll"
    @reset="handleReset"
  />
</template>
