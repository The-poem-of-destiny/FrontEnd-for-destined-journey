import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import {
  ATTRIBUTES,
  BASE_STAT,
  calculateAPByLevel,
  generateInitialPoints,
  getTierAttributeBonus,
  IDENTITY_COSTS,
  INITIAL_REINCARNATION_POINTS,
  RACE_COSTS,
} from '../data/base-info';
import type { Attributes, Background, CharacterConfig, DestinedOne, Equipment, Item, Skill } from '../types';

export const useCharacterStore = defineStore('character', () => {
  // State
  const character = ref<Omit<CharacterConfig, 'attributes'>>({
    name: '',
    gender: '男',
    customGender: '',
    age: 18,
    race: '人类',
    customRace: '',
    identity: '自由平民',
    customIdentity: '',
    startLocation: '大陆东南部区域-索伦蒂斯王国',
    customStartLocation: '',
    level: 1,
    attributePoints: {
      力量: 0,
      敏捷: 0,
      体质: 0,
      智力: 0,
      精神: 0,
    },
    reincarnationPoints: INITIAL_REINCARNATION_POINTS, // 转生点数
    destinyPoints: 0, // 命运点数
  });

  // 选择的装备、道具、技能
  const selectedEquipments = ref<Equipment[]>([]);
  const selectedItems = ref<Item[]>([]);
  const selectedSkills = ref<Skill[]>([]);

  // 选择的命定之人和背景
  const selectedDestinedOnes = ref<DestinedOne[]>([]);
  const selectedBackground = ref<Background | null>(null);

  // Computed

  // 已兑换为命运点数的转生点数
  const exchangedReincarnationPoints = ref(0);

  /**
   * 计算当前消耗的转生点数
   */
  const consumedPoints = computed(() => {
    let total = 0;

    // 种族消耗
    const raceCost = RACE_COSTS[character.value.race] || 0;
    total += raceCost;

    // 身份消耗
    const identityCost = IDENTITY_COSTS[character.value.identity] || 0;
    total += identityCost;

    // 属性加点消耗 (每点1个转生点)
    const attributeAddPoints = usedAP.value;
    total += attributeAddPoints;

    // 装备消耗
    const equipmentCost = selectedEquipments.value.reduce((sum, item) => sum + item.cost, 0);
    total += equipmentCost;

    // 道具消耗
    const itemCost = selectedItems.value.reduce((sum, item) => sum + item.cost, 0);
    total += itemCost;

    // 技能消耗
    const skillCost = selectedSkills.value.reduce((sum, skill) => sum + skill.cost, 0);
    total += skillCost;

    // 命定之人消耗
    const destinedOnesCost = selectedDestinedOnes.value.reduce((sum, one) => sum + one.cost, 0);
    total += destinedOnesCost;

    // 兑换命运点数消耗的转生点数
    total += exchangedReincarnationPoints.value;

    return total;
  });

  // Actions

  const updateCharacterField = (field: keyof CharacterConfig, value: unknown) => {
    character.value[field] = value as never;
  };

  const updateAttribute = (attr: keyof Attributes, points: number) => {
    character.value.attributePoints[attr] = Math.max(0, points);
  };

  const addAttributePoint = (attr: keyof Attributes) => {
    if (remainingAP.value > 0) {
      character.value.attributePoints[attr]++;
    }
  };

  const removeAttributePoint = (attr: keyof Attributes) => {
    if (character.value.attributePoints[attr] > 0) {
      character.value.attributePoints[attr]--;
    }
  };

  const rollInitialPoints = () => {
    const newPoints = generateInitialPoints(character.value.name);
    character.value.reincarnationPoints = newPoints;
    return newPoints;
  };

  const resetCharacter = () => {
    character.value = {
      name: '',
      gender: '男',
      customGender: '',
      age: 18,
      race: '人类',
      customRace: '',
      identity: '自由平民',
      customIdentity: '',
      startLocation: '大陆东南部区域-索伦蒂斯王国',
      customStartLocation: '',
      level: 1,
      attributePoints: {
        力量: 0,
        敏捷: 0,
        体质: 0,
        智力: 0,
        精神: 0,
      },
      reincarnationPoints: INITIAL_REINCARNATION_POINTS,
      destinyPoints: 0,
    };
  };

  // 装备、道具、技能相关操作
  const addEquipment = (equipment: Equipment) => {
    selectedEquipments.value.push(equipment);
  };

  const removeEquipment = (equipment: Equipment) => {
    const index = selectedEquipments.value.findIndex(e => e.name === equipment.name);
    if (index !== -1) {
      selectedEquipments.value.splice(index, 1);
    }
  };

  const addItem = (item: Item) => {
    selectedItems.value.push(item);
  };

  const removeItem = (item: Item) => {
    const index = selectedItems.value.findIndex(i => i.name === item.name);
    if (index !== -1) {
      selectedItems.value.splice(index, 1);
    }
  };

  const addSkill = (skill: Skill) => {
    selectedSkills.value.push(skill);
  };

  const removeSkill = (skill: Skill) => {
    const index = selectedSkills.value.findIndex(s => s.name === skill.name);
    if (index !== -1) {
      selectedSkills.value.splice(index, 1);
    }
  };

  const clearSelections = () => {
    selectedEquipments.value = [];
    selectedItems.value = [];
    selectedSkills.value = [];
  };

  // 命定之人相关操作
  const addDestinedOne = (destinedOne: DestinedOne) => {
    selectedDestinedOnes.value.push(destinedOne);
  };

  const removeDestinedOne = (destinedOne: DestinedOne) => {
    const index = selectedDestinedOnes.value.findIndex(d => d.name === destinedOne.name);
    if (index !== -1) {
      selectedDestinedOnes.value.splice(index, 1);
    }
  };

  // 背景相关操作
  const setBackground = (background: Background | null) => {
    selectedBackground.value = background;
  };

  // 命运点数兑换相关操作
  const exchangeDestinyPoints = (reincarnationPoints: number) => {
    // 1 转生点 = 10 命运点
    const destinyPointsToAdd = reincarnationPoints * 10;
    character.value.destinyPoints += destinyPointsToAdd;
    // 记录已兑换的转生点数
    exchangedReincarnationPoints.value += reincarnationPoints;
  };

  const setDestinyPoints = (points: number) => {
    character.value.destinyPoints = Math.max(0, points);
  };

  const resetExchangedPoints = () => {
    exchangedReincarnationPoints.value = 0;
  };

  // 属性点相关计算
  const usedAP = computed(() =>
    Object.values(character.value.attributePoints).reduce((sum, points) => sum + points, 0),
  );
  const maxAP = computed(() => calculateAPByLevel(character.value.level));
  const remainingAP = computed(() => maxAP.value - usedAP.value);

  // 最终属性计算
  const finalAttributes = computed(() => {
    const tierBonus = getTierAttributeBonus(character.value.level);
    const result: Partial<Attributes> = {};
    for (const attr of ATTRIBUTES) {
      result[attr] = BASE_STAT + tierBonus + character.value.attributePoints[attr];
    }
    return result as Attributes;
  });

  // 监听等级变化，自动重置属性点分配
  watch(
    () => character.value.level,
    () => {
      // 等级变化时，重置所有属性点分配
      character.value.attributePoints = {
        力量: 0,
        敏捷: 0,
        体质: 0,
        智力: 0,
        精神: 0,
      };
    },
  );

  return {
    character,
    consumedPoints,
    exchangedReincarnationPoints,
    selectedEquipments,
    selectedItems,
    selectedSkills,
    selectedDestinedOnes,
    selectedBackground,

    usedAP,
    maxAP,
    remainingAP,
    finalAttributes,

    updateCharacterField,
    updateAttribute,
    addAttributePoint,
    removeAttributePoint,
    rollInitialPoints,
    resetCharacter,
    addEquipment,
    removeEquipment,
    addItem,
    removeItem,
    addSkill,
    removeSkill,
    clearSelections,
    addDestinedOne,
    removeDestinedOne,
    setBackground,
    exchangeDestinyPoints,
    setDestinyPoints,
    resetExchangedPoints,
  };
});
