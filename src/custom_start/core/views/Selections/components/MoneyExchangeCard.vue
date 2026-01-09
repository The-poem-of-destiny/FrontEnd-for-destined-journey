<script setup lang="ts">
import ExchangeCard from '../../../components/exchange-card.vue';
import { useCharacterStore } from '../../../store/character';

const characterStore = useCharacterStore();

const pointsToExchange = ref(0);

const maxExchangeable = computed(() => {
  const currentSpent = Math.ceil(characterStore.character.money / 10);
  return Math.max(
    0,
    characterStore.character.reincarnationPoints - (characterStore.consumedPoints - currentSpent),
  );
});

const handleExchange = () => {
  if (pointsToExchange.value <= 0 || pointsToExchange.value > maxExchangeable.value) {
    return;
  }

  const nextMoney = Math.max(0, Math.round(pointsToExchange.value)) * 10;
  characterStore.updateCharacterField('money', nextMoney);
  pointsToExchange.value = 0;
};

const handleExchangeAll = () => {
  if (maxExchangeable.value <= 0) return;
  characterStore.updateCharacterField('money', maxExchangeable.value * 10);
  pointsToExchange.value = 0;
};

const handleReset = () => {
  characterStore.updateCharacterField('money', 0);
  pointsToExchange.value = 0;
};
</script>

<template>
  <ExchangeCard
    v-model="pointsToExchange"
    title="金钱兑换"
    rate-text="(1转生点 = 10 G)"
    icon-class="fa-solid fa-coins"
    current-label="当前："
    :current-value="characterStore.character.money"
    current-unit="G"
    gain-unit="G"
    :gain-per-point="10"
    :max-exchangeable="maxExchangeable"
    theme="gold"
    exchange-all-title="将所有剩余转生点数兑换为金钱"
    reset-title="重置已兑换的金钱"
    :reset-disabled="characterStore.character.money <= 0"
    @exchange="handleExchange"
    @exchange-all="handleExchangeAll"
    @reset="handleReset"
  />
</template>
