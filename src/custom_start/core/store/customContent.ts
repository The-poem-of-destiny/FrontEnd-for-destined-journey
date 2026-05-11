import { klona } from 'klona';
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { Rarity } from '../types';
import type { Attributes } from '../views/Background/components/AttributeEditor.vue';
import type { EquipmentItem } from '../views/Background/components/EquipmentEditor.vue';
import type { SkillItem } from '../views/Background/components/SkillEditor.vue';

const CUSTOM_CONTENT_DRAFT_KEY = 'destiny_custom_content_draft_v1';

const defaultAttributes: Attributes = {
  strength: 5,
  dexterity: 5,
  constitution: 5,
  intelligence: 5,
  mind: 5,
};

const createDefaultCustomItemForm = () => ({
  categoryType: 'equipment' as 'equipment' | 'item' | 'skill',
  customItemType: '',
  itemName: '',
  itemRarity: 'common' as Rarity,
  itemTag: [] as string[],
  itemEffect: {} as Record<string, string>,
  itemDescription: '',
  itemConsume: '',
  itemQuantity: 1,
});

const createDefaultCustomPartnerForm = () => ({
  itemName: '',
  itemLevel: 1,
  itemLifeLevel: '',
  itemGrade: 1,
  itemRace: '',
  itemIdentity: [] as string[],
  itemCareer: [] as string[],
  itemPersonality: '',
  itemLike: '',
  itemApp: '',
  itemCloth: '',
  itemEquip: [] as EquipmentItem[],
  itemAttributes: klona(defaultAttributes) as Attributes,
  itemStairway: '',
  itemIsContract: true,
  itemAffinity: 0,
  itemComment: '',
  itemBackgroundInfo: '',
  itemSkills: [] as SkillItem[],
});

type CustomContentDraft = {
  customBackgroundDescription?: string;
  editingCustomItemName?: string;
  editingCustomPartnerName?: string;
  customItemForm?: Partial<ReturnType<typeof createDefaultCustomItemForm>>;
  customPartnerForm?: Partial<ReturnType<typeof createDefaultCustomPartnerForm>>;
};

const readDraft = (): CustomContentDraft => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(CUSTOM_CONTENT_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as CustomContentDraft) : {};
  } catch {
    return {};
  }
};

const writeDraft = (draft: CustomContentDraft) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(CUSTOM_CONTENT_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // localStorage may be unavailable in restricted browser modes.
  }
};

/**
 * 自定义内容 Store
 * 管理所有用户自定义输入的内容，实现跨页面状态持久化
 */
export const useCustomContentStore = defineStore('customContent', () => {
  const initialDraft = readDraft();

  /**
   * 自定义开局剧情描述
   */
  const customBackgroundDescription = ref(initialDraft.customBackgroundDescription || '');

  /**
   * 自定义物品编辑标识
   */
  const editingCustomItemName = ref(initialDraft.editingCustomItemName || '');

  /**
   * 自定义伙伴编辑标识
   */
  const editingCustomPartnerName = ref(initialDraft.editingCustomPartnerName || '');

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
    ...createDefaultCustomItemForm(),
    ...(initialDraft.customItemForm || {}),
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
    customItemForm.value = createDefaultCustomItemForm();
    editingCustomItemName.value = '';
  };

  /**
   * 自定义伙伴表单数据
   * 使用专业级数据结构：数组用于多值字段，对象用于复杂结构
   */
  const customPartnerForm = ref({
    ...createDefaultCustomPartnerForm(),
    ...(initialDraft.customPartnerForm || {}),
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
    customPartnerForm.value = createDefaultCustomPartnerForm();
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

  watch(
    [
      customBackgroundDescription,
      editingCustomItemName,
      editingCustomPartnerName,
      customItemForm,
      customPartnerForm,
    ],
    () => {
      writeDraft({
        customBackgroundDescription: customBackgroundDescription.value,
        editingCustomItemName: editingCustomItemName.value,
        editingCustomPartnerName: editingCustomPartnerName.value,
        customItemForm: customItemForm.value,
        customPartnerForm: customPartnerForm.value,
      });
    },
    { deep: true },
  );

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
