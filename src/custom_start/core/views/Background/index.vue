<script setup lang="ts">
import { computed, inject, onMounted, ref, watch, type Ref } from 'vue';
import { getBackgrounds } from '../../data/backgrounds';
import { getAllDestinedOnes } from '../../data/destined-ones';
import { useCharacterStore } from '../../store/character';
import { useCustomContentStore } from '../../store/customContent';
import type { Background, DestinedOne } from '../../types';
import BackgroundCategoryNav from './components/BackgroundCategoryNav.vue';
import BackgroundList from './components/BackgroundList.vue';
import CustomDestinedOneForm from './components/CustomDestinedOneForm.vue';
import DestinedOneList from './components/DestinedOneList.vue';
import DestinyPointsExchange from './components/DestinyPointsExchange.vue';
import LevelTabs from './components/LevelTabs.vue';

const characterStore = useCharacterStore();
const customContentStore = useCustomContentStore();

// 接收 layout 提供的触发器
const randomGenerateTrigger = inject<Ref<number>>('randomGenerateTrigger', ref(0));
const resetPageTrigger = inject<Ref<number>>('resetPageTrigger', ref(0));

// 命定之人相关状态
const currentLevel = ref<string>('');

// 初始剧情相关状态
const currentBackgroundCategory = ref<string>('');

// 提取分类和层级为计算属性，遵循 DRY 原则
const destinedOneLevels = computed(() => Object.keys(getAllDestinedOnes()));
const backgroundCategories = computed(() => Object.keys(getBackgrounds()));

// 获取当前层级的命定之人列表
const currentDestinedOnes = computed<DestinedOne[]>(() => {
  if (!currentLevel.value) return [];
  return getAllDestinedOnes()[currentLevel.value] || [];
});

// 获取当前分类的背景列表
const currentBackgrounds = computed<Background[]>(() => {
  if (!currentBackgroundCategory.value) return [];
  return getBackgrounds()[currentBackgroundCategory.value] || [];
});

// 计算可用点数
const availablePoints = computed(() => {
  return characterStore.character.reincarnationPoints - characterStore.consumedPoints;
});

// 命定之人操作
const handleSelectDestinedOne = (destinedOne: DestinedOne) => {
  characterStore.addDestinedOne(destinedOne);
};

const handleDeselectDestinedOne = (destinedOne: DestinedOne) => {
  characterStore.removeDestinedOne(destinedOne);
};

const handleAddCustomDestinedOne = (destinedOne: DestinedOne) => {
  characterStore.addDestinedOne(destinedOne);
};

// 背景操作
const handleSelectBackground = (background: Background) => {
  characterStore.setBackground(background);
};

// 更新自定义开局描述
const handleUpdateCustomDescription = (value: string) => {
  customContentStore.updateCustomBackgroundDescription(value);
};

// 命运点数兑换
const handleExchangeDestinyPoints = (reincarnationPoints: number) => {
  characterStore.exchangeDestinyPoints(reincarnationPoints);
};

// 随机生成
const handleRandomGenerate = () => {
  // 随机选择一个命定之人
  if (currentDestinedOnes.value.length > 0) {
    const randomIndex = Math.floor(Math.random() * currentDestinedOnes.value.length);
    const randomDestinedOne = currentDestinedOnes.value[randomIndex];

    if (availablePoints.value >= randomDestinedOne.cost) {
      // 清空已选命定之人
      characterStore.selectedDestinedOnes.splice(0);
      characterStore.addDestinedOne(randomDestinedOne);
    }
  }

  // 随机选择一个背景（排除自定义开局）
  if (currentBackgrounds.value.length > 0) {
    // 过滤掉【自定义开局】
    const validBackgrounds = currentBackgrounds.value.filter(bg => bg.name !== '【自定义开局】');

    if (validBackgrounds.length > 0) {
      const randomIndex = Math.floor(Math.random() * validBackgrounds.length);
      const randomBackground = validBackgrounds[randomIndex];
      characterStore.setBackground(randomBackground);
    }
  }
};

// 重置页面
const handleReset = () => {
  characterStore.selectedDestinedOnes.splice(0);
  characterStore.setBackground(null);
  customContentStore.updateCustomBackgroundDescription('');

  // 重置命运点数和已兑换的转生点数
  characterStore.setDestinyPoints(0);
  characterStore.resetExchangedPoints();

  // 重置到第一个分类
  if (destinedOneLevels.value.length > 0) {
    currentLevel.value = destinedOneLevels.value[0];
  }

  if (backgroundCategories.value.length > 0) {
    currentBackgroundCategory.value = backgroundCategories.value[0];
  }
};

// 清空所有选择
const handleClearAll = () => {
  characterStore.selectedDestinedOnes.splice(0);
  characterStore.setBackground(null);
  customContentStore.updateCustomBackgroundDescription('');
};

// 监听随机生成触发器
watch(randomGenerateTrigger, () => {
  handleRandomGenerate();
});

// 监听重置触发器
watch(resetPageTrigger, () => {
  handleReset();
});

// 初始化
onMounted(() => {
  // 初始化命定之人层级
  if (destinedOneLevels.value.length > 0) {
    currentLevel.value = destinedOneLevels.value[0];
  }

  // 初始化背景分类
  if (backgroundCategories.value.length > 0) {
    currentBackgroundCategory.value = backgroundCategories.value[0];
  }
});
</script>

<template>
  <div class="background-page">
    <!-- 命定之人区域 -->
    <section class="destined-ones-section">
      <h2 class="section-title">选择命定之人</h2>

      <!-- 层级导航 -->
      <LevelTabs v-model="currentLevel" :levels="destinedOneLevels" />

      <!-- 命定之人列表 -->
      <div class="destined-ones-content">
        <DestinedOneList
          :items="currentDestinedOnes"
          :selected-items="characterStore.selectedDestinedOnes"
          :available-points="availablePoints"
          @select="handleSelectDestinedOne"
          @deselect="handleDeselectDestinedOne"
        />
      </div>
    </section>

    <!-- 自定义命定之人表单 -->
    <CustomDestinedOneForm @add="handleAddCustomDestinedOne" />

    <!-- 命运点数兑换 -->
    <DestinyPointsExchange
      :available-points="availablePoints"
      :current-destiny-points="characterStore.character.destinyPoints"
      @exchange="handleExchangeDestinyPoints"
    />

    <!-- 初始剧情区域 -->
    <section class="background-section">
      <h2 class="section-title">选择初始开局剧情</h2>

      <div class="background-container">
        <!-- 左侧：分类导航 -->
        <div class="background-sidebar">
          <BackgroundCategoryNav
            v-model="currentBackgroundCategory"
            :categories="backgroundCategories"
          />
        </div>

        <!-- 右侧：背景列表 -->
        <div class="background-content">
          <BackgroundList
            :items="currentBackgrounds"
            :selected-item="characterStore.selectedBackground"
            :character-race="characterStore.character.race"
            :character-location="characterStore.character.startLocation"
            :character-identity="characterStore.character.identity"
            @select="handleSelectBackground"
            @update:custom-description="handleUpdateCustomDescription"
          />
        </div>
      </div>
    </section>

    <!-- 已选信息面板 -->
    <section class="summary-section">
      <div class="summary-card">
        <div class="summary-header">
          <div class="summary-title-row">
            <h3 class="summary-title">已选择</h3>
            <div class="points-info">
              <span class="points-value" :class="{ insufficient: availablePoints < 0 }">{{
                availablePoints
              }}</span>
              <span class="points-separator">/</span>
              <span class="points-total">{{ characterStore.character.reincarnationPoints }}</span>
            </div>
          </div>
          <button
            v-if="
              characterStore.selectedDestinedOnes.length > 0 || characterStore.selectedBackground
            "
            class="clear-btn"
            @click="handleClearAll"
          >
            清空选择
          </button>
        </div>

        <div class="summary-content">
          <!-- 命定之人摘要 -->
          <div v-if="characterStore.selectedDestinedOnes.length > 0" class="summary-group">
            <div class="summary-label">
              命定之人 ({{ characterStore.selectedDestinedOnes.length }})
            </div>
            <div class="summary-items">
              <div
                v-for="one in characterStore.selectedDestinedOnes"
                :key="one.name"
                class="summary-item"
              >
                <span class="item-name">{{ one.name }}</span>
                <span class="item-cost">{{ one.cost }} 点</span>
                <button class="remove-btn" @click="handleDeselectDestinedOne(one)">
                  <i class="fas fa-xmark"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- 背景摘要 -->
          <div v-if="characterStore.selectedBackground" class="summary-group">
            <div class="summary-label">初始开局剧情</div>
            <div class="summary-items">
              <div class="summary-item full">
                <span class="item-name">{{ characterStore.selectedBackground.name }}</span>
              </div>
            </div>
          </div>

          <!-- 空状态提示 -->
          <div
            v-if="
              characterStore.selectedDestinedOnes.length === 0 && !characterStore.selectedBackground
            "
            class="empty-state"
          >
            尚未选择任何内容
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.background-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  max-width: 1600px;
  margin: 0 auto;
  padding: var(--spacing-md);
}

.section-title {
  font-size: 1.5rem;
  color: var(--title-color);
  margin: 0 0 var(--spacing-md) 0;
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--border-color);
}

// 命定之人区域
.destined-ones-section {
  display: flex;
  flex-direction: column;

  .section-title {
    margin-bottom: 0;
  }
}

.destined-ones-content {
  max-height: 600px;
  overflow-y: auto;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--input-bg);

  &::-webkit-scrollbar {
    width: 10px;
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

// 初始剧情区域
.background-section {
  display: flex;
  flex-direction: column;
}

.background-container {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 0;
  height: 500px;
  max-height: 500px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.background-sidebar {
  background: var(--card-bg);
  border-right: 2px solid var(--border-color-strong);
  height: 100%;
  overflow: hidden;
}

.background-content {
  background: var(--input-bg);
  height: 100%;
  overflow: hidden;
}

// 已选信息面板
.summary-section {
  position: sticky;
  bottom: 0;
}

.summary-card {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
}

.summary-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.summary-title {
  font-size: 1.2rem;
  color: var(--title-color);
  margin: 0;
}

.points-info {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  font-size: 1rem;
  font-weight: 600;

  .points-value {
    color: var(--accent-color);
    font-size: 1.2rem;

    &.insufficient {
      color: var(--error-color);
    }
  }

  .points-separator {
    color: var(--text-light);
    font-size: 1rem;
  }

  .points-total {
    color: var(--text-light);
    font-size: 1rem;
  }
}

.clear-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--error-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all var(--transition-fast);

  &:hover {
    background: #b71c1c;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.summary-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.summary-label {
  font-weight: 600;
  color: var(--title-color);
  font-size: 0.95rem;
}

.summary-items {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.85rem;

  &.full {
    flex: 1 1 100%;
  }

  .item-name {
    color: var(--text-color);
  }

  .item-cost {
    color: var(--accent-color);
    font-weight: 600;
  }

  .remove-btn {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--error-color);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 0.65rem;
    margin-left: auto;

    &:hover {
      background: #b71c1c;
    }
  }
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-light);
  font-size: 0.95rem;
}

// 响应式设计
@media (max-width: 768px) {
  .background-page {
    gap: var(--spacing-md);
    padding: var(--spacing-sm);
  }

  .section-title {
    font-size: 1.3rem;
  }

  .destined-ones-content {
    max-height: 500px;
  }

  .background-container {
    grid-template-columns: 120px 1fr;
    height: 450px;
  }

  .summary-section {
    position: static;
  }

  .summary-items {
    flex-direction: column;
  }

  .summary-item {
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .background-container {
    grid-template-columns: 100px 1fr;
    height: 400px;
  }

  .section-title {
    font-size: 1.1rem;
  }

  .summary-header {
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .summary-title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
    flex: 1 1 100%;
  }

  .clear-btn {
    width: 100%;
  }
}
</style>
