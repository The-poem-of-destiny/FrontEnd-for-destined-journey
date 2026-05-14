<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, computed, watch } from 'vue';

import CategorySelectionLayout from '../../components/CategorySelectionLayout.vue';
import { getRaceCosts } from '../../data/base-info';
import { getEquipments } from '../../data/equipments';
import { getInitialItems } from '../../data/Items';
import { getSkills } from '../../data/skills';
import { useCharacterStore } from '../../store/character';
import { useCustomContentStore } from '../../store/customContent';
import type { Equipment, Item, Rarity, Skill } from '../../types';
import {
  createLibraryEntries,
  getLibraryUpdateEventName,
  upsertLibraryEntries,
} from '../../utils/custom-library';

import CategoryTabs, { type CategoryType } from './components/CategoryTabs.vue';
import CustomItemForm from './components/CustomItemForm.vue';
import ItemList from './components/ItemList.vue';
import MoneyExchangeCard from './components/MoneyExchangeCard.vue';
import RarityFilter from './components/RarityFilter.vue';
import SelectedPanel from './components/SelectedPanel.vue';

const characterStore = useCharacterStore();
const customContentStore = useCustomContentStore();
const customItemFormRef = ref<InstanceType<typeof CustomItemForm> | null>(null);
type UtilityPanel = 'none' | 'money' | 'custom' | 'selected';

// 当前选中的大分类
const currentCategory = ref<CategoryType>('equipment');

// 当前选中的子分类
const currentSubCategory = ref<string>('');

// 当前选中的品质筛选
const currentRarity = ref<Rarity | 'all'>('all');

const activeUtilityPanel = ref<UtilityPanel>('none');
const isMobileViewport = ref(false);
const libraryRevision = ref(0);
let mobileMediaQuery: MediaQueryList | null = null;

const selectedTotalCount = computed(
  () =>
    characterStore.selectedEquipments.length +
    characterStore.selectedItems.length +
    characterStore.selectedSkills.length,
);

const mobilePanelTitle = computed(() => {
  switch (activeUtilityPanel.value) {
    case 'money':
      return '金钱兑换';
    case 'custom':
      return '自定义';
    case 'selected':
      return '已选项目';
    default:
      return '';
  }
});

const toggleUtilityPanel = (panel: UtilityPanel) => {
  activeUtilityPanel.value = activeUtilityPanel.value === panel ? 'none' : panel;
};

const closeUtilityPanel = () => {
  activeUtilityPanel.value = 'none';
};

const trackLibraryRevision = () => libraryRevision.value;

const updateMobileViewport = () => {
  isMobileViewport.value = Boolean(mobileMediaQuery?.matches);

  if (!isMobileViewport.value) {
    activeUtilityPanel.value = 'none';
  }
};

// 获取显示用的分类名称
const getCategoryDisplayName = (name: string): string => {
  return name;
};

const equipments = computed(() => {
  trackLibraryRevision();
  return getEquipments();
});
const initialItems = computed(() => {
  trackLibraryRevision();
  return getInitialItems();
});
const skillGroups = computed(() => {
  trackLibraryRevision();
  return getSkills();
});

const refreshLibraryData = () => {
  libraryRevision.value += 1;
};

const currentRace = computed(() => {
  return characterStore.character.race === '自定义'
    ? characterStore.character.customRace
    : characterStore.character.race;
});

const raceSpecificSkillCategories = computed(() => {
  return Object.keys(getRaceCosts.value).filter(race => race !== '自定义');
});

const getDisabledSkillCategories = () => {
  if (currentCategory.value !== 'skill') return [];

  return raceSpecificSkillCategories.value.filter(category => category !== currentRace.value);
};

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

  if (raceSpecificSkillCategories.value.includes(category)) {
    return currentRace.value === category;
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

  mobileMediaQuery = window.matchMedia('(max-width: 768px)');
  updateMobileViewport();
  mobileMediaQuery.addEventListener('change', updateMobileViewport);
  window.addEventListener(getLibraryUpdateEventName(), refreshLibraryData);
});

watch(
  subCategories,
  categories => {
    if (!categories.includes(currentSubCategory.value)) {
      currentSubCategory.value = categories[0] || '';
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  mobileMediaQuery?.removeEventListener('change', updateMobileViewport);
  window.removeEventListener(getLibraryUpdateEventName(), refreshLibraryData);
});

// 监听种族变化，确保当前技能分类可用
watch(
  () => [characterStore.character.race, characterStore.character.customRace],
  () => {
    if (currentCategory.value !== 'skill') return;

    if (!isSkillCategoryAvailable(currentSubCategory.value)) {
      const nextCategory = _.find(subCategories.value, isSkillCategoryAvailable) || '';
      currentSubCategory.value = nextCategory;
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

// 添加/更新自定义物品
const handleAddCustomItem = (
  item: Equipment | Item | Skill,
  type: 'equipment' | 'item' | 'skill',
  replaceName?: string,
) => {
  const targetName = replaceName?.trim();

  switch (type) {
    case 'equipment':
      if (targetName) {
        characterStore.replaceEquipmentByName(item as Equipment, targetName);
      } else {
        characterStore.addEquipment(item as Equipment);
      }
      break;
    case 'item':
      if (targetName) {
        characterStore.replaceItemByName(item as Item, targetName);
      } else {
        characterStore.addItem(item as Item);
      }
      break;
    case 'skill':
      if (targetName) {
        characterStore.replaceSkillByName(item as Skill, targetName);
      } else {
        characterStore.addSkill(item as Skill);
      }
      break;
  }

  upsertLibraryEntries(createLibraryEntries([{ type, item }]), {
    deleteIds: targetName && targetName !== item.name ? [`${type}:${targetName}`] : [],
  });
  refreshLibraryData();
  customContentStore.updateEditingCustomItemName('');
};

// 回填自定义物品表单
const handleEditCustomItem = (
  item: Equipment | Item | Skill,
  type: 'equipment' | 'item' | 'skill',
) => {
  const fillForm = () => {
    customItemFormRef.value?.fillFormByItem(item, type);
    toastr.info(
      `已回填自定义${type === 'equipment' ? '装备' : type === 'item' ? '道具' : '技能'}「${item.name}」`,
    );
  };

  if (isMobileViewport.value) {
    activeUtilityPanel.value = 'custom';
    nextTick(fillForm);
    return;
  }

  fillForm();
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
          :disabled-categories="getDisabledSkillCategories()"
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

      <div v-if="!isMobileViewport" class="custom-area">
        <MoneyExchangeCard />
        <CustomItemForm ref="customItemFormRef" @add="handleAddCustomItem" />
      </div>

      <div v-if="!isMobileViewport" class="summary-area">
        <SelectedPanel
          :equipments="characterStore.selectedEquipments"
          :items="characterStore.selectedItems"
          :skills="characterStore.selectedSkills"
          @remove="handleRemoveFromPanel"
          @edit-custom="handleEditCustomItem"
          @clear="handleClearAll"
          @library-updated="refreshLibraryData"
        />
      </div>

      <div v-if="isMobileViewport" class="mobile-utility-dock">
        <button
          class="dock-button"
          :class="{ active: activeUtilityPanel === 'money' }"
          @click="toggleUtilityPanel('money')"
        >
          <i class="fa-solid fa-coins" aria-hidden="true"></i>
          <span>金钱</span>
          <strong>{{ characterStore.character.money }}G</strong>
        </button>
        <button
          class="dock-button"
          :class="{ active: activeUtilityPanel === 'custom' }"
          @click="toggleUtilityPanel('custom')"
        >
          <i class="fa-solid fa-sparkles" aria-hidden="true"></i>
          <span>自定义</span>
        </button>
        <button
          class="dock-button"
          :class="{ active: activeUtilityPanel === 'selected' }"
          @click="toggleUtilityPanel('selected')"
        >
          <i class="fa-solid fa-list-check" aria-hidden="true"></i>
          <span>已选</span>
          <strong>{{ selectedTotalCount }}</strong>
        </button>
      </div>

      <div v-if="isMobileViewport && activeUtilityPanel !== 'none'" class="mobile-utility-sheet">
        <div class="sheet-header">
          <h3>{{ mobilePanelTitle }}</h3>
          <button class="sheet-close" aria-label="关闭面板" @click="closeUtilityPanel">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
        <div class="sheet-body">
          <MoneyExchangeCard
            v-if="activeUtilityPanel === 'money'"
            default-expanded
            force-expanded
          />
          <CustomItemForm
            v-if="activeUtilityPanel === 'custom'"
            ref="customItemFormRef"
            default-expanded
            hide-header
            @add="handleAddCustomItem"
          />
          <SelectedPanel
            v-if="activeUtilityPanel === 'selected'"
            :equipments="characterStore.selectedEquipments"
            :items="characterStore.selectedItems"
            :skills="characterStore.selectedSkills"
            @remove="handleRemoveFromPanel"
            @edit-custom="handleEditCustomItem"
            @clear="handleClearAll"
            @library-updated="refreshLibraryData"
          />
        </div>
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
  .selections {
    height: 100%;
    min-height: 0;
  }

  .selections-container {
    position: relative;
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    height: 100%;
    min-height: 0;
    gap: var(--spacing-xs);
    overflow: hidden;
  }

  .selection-area {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;

    :deep(.category-tabs) {
      flex: none;
      min-width: 0;
      max-width: 100%;
    }

    :deep(.category-selection-layout) {
      flex: 1 1 0;
      height: auto;
      max-height: none;
      min-height: 0;
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
    }

    :deep(.category-selection-layout .content-area) {
      flex: 1 1 0;
      min-height: 0;
      overflow: hidden;
    }

    :deep(.category-selection-layout .content-main) {
      flex: 1 1 0;
      min-height: 0;
      overflow-x: hidden;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
      touch-action: pan-y;
    }
  }

  .mobile-utility-dock {
    min-width: 0;
    max-width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--spacing-xs);
    padding-top: var(--spacing-xs);
    border-top: 1px solid var(--border-color);
  }

  .dock-button {
    min-width: 0;
    min-height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 6px 4px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--input-bg);
    color: var(--title-color);
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;

    i {
      color: var(--accent-color);
    }

    span,
    strong {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    strong {
      color: var(--accent-color);
      font-family: var(--font-mono);
      font-size: 0.76rem;
    }

    &.active {
      background: var(--accent-color);
      border-color: var(--accent-color);
      color: var(--primary-bg);

      i,
      strong {
        color: currentColor;
      }
    }
  }

  .mobile-utility-sheet {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 50px;
    z-index: 30;
    max-height: calc(100% - 58px);
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--card-bg);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }

  .sheet-header {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
    background: var(--input-bg);

    h3 {
      margin: 0;
      font-size: 0.95rem;
      font-family: var(--font-body);
      letter-spacing: 0;
    }
  }

  .sheet-close {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    background: var(--card-bg);
    color: var(--title-color);
    cursor: pointer;
  }

  .sheet-body {
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    touch-action: pan-y;
    padding: var(--spacing-xs);
  }
}
</style>
