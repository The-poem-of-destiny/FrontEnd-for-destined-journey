<script setup lang="ts">
import { computed, inject, onMounted, ref, watch, type Ref } from 'vue';
import { getRaceCosts } from '../../data/base-info';
import { getEquipments } from '../../data/equipments';
import { getInitialItems } from '../../data/Items';
import { getActiveSkills, getPassiveSkills } from '../../data/skills';
import { useCharacterStore } from '../../store/character';
import type { Equipment, Item, Rarity, Skill } from '../../types';
import CategoryTabs, { type CategoryType } from './components/CategoryTabs.vue';
import CustomItemForm from './components/CustomItemForm.vue';
import ItemList from './components/ItemList.vue';
import RarityFilter from './components/RarityFilter.vue';
import SelectedPanel from './components/SelectedPanel.vue';

const characterStore = useCharacterStore();

// 接收 layout 提供的触发器
const randomGenerateTrigger = inject<Ref<number>>('randomGenerateTrigger', ref(0));
const resetPageTrigger = inject<Ref<number>>('resetPageTrigger', ref(0));

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
const activeSkills = computed(() => getActiveSkills());
const passiveSkills = computed(() => getPassiveSkills());

// 获取当前分类下的子分类列表
const subCategories = computed(() => {
  switch (currentCategory.value) {
    case 'equipment':
      return Object.keys(equipments.value);
    case 'item':
      return Object.keys(initialItems.value);
    case 'skill':
      return ['主动技能', '被动技能'];
    default:
      return [];
  }
});

// 检查技能子分类是否可用（基于种族限制）
const isSkillSubCategoryAvailable = (subCategory: string): boolean => {
  // 获取当前角色的种族
  const currentRace =
    characterStore.character.race === '自定义' ? characterStore.character.customRace : characterStore.character.race;

  // 获取所有种族列表
  const raceSpecificCategories = Object.keys(getRaceCosts.value).filter(race => race !== '自定义');

  if (raceSpecificCategories.includes(subCategory)) {
    return currentRace === subCategory;
  }

  // 其他分类默认可用
  return true;
};

// 获取技能的子分类（战技、法术、祷告、其它），并将被禁用的分类排到底部
const skillSubCategories = computed(() => {
  if (currentCategory.value !== 'skill') return [];

  let categories: string[] = [];
  if (currentSubCategory.value === '主动技能') {
    categories = Object.keys(activeSkills.value);
  } else if (currentSubCategory.value === '被动技能') {
    categories = Object.keys(passiveSkills.value);
  }

  // 将分类分为可用和不可用两组
  const available: string[] = [];
  const unavailable: string[] = [];

  categories.forEach(cat => {
    if (isSkillSubCategoryAvailable(cat)) {
      available.push(cat);
    } else {
      unavailable.push(cat);
    }
  });

  // 可用的在前，不可用的在后
  return [...available, ...unavailable];
});

// 当前选中的技能子分类
const currentSkillSubCategory = ref<string>('');

// 当技能子分类改变时，初始化第一个可用的子分类
watch([currentCategory, currentSubCategory], () => {
  if (currentCategory.value === 'skill' && currentSubCategory.value) {
    // 找到第一个可用的子分类
    const firstAvailable = skillSubCategories.value.find(cat => isSkillSubCategoryAvailable(cat));
    currentSkillSubCategory.value = firstAvailable || '';
  }
});

// 监听种族变化
watch(
  () => [characterStore.character.race, characterStore.character.customRace],
  () => {
    // 如果当前选中的技能子分类不可用，切换到第一个可用的
    if (currentCategory.value === 'skill' && currentSkillSubCategory.value) {
      if (!isSkillSubCategoryAvailable(currentSkillSubCategory.value)) {
        const firstAvailable = skillSubCategories.value.find(cat => isSkillSubCategoryAvailable(cat));
        currentSkillSubCategory.value = firstAvailable || '';
      }
    }
  },
  { deep: true },
);

// 当分类改变时，重置子分类和品质筛选
watch(currentCategory, () => {
  currentSubCategory.value = subCategories.value[0] || '';
  currentRarity.value = 'all';
});

// 初始化子分类
onMounted(() => {
  currentSubCategory.value = subCategories.value[0] || '';
});

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
      if (currentSubCategory.value === '主动技能') {
        sourceItems = currentSkillSubCategory.value
          ? activeSkills.value[currentSkillSubCategory.value] || []
          : Object.values(activeSkills.value).flat();
      } else if (currentSubCategory.value === '被动技能') {
        sourceItems = currentSkillSubCategory.value
          ? passiveSkills.value[currentSkillSubCategory.value] || []
          : Object.values(passiveSkills.value).flat();
      }
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

// 计算可用点数
const availablePoints = computed(() => {
  return characterStore.character.reincarnationPoints - characterStore.consumedPoints;
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
const handleRemoveFromPanel = (item: Equipment | Item | Skill, type: 'equipment' | 'item' | 'skill') => {
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

// 随机选择当前分类的物品
const handleRandomGenerate = () => {
  // 清空当前分类的选择
  switch (currentCategory.value) {
    case 'equipment':
      characterStore.selectedEquipments.splice(0);
      break;
    case 'item':
      characterStore.selectedItems.splice(0);
      break;
    case 'skill':
      characterStore.selectedSkills.splice(0);
      break;
  }

  // 从当前物品列表中随机选择几个物品
  const items = currentItems.value;
  if (items.length === 0) return;

  // 随机选择 1-3 个物品
  const count = Math.min(Math.floor(Math.random() * 3) + 1, items.length);
  const selectedIndices = new Set<number>();

  while (selectedIndices.size < count) {
    const randomIndex = Math.floor(Math.random() * items.length);
    if (!selectedIndices.has(randomIndex)) {
      selectedIndices.add(randomIndex);
      const item = items[randomIndex];

      // 检查是否有足够的点数
      if (item.cost <= availablePoints.value) {
        handleSelectItem(item);
      }
    }
  }
};

// 重置当前页面
const handleReset = () => {
  characterStore.clearSelections();
  currentCategory.value = 'equipment';
  currentSubCategory.value = subCategories.value[0] || '';
  currentSkillSubCategory.value = '';
  currentRarity.value = 'all';
};

// 监听随机生成触发器
watch(randomGenerateTrigger, () => {
  handleRandomGenerate();
});

// 监听重置触发器
watch(resetPageTrigger, () => {
  handleReset();
});

// 添加自定义物品
const handleAddCustomItem = (item: Equipment | Item | Skill, type: 'equipment' | 'item' | 'skill') => {
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

        <!-- 选择主体区域：左侧导航 + 右侧列表 -->
        <div class="selection-main">
          <!-- 左侧：子分类导航 -->
          <div class="category-sidebar">
            <div class="category-list">
              <template v-for="category in subCategories" :key="category">
                <button
                  class="category-item"
                  :class="{ active: currentSubCategory === category }"
                  @click="currentSubCategory = category"
                >
                  {{ getCategoryDisplayName(category) }}
                </button>

                <!-- 技能的二级分类 -->
                <div
                  v-if="currentCategory === 'skill' && currentSubCategory === category && skillSubCategories.length > 0"
                  class="sub-category-list"
                >
                  <button
                    v-for="subCat in skillSubCategories"
                    :key="subCat"
                    class="sub-category-item"
                    :class="{
                      active: currentSkillSubCategory === subCat,
                      disabled: !isSkillSubCategoryAvailable(subCat),
                    }"
                    :disabled="!isSkillSubCategoryAvailable(subCat)"
                    @click="isSkillSubCategoryAvailable(subCat) && (currentSkillSubCategory = subCat)"
                  >
                    {{ subCat }}
                  </button>
                </div>
              </template>
            </div>
          </div>

          <!-- 右侧：物品列表 -->
          <div class="items-content">
            <!-- 品质筛选 -->
            <RarityFilter v-model="currentRarity" />

            <!-- 物品列表 -->
            <ItemList
              :items="currentItems"
              :selected-items="currentSelectedItems"
              :available-points="availablePoints"
              @select="handleSelectItem"
              @deselect="handleDeselectItem"
            />
          </div>
        </div>
      </div>

      <!-- 自定义物品区域 -->
      <div class="custom-area">
        <CustomItemForm @add="handleAddCustomItem" />
      </div>

      <!-- 下半部分：已选面板 -->
      <div class="summary-area">
        <SelectedPanel
          :equipments="characterStore.selectedEquipments"
          :items="characterStore.selectedItems"
          :skills="characterStore.selectedSkills"
          :available-points="availablePoints"
          :total-points="characterStore.character.reincarnationPoints"
          :consumed-points="characterStore.consumedPoints"
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

.selection-main {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 0;
  height: 500px;
  max-height: 500px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

// 左侧分类导航
.category-sidebar {
  background: var(--card-bg);
  border-right: 2px solid var(--border-color-strong);
  padding: var(--spacing-md);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .category-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    overflow-y: auto;
    flex: 1;
    padding-right: var(--spacing-xs);

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: var(--input-bg);
      border-radius: var(--radius-sm);
    }

    &::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: var(--radius-sm);

      &:hover {
        background: var(--border-color-strong);
      }
    }
  }

  .category-item {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: 0.9rem;
    color: var(--text-color);
    text-align: left;
    white-space: normal;
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
    line-height: 1.4;
    min-height: 32px;
    display: flex;
    align-items: center;

    &:hover {
      border-color: var(--accent-color);
      background: rgba(212, 175, 55, 0.1);
    }

    &.active {
      background: var(--accent-color);
      border-color: var(--accent-color);
      color: var(--primary-bg);
      font-weight: 600;
    }
  }

  // 二级分类
  .sub-category-list {
    margin-left: var(--spacing-md);
    margin-top: var(--spacing-xs);
    margin-bottom: var(--spacing-xs);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .sub-category-item {
    padding: 4px var(--spacing-sm);
    background: var(--card-bg);
    border: 1px solid var(--border-color-light);
    border-left: 3px solid var(--border-color);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: 0.85rem;
    color: var(--text-light);
    text-align: left;
    white-space: normal;
    word-wrap: break-word;
    word-break: break-word;
    line-height: 1.3;

    &:hover:not(.disabled) {
      border-left-color: var(--accent-color);
      background: rgba(212, 175, 55, 0.05);
      color: var(--text-color);
    }

    &.active {
      background: rgba(212, 175, 55, 0.15);
      border-left-color: var(--accent-color);
      color: var(--accent-color);
      font-weight: 600;
    }

    &.disabled {
      opacity: 0.4;
      cursor: not-allowed;
      background: var(--input-bg);
      color: var(--text-light);
      border-left-color: var(--border-color-light);

      &:hover {
        background: var(--input-bg);
        border-left-color: var(--border-color-light);
      }
    }
  }
}

// 右侧物品内容区
.items-content {
  background: var(--card-bg);
  overflow-y: auto;
  height: 100%;
  display: flex;
  flex-direction: column;

  // 品质筛选栏固定在顶部
  :deep(.rarity-filter) {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--card-bg);
    padding: var(--spacing-md) var(--spacing-md) var(--spacing-sm) var(--spacing-md);
    padding-bottom: var(--spacing-sm);
    border-bottom: 2px solid var(--border-color);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  // 物品列表区域
  :deep(.item-list) {
    flex: 1;
  }

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: var(--input-bg);
    border-radius: var(--radius-md);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: var(--radius-md);

    &:hover {
      background: var(--border-color-strong);
    }
  }
}

// 下半部分：已选面板
.summary-area {
  max-height: 500px;
}

// 响应式设计
@media (max-width: 768px) {
  .selections-container {
    gap: var(--spacing-md);
  }

  .selection-main {
    grid-template-columns: 100px 1fr;
    height: 450px;
  }

  .category-sidebar {
    padding: var(--spacing-xs) 4px;

    .category-item {
      font-size: 0.75rem;
      padding: 4px 6px;
      min-height: 28px;
      line-height: 1.3;
    }
  }

  .summary-area {
    height: auto;
    max-height: none;
  }
}

// 超小屏幕额外优化
@media (max-width: 480px) {
  .selection-main {
    grid-template-columns: 85px 1fr;
    height: 400px;
  }

  .category-sidebar {
    padding: var(--spacing-xs) 3px;

    .category-item {
      font-size: 0.7rem;
      padding: 3px 5px;
      min-height: 24px;
    }
  }
}
</style>
