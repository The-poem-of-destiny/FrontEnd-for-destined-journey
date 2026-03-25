<template>
  <div class="core-page">
    <h2 class="main-title">核心选择</h2>

    <div class="control-panel-container">
      <!-- Tab 导航 -->
      <div class="tab-navigation">
        <button
          v-if="showArrows"
          class="arrow-button"
          :disabled="tabStartIndex === 0"
          title="上一页"
          @click="handlePrevTabs"
        >
          <span>‹</span>
        </button>
        <div class="tab-buttons-container">
          <button
            v-for="tab in visibleTabs"
            :key="tab"
            class="tab-button"
            :class="{ active: activeTab === tab }"
            @click="activeTab = tab"
          >
            <span class="tab-label">{{ tab }}</span>
            <span class="tab-count">({{ getCoresForTab(tab).length }})</span>
          </button>
        </div>
        <button
          v-if="showArrows"
          class="arrow-button"
          :disabled="tabStartIndex + maxVisibleTabs >= tabs.length"
          title="下一页"
          @click="handleNextTabs"
        >
          <span>›</span>
        </button>
        <button
          class="refresh-button"
          :disabled="isLoading"
          title="刷新核心列表"
          @click="handleRefresh"
        >
          <span :class="{ 'is-spinning': isLoading }">⟳</span>
        </button>
      </div>

      <div class="tab-content">
        <div class="control-group">
          <div v-if="isLoading" class="loading-text">正在加载核心列表...</div>
          <div v-else-if="coreOptions.length === 0" class="empty-text">未找到可用的核心</div>

          <div v-else class="list-detail-layout">
            <div class="item-list">
              <button
                v-for="core in getCoresForTab(activeTab)"
                :key="core.value"
                class="list-item"
                :class="{
                  'toggled-on': localCoreSelections.get(core.value),
                  selected: selectedCoreKey === core.value,
                }"
                @click="selectedCoreKey = core.value"
              >
                {{ core.label }}
              </button>
            </div>
            <div class="item-detail">
              <template v-if="selectedCoreKey && selectedCoreInfo">
                <h3 class="detail-name">{{ selectedCoreInfo.label }}</h3>
                <div class="detail-row">
                  <span class="detail-label">作者:</span>
                  <span class="detail-value">{{ selectedCoreInfo.author || '未知' }}</span>
                </div>
                <div v-if="selectedCoreInfo.note" class="detail-row detail-row-note">
                  <span class="detail-label">备注:</span>
                  <span
                    class="detail-value core-note-content"
                    v-html="renderMarkdown(selectedCoreInfo.note)"
                  ></span>
                </div>
                <div class="detail-actions">
                  <button
                    class="toggle-btn"
                    :class="{ 'toggled-on': localCoreSelections.get(selectedCoreKey) }"
                    @click="handleSelectCore(selectedCoreKey)"
                  >
                    {{ localCoreSelections.get(selectedCoreKey) ? '已选择' : '未选择' }}
                  </button>
                </div>
              </template>
              <div v-else class="detail-placeholder">请选择一个核心查看详情</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="step-footer">
      <button class="nav-button" :disabled="isSaving" @click="$emit('prev')">
        <span>上一步</span>
      </button>
      <button
        class="nav-button"
        :disabled="!selectedCore || isLoading || isSaving"
        @click="handleNext"
      >
        <span>{{ isSaving ? '保存中...' : '下一步' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  getCoresForTab as getCoresForTabService,
  getSelectedCore,
  initialCoreState,
  loadCoreOptions as loadCoreOptionsService,
  saveChanges as saveChangesService,
  selectCore,
  type CoreOption,
} from '../services/CorePage';
import { renderMarkdown } from '../services/markdownRender';

const emit = defineEmits<{
  prev: [];
  next: [];
}>();

const isLoading = ref(false);
const isSaving = ref(false);
const tabs = ref<string[]>([...initialCoreState.tabs]);
const activeTab = ref<string>(initialCoreState.activeTab);
const coreOptions = ref<CoreOption[]>([...initialCoreState.coreOptions]);
const localCoreSelections = ref(new Map(initialCoreState.localCoreSelections));
const bookName = ref<string | null>(null);

// 选中查看详情的核心
const selectedCoreKey = ref<string | null>(null);

// Tab 分页相关
const maxVisibleTabs = 4;
const tabStartIndex = ref(0);

const selectedCore = computed(() => getSelectedCore(localCoreSelections.value));

// 获取选中核心的详细信息
const selectedCoreInfo = computed(() => {
  if (!selectedCoreKey.value) return null;
  return coreOptions.value.find(core => core.value === selectedCoreKey.value) || null;
});

// 是否显示箭头
const showArrows = computed(() => tabs.value.length > maxVisibleTabs);

// 当前可见的 tabs
const visibleTabs = computed(() => {
  if (!showArrows.value) {
    return tabs.value;
  }
  return tabs.value.slice(tabStartIndex.value, tabStartIndex.value + maxVisibleTabs);
});

// 切换到上一批 tabs
function handlePrevTabs() {
  if (tabStartIndex.value > 0) {
    tabStartIndex.value = Math.max(0, tabStartIndex.value - maxVisibleTabs);
  }
}

// 切换到下一批 tabs
function handleNextTabs() {
  if (tabStartIndex.value + maxVisibleTabs < tabs.value.length) {
    tabStartIndex.value = Math.min(
      tabs.value.length - maxVisibleTabs,
      tabStartIndex.value + maxVisibleTabs,
    );
  }
}

// 当 activeTab 改变时，确保它在可见范围内，并清空选中
watch(activeTab, newTab => {
  selectedCoreKey.value = null;
  const tabIndex = tabs.value.indexOf(newTab);
  if (tabIndex !== -1 && showArrows.value) {
    if (tabIndex < tabStartIndex.value) {
      tabStartIndex.value = tabIndex;
    } else if (tabIndex >= tabStartIndex.value + maxVisibleTabs) {
      tabStartIndex.value = tabIndex - maxVisibleTabs + 1;
    }
  }
});

function getCoresForTab(tab: string): CoreOption[] {
  return getCoresForTabService(coreOptions.value, tab);
}

async function loadCoreOptions() {
  isLoading.value = true;
  try {
    const result = await loadCoreOptionsService();
    tabs.value = result.tabs;
    coreOptions.value = result.coreOptions;
    localCoreSelections.value = result.localCoreSelections;
    activeTab.value = result.activeTab;
    bookName.value = result.bookName;
  } catch (error) {
    console.error('加载核心列表失败:', error);
    tabs.value = [];
    coreOptions.value = [];
    localCoreSelections.value = new Map();
    bookName.value = null;
  } finally {
    isLoading.value = false;
  }
}

async function handleRefresh() {
  await loadCoreOptions();
}

function handleSelectCore(coreValue: string) {
  localCoreSelections.value = selectCore(localCoreSelections.value, coreValue);
}

/**
 * 点击下一步：根据本地列表更新世界书后跳转
 */
async function handleNext() {
  isSaving.value = true;
  try {
    if (bookName.value) {
      coreOptions.value = await saveChangesService(
        coreOptions.value,
        localCoreSelections.value,
        bookName.value,
      );
    }
  } catch (error) {
    console.error('保存核心选择失败:', error);
  } finally {
    isSaving.value = false;
  }
  emit('next');
}

// 组件挂载时加载核心列表
onMounted(() => {
  loadCoreOptions();
});
</script>

<style scoped>
.main-title {
  font-family: var(--title-font);
  font-weight: 700;
  color: var(--title-color);
  text-align: center;
  margin: 0 0 10px 0;
  font-size: 2.2em;
}

.control-panel-container {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: rgba(253, 250, 245, 0.9);
  padding: 0;
  margin: 25px 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* Tab 导航样式 */
.tab-navigation {
  display: flex;
  align-items: stretch;
  background-color: var(--item-bg-color);
  border-bottom: 1px solid var(--border-color);
}

.arrow-button {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-right: 1px solid var(--border-color);
  cursor: pointer;
  font-size: 1.5em;
  color: var(--text-color);
  opacity: 0.7;
  transition: all 0.2s ease-in-out;
}

.arrow-button:last-of-type {
  border-right: none;
  border-left: 1px solid var(--border-color);
}

.arrow-button:hover:not(:disabled) {
  opacity: 1;
  background-color: var(--item-bg-hover-color);
}

.arrow-button:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.tab-buttons-container {
  flex: 1;
  display: flex;
  align-items: stretch;
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-family: var(--body-font);
  font-size: 1em;
  color: var(--text-color);
  opacity: 0.7;
  transition: all 0.2s ease-in-out;
}

.tab-button:hover {
  opacity: 1;
  background-color: var(--item-bg-hover-color);
}

.tab-button.active {
  color: var(--title-color);
  opacity: 1;
  border-bottom-color: var(--title-color);
}

.tab-label {
  font-weight: 500;
}

.tab-count {
  font-size: 0.85em;
  opacity: 0.8;
}

.refresh-button {
  flex: 0 0 auto;
  background: transparent;
  border: none;
  border-left: 1px solid var(--border-color);
  padding: 12px 16px;
  cursor: pointer;
  font-size: 1.2em;
  color: var(--text-color);
  opacity: 0.7;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-button:hover:not(:disabled) {
  opacity: 1;
  background-color: var(--item-bg-hover-color);
}

.refresh-button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.refresh-button .is-spinning {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.tab-content {
  padding: 15px 20px;
}

.control-group {
  min-height: 200px;
}

/* 列表-详情布局 */
.list-detail-layout {
  display: flex;
  gap: 20px;
  height: 450px;
}

.item-list {
  flex: 0 0 200px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  max-height: 450px;
  overflow-y: auto;
  padding-right: 10px;
  border-right: 1px solid var(--border-color);

  /* 默认隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
}

.item-list::-webkit-scrollbar {
  width: 6px;
}

.item-list::-webkit-scrollbar-track {
  background: transparent;
}

.item-list::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 3px;
  transition: background-color 0.2s ease;
}

/* 悬停时显示滚动条 */
.item-list:hover {
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent; /* Firefox */
}

.item-list:hover::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.3);
}

.item-list:hover::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

.list-item {
  font-family: var(--body-font);
  font-size: 0.95em;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background-color: var(--item-bg-color);
  color: var(--text-color);
  text-align: left;
  width: 100%;
}

.list-item:hover {
  background-color: var(--item-bg-hover-color);
  border-color: var(--border-strong-color);
}

.list-item.selected {
  background-color: var(--item-bg-selected-color);
  border-color: var(--title-color);
  color: var(--title-color);
  font-weight: 500;
}

.list-item.toggled-on {
  border-left: 3px solid #28a745;
}

.list-item.toggled-on.selected {
  border-left: 3px solid #28a745;
}

/* 详情面板 */
.item-detail {
  flex: 1;
  padding: 10px 20px;
  height: 100%;
  max-height: 450px;
  overflow-y: auto;
}

.detail-name {
  font-family: var(--title-font);
  font-size: 1.4em;
  font-weight: 600;
  color: var(--title-color);
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--border-color);
}

.detail-row {
  display: flex;
  margin-bottom: 10px;
  font-size: 0.95em;
}

.detail-row-note {
  flex-direction: column;
}

.detail-row-note .detail-label {
  flex: none;
  margin-bottom: 6px;
}

.detail-label {
  flex: 0 0 60px;
  color: var(--text-color);
  opacity: 0.8;
}

.detail-value {
  flex: 1;
  color: var(--text-color);
}

/* Markdown 渲染后的备注内容 */
.core-note-content {
  line-height: 1.6;
  word-break: break-word;
}

.core-note-content :deep(h1),
.core-note-content :deep(h2),
.core-note-content :deep(h3) {
  margin: 8px 0 4px 0;
  color: var(--title-color);
}

.core-note-content :deep(h1) {
  font-size: 1.2em;
}

.core-note-content :deep(h2) {
  font-size: 1.1em;
}

.core-note-content :deep(h3) {
  font-size: 1em;
}

.core-note-content :deep(ul) {
  margin: 4px 0;
  padding-left: 20px;
}

.core-note-content :deep(li) {
  margin-bottom: 2px;
}

.core-note-content :deep(code) {
  background-color: rgba(0, 0, 0, 0.06);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}

.core-note-content :deep(strong) {
  font-weight: 600;
}

.core-note-content :deep(a) {
  color: var(--title-color);
  text-decoration: underline;
}

.core-note-content :deep(hr) {
  border: none;
  border-top: 1px dashed var(--border-color);
  margin: 12px 0;
}

.core-note-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
  font-size: 0.9em;
}

.core-note-content :deep(th),
.core-note-content :deep(td) {
  border: 1px solid var(--border-color);
  padding: 6px 10px;
  text-align: left;
}

.core-note-content :deep(th) {
  background-color: rgba(0, 0, 0, 0.04);
  font-weight: 600;
}

.core-note-content :deep(tr:nth-child(even)) {
  background-color: rgba(0, 0, 0, 0.02);
}

.detail-actions {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px dashed var(--border-color);
}

.toggle-btn {
  font-family: var(--body-font);
  font-size: 0.95em;
  padding: 8px 20px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background-color: #f8d7da;
  color: #721c24;
}

.toggle-btn:hover {
  opacity: 0.9;
}

.toggle-btn.toggled-on {
  background-color: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.detail-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 150px;
  color: var(--text-color);
  opacity: 0.6;
  font-size: 0.95em;
}

.loading-text,
.empty-text {
  font-size: 0.95em;
  color: #6a514d;
  text-align: center;
  padding: 20px;
  opacity: 0.8;
}

.step-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 20px;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--body-font);
  font-weight: 500;
  font-size: 1em;
  color: var(--title-color);
  background-color: var(--item-bg-color);
  border: 1px solid var(--border-color);
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.nav-button:hover:not(:disabled) {
  background-color: var(--item-bg-hover-color);
  border-color: var(--border-strong-color);
  transform: translateY(-2px);
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-icon {
  font-size: 1.1em;
}

@media screen and (max-width: 600px) {
  .main-title {
    font-size: 1.8em;
  }

  .tab-button {
    padding: 10px 8px;
    font-size: 0.85em;
  }

  .arrow-button {
    padding: 10px 12px;
    font-size: 1.2em;
  }

  .refresh-button {
    padding: 10px 12px;
  }

  .list-detail-layout {
    flex-direction: column;
    height: auto;
  }

  .item-list {
    flex: none;
    height: auto;
    max-height: 150px;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
    padding-right: 0;
    padding-bottom: 10px;
  }

  .item-detail {
    height: auto;
    max-height: none;
    padding: 10px 0;
  }
}
</style>
