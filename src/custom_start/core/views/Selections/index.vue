<script setup lang="ts">
import CategorySelectionLayout from '../../components/CategorySelectionLayout.vue';
import { getRaceCosts } from '../../data/base-info';
import { getEquipments } from '../../data/equipments';
import { getInitialItems } from '../../data/Items';
import { getSkills } from '../../data/skills';
import { useCharacterStore } from '../../store/character';
import type { Equipment, Item, Rarity, Skill } from '../../types';

import CategoryTabs, { type CategoryType } from './components/CategoryTabs.vue';
import CustomItemForm from './components/CustomItemForm.vue';
import ItemList from './components/ItemList.vue';
import MoneyExchangeCard from './components/MoneyExchangeCard.vue';
import RarityFilter from './components/RarityFilter.vue';
import SelectedPanel from './components/SelectedPanel.vue';

const characterStore = useCharacterStore();

// 当前选中的大分类
const currentCategory = ref<CategoryType>('equipment');

// 当前选中的子分类
const currentSubCategory = ref<string>('');

// 当前选中的品质筛选
const currentRarity = ref<Rarity | 'all'>('all');

// 子分类名称映射
const categoryNameMap: Record<string, string> = {
  Money: '初始携带货币',
};

// 获取显示用的分类名称
const getCategoryDisplayName = (name: string): string => {
  return categoryNameMap[name] || name;
};

const equipments = computed(() => getEquipments());
const initialItems = computed(() => getInitialItems());
const skillGroups = computed(() => getSkills());

// 获取当前分类下的子分类列表
const subCategories = computed(() => {
  switch (currentCategory.value) {
    case 'equipment':
      return Object.keys(equipments.value);
    case 'item':
      return Object.keys(initialItems.value);
    case 'skill':
      return orderedSkillCategories.value;
    default:
      return [];
  }
});

// 检查技能分类是否可用（基于种族限制）
const isSkillCategoryAvailable = (category: string): boolean => {
  if (currentCategory.value !== 'skill') return true;

  const currentRace =
    characterStore.character.race === '自定义'
      ? characterStore.character.customRace
      : characterStore.character.race;

  const raceSpecificCategories = Object.keys(getRaceCosts.value).filter(race => race !== '自定义');

  if (raceSpecificCategories.includes(category)) {
    return currentRace === category;
  }

  return true;
};

const orderedSkillCategories = computed(() => {
  if (currentCategory.value !== 'skill') return [];

  const categories = Object.keys(skillGroups.value);
  const [available, unavailable] = _.partition(categories, isSkillCategoryAvailable);
  return [...available, ...unavailable];
});

// 当分类改变时，重置子分类和品质筛选
watch(currentCategory, () => {
  currentSubCategory.value = subCategories.value[0] || '';
  currentRarity.value = 'all';
});

// 初始化子分类
onMounted(() => {
  currentSubCategory.value = subCategories.value[0] || '';
});

// 监听种族变化，确保当前技能分类可用
watch(
  () => [characterStore.character.race, characterStore.character.customRace],
  () => {
    if (currentCategory.value !== 'skill') return;

    if (!isSkillCategoryAvailable(currentSubCategory.value)) {
      currentSubCategory.value = subCategories.value[0] || '';
    }
  },
  { deep: true },
);

// 获取当前要显示的物品列表（应用品质筛选）
const currentItems = computed<(Equipment | Item | Skill)[]>(() => {
  let sourceItems: (Equipment | Item | Skill)[] = [];

  switch (currentCategory.value) {
    case 'equipment':
      sourceItems = (equipments.value[currentSubCategory.value] || []) as Equipment[];
      break;
    case 'item':
      sourceItems = (initialItems.value[currentSubCategory.value] || []) as Item[];
      break;
    case 'skill':
      sourceItems = skillGroups.value[currentSubCategory.value] || [];
      break;
  }

  // 应用品质筛选
  if (currentRarity.value !== 'all') {
    return sourceItems.filter(item => item.rarity === currentRarity.value);
  }

  return sourceItems;
});

// 获取当前选中的物品列表
const currentSelectedItems = computed<(Equipment | Item | Skill)[]>(() => {
  switch (currentCategory.value) {
    case 'equipment':
      return characterStore.selectedEquipments;
    case 'item':
      return characterStore.selectedItems;
    case 'skill':
      return characterStore.selectedSkills;
    default:
      return [];
  }
});

// 选择物品
const handleSelectItem = (item: Equipment | Item | Skill) => {
  switch (currentCategory.value) {
    case 'equipment':
      characterStore.addEquipment(item as Equipment);
      break;
    case 'item':
      characterStore.addItem(item as Item);
      break;
    case 'skill':
      characterStore.addSkill(item as Skill);
      break;
  }
};

// 取消选择物品
const handleDeselectItem = (item: Equipment | Item | Skill) => {
  switch (currentCategory.value) {
    case 'equipment':
      characterStore.removeEquipment(item as Equipment);
      break;
    case 'item':
      characterStore.removeItem(item as Item);
      break;
    case 'skill':
      characterStore.removeSkill(item as Skill);
      break;
  }
};

// 从已选面板移除物品
const handleRemoveFromPanel = (
  item: Equipment | Item | Skill,
  type: 'equipment' | 'item' | 'skill',
) => {
  switch (type) {
    case 'equipment':
      characterStore.removeEquipment(item as Equipment);
      break;
    case 'item':
      characterStore.removeItem(item as Item);
      break;
    case 'skill':
      characterStore.removeSkill(item as Skill);
      break;
  }
};

// 清空所有选择
const handleClearAll = () => {
  characterStore.clearSelections();
};

// 添加自定义物品
const handleAddCustomItem = (
  item: Equipment | Item | Skill,
  type: 'equipment' | 'item' | 'skill',
) => {
  switch (type) {
    case 'equipment':
      characterStore.addEquipment(item as Equipment);
      break;
    case 'item':
      characterStore.addItem(item as Item);
      break;
    case 'skill':
      characterStore.addSkill(item as Skill);
      break;
  }
};
</script>

<template>
  <div class="selections">
    <div class="selections-container">
      <!-- 上半部分：选择区域 -->
      <div class="selection-area">
        <!-- 大分类标签 -->
        <CategoryTabs v-model="currentCategory" />

        <!-- 选择主体区域 - 使用通用布局组件 -->
        <CategorySelectionLayout
          v-model="currentSubCategory"
          :categories="subCategories"
          :category-name-formatter="getCategoryDisplayName"
        >
          <!-- 品质筛选 -->
          <template #filter>
            <RarityFilter v-model="currentRarity" />
          </template>

          <!-- 物品列表 -->
          <template #content>
            <ItemList
              :items="currentItems"
              :selected-items="currentSelectedItems"
              @select="handleSelectItem"
              @deselect="handleDeselectItem"
            />
          </template>
        </CategorySelectionLayout>
      </div>

      <!-- 自定义物品区域 -->
      <div class="custom-area">
        <MoneyExchangeCard />
        <CustomItemForm @add="handleAddCustomItem" />
      </div>

      <!-- 下半部分：已选面板 -->
      <div class="summary-area">
        <SelectedPanel
          :equipments="characterStore.selectedEquipments"
          :items="characterStore.selectedItems"
          :skills="characterStore.selectedSkills"
          @remove="handleRemoveFromPanel"
          @clear="handleClearAll"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.selections-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  max-width: 1600px;
  margin: 0 auto;
}

// 上半部分：选择区域
.selection-area {
  display: flex;
  flex-direction: column;
}

.custom-area {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

// 下半部分：已选面板
.summary-area {
  height: 600px;
  min-height: 300px;
}

// 响应式设计
@media (max-width: 768px) {
  .selections-container {
    gap: var(--spacing-md);
  }

  .summary-area {
    height: auto;
    max-height: none;
  }
}
</style>
