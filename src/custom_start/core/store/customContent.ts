import { klona } from 'klona';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Rarity } from '../types';
import type { Attributes } from '../views/Background/components/AttributeEditor.vue';
import type { EquipmentItem } from '../views/Background/components/EquipmentEditor.vue';
import type { SkillItem } from '../views/Background/components/SkillEditor.vue';

/**
 * 自定义内容 Store
 * 管理所有用户自定义输入的内容，实现跨页面状态持久化
 */
export const useCustomContentStore = defineStore('customContent', () => {
  /**
   * 自定义开局剧情描述
   */
  const customBackgroundDescription = ref('');

  /**
   * 自定义物品编辑标识
   */
  const editingCustomItemName = ref('');

  /**
   * 自定义伙伴编辑标识
   */
  const editingCustomPartnerName = ref('');

  /**
   * 更新自定义开局描述
   */
  const updateCustomBackgroundDescription = (value: string) => {
    customBackgroundDescription.value = value;
  };

  /**
   * 自定义物品表单数据
   */
  const customItemForm = ref({
    categoryType: 'equipment' as 'equipment' | 'item' | 'asset' | 'skill',
    customItemType: '',
    itemName: '',
    itemRarity: 'common' as Rarity,
    itemTag: [] as string[],
    itemEffect: {} as Record<string, string>,
    itemDescription: '',
    itemConsume: '',
    itemSettlement: '',
    itemQuantity: 1,
  });

  /**
   * 更新自定义物品表单
   */
  const updateCustomItemForm = (field: keyof typeof customItemForm.value, value: any) => {
    customItemForm.value[field] = value as never;
  };

  /**
   * 批量设置自定义物品表单
   */
  const setCustomItemForm = (value: Partial<typeof customItemForm.value>) => {
    customItemForm.value = {
      ...customItemForm.value,
      ...value,
    };
  };

  /**
   * 更新自定义物品编辑标识
   */
  const updateEditingCustomItemName = (value: string) => {
    editingCustomItemName.value = value;
  };

  /**
   * 重置自定义物品表单
   */
  const resetCustomItemForm = () => {
    customItemForm.value = {
      categoryType: 'equipment',
      customItemType: '',
      itemName: '',
      itemRarity: 'common' as Rarity,
      itemTag: [],
      itemEffect: {},
      itemDescription: '',
      itemConsume: '',
      itemSettlement: '',
      itemQuantity: 1,
    };
    editingCustomItemName.value = '';
  };

  /**
   * 默认属性值
   */
  const defaultAttributes: Attributes = {
    strength: 5,
    dexterity: 5,
    constitution: 5,
    intelligence: 5,
    mind: 5,
  };

  /**
   * 自定义伙伴表单数据
   * 使用专业级数据结构：数组用于多值字段，对象用于复杂结构
   */
  const customPartnerForm = ref({
    itemName: '',
    itemLevel: 1,
    itemLifeLevel: '',
    itemGrade: 1,
    itemRace: '',
    // 使用数组类型存储多值字段
    itemIdentity: [] as string[],
    itemCareer: [] as string[],
    itemPersonality: '',
    itemLike: '',
    itemApp: '',
    itemCloth: '',
    // 使用专业编辑器组件的数据结构
    itemEquip: [] as EquipmentItem[],
    itemAttributes: { ...defaultAttributes } as Attributes,
    itemStairway: '',
    itemIsContract: true,
    itemAffinity: 0,
    itemComment: '',
    itemBackgroundInfo: '',
    itemSkills: [] as SkillItem[],
  });

  /**
   * 更新自定义伙伴表单
   */
  const updateCustomPartnerForm = (field: keyof typeof customPartnerForm.value, value: any) => {
    customPartnerForm.value[field] = value as never;
  };

  /**
   * 批量设置自定义伙伴表单
   */
  const setCustomPartnerForm = (value: Partial<typeof customPartnerForm.value>) => {
    customPartnerForm.value = {
      ...customPartnerForm.value,
      ...value,
    };
  };

  /**
   * 更新自定义伙伴编辑标识
   */
  const updateEditingCustomPartnerName = (value: string) => {
    editingCustomPartnerName.value = value;
  };

  /**
   * 重置自定义伙伴表单
   * 使用 klona 确保深拷贝安全
   */
  const resetCustomPartnerForm = () => {
    customPartnerForm.value = {
      itemName: '',
      itemLevel: 1,
      itemLifeLevel: '',
      itemGrade: 1,
      itemRace: '',
      itemIdentity: [],
      itemCareer: [],
      itemPersonality: '',
      itemLike: '',
      itemApp: '',
      itemCloth: '',
      itemEquip: [],
      itemAttributes: klona(defaultAttributes),
      itemStairway: '',
      itemIsContract: true,
      itemAffinity: 0,
      itemComment: '',
      itemBackgroundInfo: '',
      itemSkills: [],
    };
    editingCustomPartnerName.value = '';
  };

  /**
   * 重置所有自定义内容
   */
  const resetAll = () => {
    customBackgroundDescription.value = '';
    resetCustomItemForm();
    resetCustomPartnerForm();
    editingCustomItemName.value = '';
    editingCustomPartnerName.value = '';
  };

  return {
    // 自定义开局描述
    customBackgroundDescription,
    updateCustomBackgroundDescription,

    // 自定义物品编辑标识
    editingCustomItemName,
    updateEditingCustomItemName,

    // 自定义伙伴编辑标识
    editingCustomPartnerName,
    updateEditingCustomPartnerName,

    // 自定义物品表单
    customItemForm,
    updateCustomItemForm,
    setCustomItemForm,
    resetCustomItemForm,

    // 自定义伙伴表单
    customPartnerForm,
    updateCustomPartnerForm,
    setCustomPartnerForm,
    resetCustomPartnerForm,

    // 全局重置
    resetAll,
  };
});
