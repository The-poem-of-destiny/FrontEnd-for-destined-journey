import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import {
  ATTRIBUTES,
  calculateAPByLevel,
  generateInitialPoints,
  getIdentityCosts,
  getRaceCosts,
  getTierAttributeBonus,
  INITIAL_REINCARNATION_POINTS,
  MAX_BASE_POINTS_PER_ATTR,
  MAX_BASE_POINTS_TOTAL,
} from '../data/base-info';
import { getSkills } from '../data/skills';
import type {
  Attributes,
  Background,
  CharacterConfig,
  Equipment,
  Item,
  Partner,
  Skill,
} from '../types';

// 获取默认身份（模糊匹配含有"平民"的第一个值）
const getDefaultIdentity = () =>
  _.find(_.keys(getIdentityCosts.value), id => _.includes(id, '平民')) || '';

export const useCharacterStore = defineStore('character', () => {
  // State
  const character = ref<Omit<CharacterConfig, 'attributes'>>({
    name: '',
    gender: '男',
    customGender: '',
    age: 18,
    race: '人类',
    customRace: '',
    identity: getDefaultIdentity(),
    customIdentity: '',
    startLocation: '大陆东南部区域-索伦蒂斯王国',
    customStartLocation: '',
    level: 1,
    basePoints: {
      力量: 0,
      敏捷: 0,
      体质: 0,
      智力: 0,
      精神: 0,
    },
    attributePoints: {
      力量: 0,
      敏捷: 0,
      体质: 0,
      智力: 0,
      精神: 0,
    },
    reincarnationPoints: INITIAL_REINCARNATION_POINTS, // 转生点数
    destinyPoints: 0, // 命运点数
    money: 0,
  });

  // 选择的装备、道具、技能
  const selectedEquipments = ref<Equipment[]>([]);
  const selectedItems = ref<Item[]>([]);
  const selectedSkills = ref<Skill[]>([]);

  // 选择的伙伴和背景
  const selectedPartners = ref<Partner[]>([]);
  const selectedBackground = ref<Background | null>(null);

  // Computed

  /**
   * 计算当前消耗的转生点数
   */
  const consumedPoints = computed(() => {
    return _.sum([
      // 种族消耗
      _.get(getRaceCosts.value, character.value.race, 0),
      // 身份消耗
      _.get(getIdentityCosts.value, character.value.identity, 0),
      // 属性加点消耗 (每点1个转生点)
      usedAP.value,
      // 装备消耗
      _.sumBy(selectedEquipments.value, 'cost'),
      // 道具消耗
      _.sumBy(selectedItems.value, 'cost'),
      // 技能消耗
      _.sumBy(selectedSkills.value, 'cost'),
      // 伙伴消耗
      _.sumBy(selectedPartners.value, 'cost'),
      // 金钱兑换消耗 (1:100)
      Math.ceil(character.value.money / 100),
      // 命运点数兑换消耗 (1:2)
      Math.ceil(character.value.destinyPoints / 2),
    ]);
  });

  // Actions

  const updateCharacterField = (field: keyof CharacterConfig, value: unknown) => {
    character.value[field] = value as never;
  };

  const updateAttribute = (attr: keyof Attributes, points: number) => {
    character.value.attributePoints[attr] = Math.max(0, points);
  };

  // 基础点操作
  const addBasePoint = (attr: keyof Attributes) => {
    if (remainingBP.value > 0 && character.value.basePoints[attr] < MAX_BASE_POINTS_PER_ATTR) {
      character.value.basePoints[attr]++;
    }
  };

  const removeBasePoint = (attr: keyof Attributes) => {
    if (character.value.basePoints[attr] > 0) {
      character.value.basePoints[attr]--;
    }
  };

  // 额外点操作
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
      identity: getDefaultIdentity(),
      customIdentity: '',
      startLocation: '大陆东南部区域-索伦蒂斯王国',
      customStartLocation: '',
      level: 1,
      basePoints: {
        力量: 0,
        敏捷: 0,
        体质: 0,
        智力: 0,
        精神: 0,
      },
      attributePoints: {
        力量: 0,
        敏捷: 0,
        体质: 0,
        智力: 0,
        精神: 0,
      },
      reincarnationPoints: INITIAL_REINCARNATION_POINTS,
      destinyPoints: 0,
      money: 0,
    };
  };

  // 装备、道具、技能相关操作
  const addEquipment = (equipment: Equipment) => {
    selectedEquipments.value.push(equipment);
  };

  const removeEquipment = (equipment: Equipment) => {
    _.remove(selectedEquipments.value, e => e.name === equipment.name);
  };

  const replaceEquipmentByName = (equipment: Equipment, targetName: string) => {
    _.remove(selectedEquipments.value, e => e.name === targetName);
    selectedEquipments.value.push(equipment);
  };

  const addItem = (item: Item) => {
    selectedItems.value.push(item);
  };

  const removeItem = (item: Item) => {
    _.remove(selectedItems.value, i => i.name === item.name);
  };

  const replaceItemByName = (item: Item, targetName: string) => {
    _.remove(selectedItems.value, i => i.name === targetName);
    selectedItems.value.push(item);
  };

  const addSkill = (skill: Skill) => {
    selectedSkills.value.push(skill);
  };

  const removeSkill = (skill: Skill) => {
    _.remove(selectedSkills.value, s => s.name === skill.name);
  };

  const replaceSkillByName = (skill: Skill, targetName: string) => {
    _.remove(selectedSkills.value, s => s.name === targetName);
    selectedSkills.value.push(skill);
  };

  const clearSelections = () => {
    selectedEquipments.value = [];
    selectedItems.value = [];
    selectedSkills.value = [];
  };

  // 清空伙伴
  const clearPartners = () => {
    selectedPartners.value = [];
  };

  // 清空所有选择（包括装备、道具、技能、伙伴、背景）
  const clearAllSelections = () => {
    selectedEquipments.value = [];
    selectedItems.value = [];
    selectedSkills.value = [];
    selectedPartners.value = [];
    selectedBackground.value = null;
  };

  // 伙伴相关操作
  const addPartner = (partner: Partner) => {
    selectedPartners.value.push(partner);
  };

  const removePartner = (partner: Partner) => {
    _.remove(selectedPartners.value, p => p.name === partner.name);
  };

  const replacePartnerByName = (partner: Partner, targetName: string) => {
    _.remove(selectedPartners.value, p => p.name === targetName);
    selectedPartners.value.push(partner);
  };

  // 背景相关操作
  const setBackground = (background: Background | null) => {
    selectedBackground.value = background;
  };

  // 命运点数重置
  const resetDestinyExchange = () => {
    character.value.destinyPoints = 0;
  };

  // 基础点相关计算
  const usedBP = computed(() => _.sum(_.values(character.value.basePoints)));
  const maxBP = computed(() => MAX_BASE_POINTS_TOTAL);
  const remainingBP = computed(() => maxBP.value - usedBP.value);

  // 额外点相关计算
  const usedAP = computed(() => _.sum(_.values(character.value.attributePoints)));
  const maxAP = computed(() => calculateAPByLevel(character.value.level));
  const remainingAP = computed(() => maxAP.value - usedAP.value);

  // 最终属性计算
  const finalAttributes = computed(() => {
    const tierBonus = getTierAttributeBonus(character.value.level);
    return _.fromPairs(
      _.map(ATTRIBUTES, attr => [
        attr,
        character.value.basePoints[attr] + tierBonus + character.value.attributePoints[attr],
      ]),
    ) as unknown as Attributes;
  });

  // 监听等级变化，自动重置属性点分配
  // 使用 flush: 'sync' 确保 watcher 同步执行，避免在应用预设时属性点被异步清空
  watch(
    () => character.value.level,
    () => {
      // 等级变化时，仅重置额外点分配（基础点不受等级影响）
      character.value.attributePoints = {
        力量: 0,
        敏捷: 0,
        体质: 0,
        智力: 0,
        精神: 0,
      };
    },
    { flush: 'sync' },
  );

  // 监听种族变化，清除不符合新种族要求的技能
  watch(
    () => [character.value.race, character.value.customRace],
    () => {
      // 获取当前种族（包括自定义种族）
      const currentRace =
        character.value.race === '自定义' ? character.value.customRace : character.value.race;

      // 获取所有种族列表（排除"自定义"）
      const raceSpecificCategories = _.without(_.keys(getRaceCosts.value), '自定义');

      // 获取技能数据
      const skillGroups = getSkills();

      // 查找技能所属分类的辅助函数
      const findSkillCategory = (skillName: string): string => {
        return _.findKey(skillGroups, skills => _.some(skills, s => s.name === skillName)) || '';
      };

      // 移除不符合当前种族的技能
      _.remove(selectedSkills.value, skill => {
        const skillCategory = findSkillCategory(skill.name);
        return _.includes(raceSpecificCategories, skillCategory) && skillCategory !== currentRace;
      });
    },
    { deep: true },
  );

  // 监听身份数据加载完成，更新默认身份
  watch(
    getIdentityCosts,
    newCosts => {
      if (!character.value.identity && !_.isEmpty(newCosts)) {
        character.value.identity = getDefaultIdentity();
      }
    },
    { immediate: true },
  );

  return {
    character,
    consumedPoints,
    selectedEquipments,
    selectedItems,
    selectedSkills,
    selectedPartners,
    selectedBackground,

    usedBP,
    maxBP,
    remainingBP,
    usedAP,
    maxAP,
    remainingAP,
    finalAttributes,

    updateCharacterField,
    updateAttribute,
    addBasePoint,
    removeBasePoint,
    addAttributePoint,
    removeAttributePoint,
    rollInitialPoints,
    resetCharacter,
    addEquipment,
    removeEquipment,
    replaceEquipmentByName,
    addItem,
    removeItem,
    replaceItemByName,
    addSkill,
    removeSkill,
    replaceSkillByName,
    clearSelections,
    clearPartners,
    clearAllSelections,
    addPartner,
    removePartner,
    replacePartnerByName,
    setBackground,
    resetDestinyExchange,
  };
});
