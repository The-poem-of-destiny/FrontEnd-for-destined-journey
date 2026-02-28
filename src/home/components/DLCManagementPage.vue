<template>
  <div class="settings-page">
    <h2 class="main-title">DLC 管理</h2>

    <div class="control-panel-container">
      <!-- Tab 导航 -->
      <div class="tab-navigation">
        <button
          class="tab-button"
          :class="{ active: activeTab === '角色' }"
          @click="switchTab('角色')"
        >
          <span class="tab-label">角色</span>
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === '事件' }"
          @click="switchTab('事件')"
        >
          <span class="tab-label">事件</span>
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === '扩展' }"
          @click="switchTab('扩展')"
        >
          <span class="tab-label">扩展</span>
        </button>
        <button
          class="refresh-button"
          :disabled="isLoading"
          title="刷新列表"
          @click="handleRefresh"
        >
          <span :class="{ 'is-spinning': isLoading }">⟳</span>
        </button>
      </div>

      <!-- 搜索框 -->
      <div class="search-container">
        <input v-model="searchTerm" type="text" class="dlc-search" placeholder="🔍 搜索..." />
      </div>

      <!-- Tab 内容区域 -->
      <div class="tab-content">
        <div class="control-group">
          <div v-if="isLoading" class="loading-text">正在加载{{ activeTab }}列表...</div>
          <div v-else-if="currentTabOptions.length === 0" class="empty-text">
            未找到可用的{{ activeTab }}
          </div>
          <div v-else class="list-detail-layout">
            <div class="item-list">
              <button
                v-for="dlc in filteredOptions"
                :key="dlc.dlcKey"
                class="list-item"
                :class="{
                  'toggled-on': localSelections.get(dlc.dlcKey),
                  selected: selectedDLC === dlc.dlcKey,
                }"
                @click="selectedDLC = dlc.dlcKey"
              >
                {{ dlc.label }}
              </button>
            </div>
            <div class="item-detail">
              <template v-if="selectedDLC && selectedDLCInfo">
                <h3 class="detail-name">{{ selectedDLCInfo.label }}</h3>
                <div class="detail-row">
                  <span class="detail-label">作者:</span>
                  <span class="detail-value">{{ selectedDLCInfo.author || '未知' }}</span>
                </div>
                <div v-if="selectedDLCInfo.entries.length > 1" class="detail-row">
                  <span class="detail-label">大小:</span>
                  <span class="detail-value">{{ selectedDLCInfo.entries.length }} 个条目</span>
                </div>
                <div v-if="selectedDLCInfo.exclusionTargets.length > 0" class="detail-row">
                  <span class="detail-label">互斥:</span>
                  <span class="detail-value exclusion-hint">{{
                    selectedDLCInfo.exclusionTargets.join(', ')
                  }}</span>
                </div>
                <div v-if="selectedDLCInfo.replacementTargets.length > 0" class="detail-row">
                  <span class="detail-label">替换:</span>
                  <span class="detail-value replacement-hint">{{
                    selectedDLCInfo.replacementTargets.join(', ')
                  }}</span>
                </div>
                <div v-if="selectedDLCInfo.prerequisiteTargets.length > 0" class="detail-row">
                  <span class="detail-label">前置:</span>
                  <span class="detail-value prerequisite-hint">{{
                    selectedDLCInfo.prerequisiteTargets.join(', ')
                  }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">信息:</span>
                  <span class="detail-value">{{ selectedDLCInfo.info || '无' }}</span>
                </div>
                <div class="detail-actions">
                  <button
                    class="toggle-btn"
                    :class="{ 'toggled-on': localSelections.get(selectedDLC) }"
                    @click="handleToggle(selectedDLC)"
                  >
                    {{ localSelections.get(selectedDLC) ? '已启用' : '已禁用' }}
                  </button>
                </div>
              </template>
              <div v-else class="detail-placeholder">请选择一个{{ activeTab }}查看详情</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="step-footer">
      <div></div>
      <button class="nav-button" :disabled="isLoading || isSaving" @click="handleNext">
        <span>{{ isSaving ? '保存中...' : '下一步' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  initialDLCState,
  loadDLCOptions as loadDLCOptionsService,
  saveDLCChanges as saveDLCChangesService,
  toggleDLC,
  type DLCCategory,
  type DLCOption,
} from '../services/DLCManagement';

const emit = defineEmits<{
  next: [];
}>();

const isLoading = ref(false);
const isSaving = ref(false);

// Tab 状态
const activeTab = ref<DLCCategory>('角色');

// 搜索状态
const searchTerm = ref('');

// 选中项状态
const selectedDLC = ref<string | null>(null);

// 统一 DLC 状态
const dlcOptions = ref<DLCOption[]>([...initialDLCState.dlcOptions]);
const localSelections = ref(new Map(initialDLCState.localSelections));

const bookName = ref<string | null>(null);

// 计算属性：当前 Tab 的选项列表
const currentTabOptions = computed(() => {
  return dlcOptions.value.filter(dlc => dlc.category === activeTab.value);
});

// 计算属性：过滤后的列表
const filteredOptions = computed(() => {
  const term = searchTerm.value.toLowerCase();
  const tabOptions = currentTabOptions.value;
  if (!term) return tabOptions;

  return tabOptions.filter(dlc => {
    const searchStr = `${dlc.label} ${dlc.author || ''} ${dlc.info || ''}`.toLowerCase();
    return searchStr.includes(term);
  });
});

// 计算属性：获取选中项的详细信息
const selectedDLCInfo = computed(() => {
  if (!selectedDLC.value) return null;
  return dlcOptions.value.find(dlc => dlc.dlcKey === selectedDLC.value) || null;
});

async function loadAllOptions() {
  isLoading.value = true;
  try {
    const result = await loadDLCOptionsService();
    dlcOptions.value = result.dlcOptions;
    localSelections.value = result.localSelections;
    bookName.value = result.bookName;
  } catch (error) {
    console.error('加载DLC数据失败:', error);
    dlcOptions.value = [];
    localSelections.value = new Map();
    bookName.value = null;
  } finally {
    isLoading.value = false;
  }
}

async function handleRefresh() {
  await loadAllOptions();
}

function switchTab(tab: DLCCategory) {
  activeTab.value = tab;
  selectedDLC.value = null;
}

function handleToggle(dlcKey: string) {
  const result = toggleDLC(localSelections.value, dlcOptions.value, dlcKey);

  if (result.success) {
    localSelections.value = result.selections;
  } else {
    alert(result.error || '操作失败');
  }
}

/**
 * 点击下一步：保存所有 DLC 变更后跳转
 */
async function handleNext() {
  isSaving.value = true;
  try {
    if (bookName.value) {
      const updatedOptions = await saveDLCChangesService(
        dlcOptions.value,
        localSelections.value,
        bookName.value,
      );
      dlcOptions.value = updatedOptions;
    }
  } catch (error) {
    console.error('保存DLC选择失败:', error);
  } finally {
    isSaving.value = false;
  }
  emit('next');
}

// 监听 Tab 切换，清空搜索词和选中状态
watch(activeTab, () => {
  searchTerm.value = '';
  selectedDLC.value = null;
});

// 组件挂载时加载所有选项
onMounted(() => {
  loadAllOptions();
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

/* 搜索框样式 */
.search-container {
  padding: 10px 20px 0 20px;
}

.dlc-search {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: var(--body-font);
  font-size: 0.95em;
  background-color: var(--item-bg-color);
  color: var(--text-color);
  outline: none;
  transition: border-color 0.2s ease-in-out;
}

.dlc-search:focus {
  border-color: var(--title-color);
}

.dlc-search::placeholder {
  color: #999;
}

/* Tab 导航样式 */
.tab-navigation {
  display: flex;
  align-items: stretch;
  background-color: var(--item-bg-color);
  border-bottom: 1px solid var(--border-color);
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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

.tab-content {
  padding: 15px 20px;
}

.control-group {
  min-height: 200px;
}

.refresh-button {
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

.detail-label {
  flex: 0 0 60px;
  color: var(--text-color);
  opacity: 0.8;
}

.detail-value {
  flex: 1;
  color: var(--text-color);
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

.exclusion-hint {
  color: #856404;
  font-style: italic;
}

.replacement-hint {
  color: #0c5460;
  font-style: italic;
}

.prerequisite-hint {
  color: #155724;
  font-style: italic;
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

  .list-detail-layout {
    flex-direction: column;
  }

  .list-detail-layout {
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
  }

  .item-detail {
    padding: 10px 0;
  }
}
</style>
