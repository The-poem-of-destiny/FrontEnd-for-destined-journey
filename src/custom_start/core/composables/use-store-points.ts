/**
 * 基于 store 的点数计算
 */
import { storeToRefs } from 'pinia';

import { useCharacterStore } from '../store/character';

interface UseStorePointsReturn {
  availablePoints: ComputedRef<number>;
  totalPoints: ComputedRef<number>;
  consumedPoints: ComputedRef<number>;
}

export function useStorePoints(): UseStorePointsReturn {
  const characterStore = useCharacterStore();
  const { character } = storeToRefs(characterStore);

  const totalPoints = computed(() => character.value.reincarnationPoints);

  const consumedPoints = computed(() => characterStore.consumedPoints);

  const availablePoints = computed(() => totalPoints.value - consumedPoints.value);

  return {
    availablePoints,
    totalPoints,
    consumedPoints,
  };
}
