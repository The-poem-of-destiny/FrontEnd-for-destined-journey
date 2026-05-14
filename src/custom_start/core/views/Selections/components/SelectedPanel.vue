<script setup lang="ts">
import ConfirmModal from '../../../components/ConfirmModal.vue';
import { useStorePoints } from '../../../composables/use-store-points';
import type { Equipment, Item, Skill } from '../../../types';
import {
  createLibraryEntries,
  downloadContentPack,
  downloadWorldbookEntries,
  importContentPackFromFile,
  upsertLibraryEntries,
  type LibraryEntry,
} from '../../../utils/custom-library';

interface Props {
  equipments: Equipment[];
  items: Item[];
  skills: Skill[];
}

interface Emits {
  (e: 'remove', item: Equipment | Item | Skill, type: 'equipment' | 'item' | 'skill'): void;
  (e: 'edit-custom', item: Equipment | Item | Skill, type: 'equipment' | 'item' | 'skill'): void;
  (e: 'clear'): void;
  (e: 'library-updated'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { availablePoints, totalPoints, consumedPoints } = useStorePoints();
type SelectionType = 'equipment' | 'item' | 'skill';

interface BatchEntry {
  key: string;
  item: Equipment | Item | Skill;
  type: SelectionType;
}

const isBatchMode = ref(false);
const selectedBatchKeys = ref<string[]>([]);
const showBatchDeleteConfirm = ref(false);
const showClearConfirm = ref(false);

const createBatchKey = (item: Equipment | Item | Skill, type: SelectionType) =>
  `${type}:${item.name}`;

const handleEditCustom = (item: Equipment | Item | Skill, type: 'equipment' | 'item' | 'skill') => {
  emit('edit-custom', item, type);
};

const createBatchEntry = (
  item: Equipment | Item | Skill,
  type: SelectionType,
): BatchEntry => ({
  key: createBatchKey(item, type),
  item,
  type,
});

const allBatchEntries = computed<BatchEntry[]>(() => [
  ...props.equipments.map(item => createBatchEntry(item, 'equipment')),
  ...props.items.map(item => createBatchEntry(item, 'item')),
  ...props.skills.map(item => createBatchEntry(item, 'skill')),
]);

const selectedBatchKeySet = computed(() => new Set(selectedBatchKeys.value));

const selectedBatchEntries = computed(() =>
  allBatchEntries.value.filter(entry => selectedBatchKeySet.value.has(entry.key)),
);

const selectedBatchCount = computed(() => selectedBatchEntries.value.length);

const buildSelectedLibraryEntries = (): LibraryEntry[] =>
  createLibraryEntries(
    selectedBatchEntries.value.map(entry => ({
      type: entry.type,
      item: entry.item,
    })),
  );

const toggleBatchMode = () => {
  if (totalCount.value === 0) {
    toastr.warning('没有可批量操作的项目');
    return;
  }

  isBatchMode.value = !isBatchMode.value;
  selectedBatchKeys.value = [];
};

const isBatchItemSelected = (item: Equipment | Item | Skill, type: SelectionType) => {
  return selectedBatchKeySet.value.has(createBatchKey(item, type));
};

const toggleBatchItem = (item: Equipment | Item | Skill, type: SelectionType) => {
  const key = createBatchKey(item, type);
  const nextKeys = new Set(selectedBatchKeys.value);

  if (nextKeys.has(key)) {
    nextKeys.delete(key);
  } else {
    nextKeys.add(key);
  }

  selectedBatchKeys.value = Array.from(nextKeys);
};

const handleItemClick = (item: Equipment | Item | Skill, type: SelectionType) => {
  if (isBatchMode.value) {
    toggleBatchItem(item, type);
    return;
  }

  if (item.isCustom) {
    handleEditCustom(item, type);
  }
};

const handleClear = () => {
  showClearConfirm.value = true;
};

const requestBatchDelete = () => {
  if (selectedBatchCount.value === 0) {
    toastr.warning('请先选择要删除的项目');
    return;
  }

  showBatchDeleteConfirm.value = true;
};

const confirmBatchDelete = () => {
  const deleteCount = selectedBatchCount.value;

  selectedBatchEntries.value.forEach(entry => {
    emit('remove', entry.item, entry.type);
  });

  selectedBatchKeys.value = [];
  isBatchMode.value = false;
  showBatchDeleteConfirm.value = false;
  toastr.info(`已删除 ${deleteCount} 个项目`);
};

const cancelBatchDelete = () => {
  showBatchDeleteConfirm.value = false;
};

const saveSelectedToLibrary = () => {
  if (selectedBatchCount.value === 0) {
    toastr.warning('请先选择要存入素材库的项目');
    return;
  }

  const savedCount = upsertLibraryEntries(buildSelectedLibraryEntries());
  emit('library-updated');
  toastr.success(`已存入素材库 ${savedCount} 个项目，之后可直接复用`);
};

const exportSelectedJson = () => {
  if (selectedBatchCount.value === 0) {
    toastr.warning('请先选择要导出的项目');
    return;
  }

  downloadContentPack(buildSelectedLibraryEntries());
};

const exportSelectedWorldbook = () => {
  if (selectedBatchCount.value === 0) {
    toastr.warning('请先选择要导出的项目');
    return;
  }

  downloadWorldbookEntries(buildSelectedLibraryEntries());
};

const importJsonToLibrary = async () => {
  try {
    const importedCount = await importContentPackFromFile();
    if (importedCount > 0) {
      emit('library-updated');
    }
  } catch (error) {
    if ((error as Error).message !== '用户取消') {
      toastr.error('导入素材失败：JSON 格式不正确');
    }
  }
};

const confirmClear = () => {
  emit('clear');
  showClearConfirm.value = false;
};

const cancelClear = () => {
  showClearConfirm.value = false;
};

watch(
  allBatchEntries,
  entries => {
    const validKeys = new Set(entries.map(entry => entry.key));
    selectedBatchKeys.value = selectedBatchKeys.value.filter(key => validKeys.has(key));

    if (entries.length === 0) {
      isBatchMode.value = false;
    }
  },
  { deep: true },
);

const totalCount = computed(() => {
  return props.equipments.length + props.items.length + props.skills.length;
});

const totalCost = computed(() =>
  _.sum([
    _.sumBy(props.equipments, 'cost'),
    _.sumBy(props.items, 'cost'),
    _.sumBy(props.skills, 'cost'),
  ]),
);
</script>

<template>
  <div class="selected-panel" :class="{ 'batch-mode-active': isBatchMode }">
    <div class="panel-header">
      <div class="header-top">
        <h3 class="title">已选项目</h3>
        <div class="header-actions">
          <button
            v-if="totalCount > 0"
            class="batch-toggle"
            :class="{ active: isBatchMode }"
            @click="toggleBatchMode"
          >
            <i
              class="fa-solid"
              :class="isBatchMode ? 'fa-check' : 'fa-list-check'"
              aria-hidden="true"
            ></i>
            {{ isBatchMode ? '完成' : '批量操作' }}
          </button>
          <div class="count-badge">{{ totalCount }}</div>
        </div>
      </div>
      <div class="points-info">
        <span class="points-label">转生点数：</span>
        <span class="points-value" :class="{ negative: availablePoints < 0 }">
          {{ availablePoints }}
        </span>
        <span class="points-total">/ {{ totalPoints }}</span>
        <span class="points-consumed">（已消耗：{{ consumedPoints }}）</span>
      </div>
    </div>

    <div class="panel-body">
      <!-- 装备列表 -->
      <div v-if="equipments.length > 0" class="section">
        <div class="section-title">
          <span class="section-label">
            <i class="fa-solid fa-shield-halved" aria-hidden="true"></i>
            <span>装备</span>
          </span>
          <span class="count">({{ equipments.length }})</span>
        </div>
        <div class="item-list">
          <div
            v-for="item in equipments"
            :key="item.name"
            class="selected-item"
            :class="{
              'is-custom': item.isCustom,
              'batch-mode': isBatchMode,
              selected: isBatchItemSelected(item, 'equipment'),
            }"
            @click="handleItemClick(item, 'equipment')"
          >
            <span v-if="isBatchMode" class="batch-check" aria-hidden="true">
              <i
                class="fa-solid"
                :class="isBatchItemSelected(item, 'equipment') ? 'fa-check' : 'fa-plus'"
              ></i>
            </span>
            <div class="item-info">
              <div class="item-name">
                <span class="name-text">{{ item.name }}</span>
                <span v-if="item.isCustom" class="custom-tag">
                  <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                </span>
              </div>
              <div class="item-cost">{{ item.cost }} 点</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 道具列表 -->
      <div v-if="items.length > 0" class="section">
        <div class="section-title">
          <span class="section-label">
            <i class="fa-solid fa-box-open" aria-hidden="true"></i>
            <span>道具</span>
          </span>
          <span class="count">({{ items.length }})</span>
        </div>
        <div class="item-list">
          <div
            v-for="item in items"
            :key="item.name"
            class="selected-item"
            :class="{
              'is-custom': item.isCustom,
              'batch-mode': isBatchMode,
              selected: isBatchItemSelected(item, 'item'),
            }"
            @click="handleItemClick(item, 'item')"
          >
            <span v-if="isBatchMode" class="batch-check" aria-hidden="true">
              <i
                class="fa-solid"
                :class="isBatchItemSelected(item, 'item') ? 'fa-check' : 'fa-plus'"
              ></i>
            </span>
            <div class="item-info">
              <div class="item-name">
                <span class="name-text">{{ item.name }}</span>
                <span v-if="item.quantity" class="item-quantity">× {{ item.quantity }}</span>
                <span v-if="item.isCustom" class="custom-tag">
                  <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                </span>
              </div>
              <div class="item-cost">{{ item.cost }} 点</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 技能列表 -->
      <div v-if="skills.length > 0" class="section">
        <div class="section-title">
          <span class="section-label">
            <i class="fa-solid fa-wand-magic" aria-hidden="true"></i>
            <span>技能</span>
          </span>
          <span class="count">({{ skills.length }})</span>
        </div>
        <div class="item-list">
          <div
            v-for="item in skills"
            :key="item.name"
            class="selected-item"
            :class="{
              'is-custom': item.isCustom,
              'batch-mode': isBatchMode,
              selected: isBatchItemSelected(item, 'skill'),
            }"
            @click="handleItemClick(item, 'skill')"
          >
            <span v-if="isBatchMode" class="batch-check" aria-hidden="true">
              <i
                class="fa-solid"
                :class="isBatchItemSelected(item, 'skill') ? 'fa-check' : 'fa-plus'"
              ></i>
            </span>
            <div class="item-info">
              <div class="item-name">
                <span class="name-text">{{ item.name }}</span>
                <span v-if="item.isCustom" class="custom-tag">
                  <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                </span>
              </div>
              <div class="item-cost">{{ item.cost }} 点</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="totalCount === 0" class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-bullseye" aria-hidden="true"></i></div>
        <div class="empty-text">还没有选择任何物品</div>
      </div>
    </div>

    <div class="panel-footer">
      <div v-if="isBatchMode" class="batch-footer">
        <div class="batch-status">
          <span>已选</span>
          <strong>{{ selectedBatchCount }}</strong>
        </div>
        <div class="batch-actions">
          <button class="batch-action danger" :disabled="selectedBatchCount === 0" @click="requestBatchDelete">
            <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
            删除
          </button>
          <button class="batch-action" :disabled="selectedBatchCount === 0" @click="exportSelectedJson">
            <i class="fa-solid fa-file-export" aria-hidden="true"></i>
            JSON
          </button>
          <button class="batch-action" :disabled="selectedBatchCount === 0" @click="saveSelectedToLibrary">
            <i class="fa-solid fa-box-archive" aria-hidden="true"></i>
            素材库
          </button>
          <button
            class="batch-action"
            :disabled="selectedBatchCount === 0"
            @click="exportSelectedWorldbook"
          >
            <i class="fa-solid fa-book" aria-hidden="true"></i>
            世界书
          </button>
          <button class="batch-action" @click="importJsonToLibrary">
            <i class="fa-solid fa-file-import" aria-hidden="true"></i>
            导入
          </button>
        </div>
      </div>
      <template v-else>
        <div class="total-info">
          <span class="label">总消耗：</span>
          <span class="value">{{ totalCost }} 点</span>
        </div>
        <button v-if="totalCount > 0" class="clear-btn" @click="handleClear">清空全部</button>
      </template>
    </div>

    <ConfirmModal
      :visible="showBatchDeleteConfirm"
      title="确认批量删除"
      :message="`确定要删除已选的 ${selectedBatchCount} 个项目吗？此操作不可撤销。`"
      confirm-text="删除所选"
      cancel-text="取消"
      type="danger"
      @confirm="confirmBatchDelete"
      @cancel="cancelBatchDelete"
    />

    <ConfirmModal
      :visible="showClearConfirm"
      title="确认清空全部"
      message="确定要清空所有已选装备、道具和技能吗？此操作不可撤销。"
      confirm-text="清空全部"
      cancel-text="取消"
      type="danger"
      @confirm="confirmClear"
      @cancel="cancelClear"
    />
  </div>
</template>

<style lang="scss" scoped>
.selected-panel {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  height: 100%;

  .panel-header {
    padding: var(--spacing-md);
    border-bottom: 2px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .title {
      font-size: 1.1rem;
      margin: 0;
      color: var(--title-color);
      font-weight: 700;
    }

    .header-actions {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--spacing-xs);
      flex: none;
    }

    .batch-toggle {
      min-height: 32px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px var(--spacing-sm);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--input-bg);
      color: var(--title-color);
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all var(--transition-fast);

      i {
        color: var(--accent-color);
      }

      &:hover,
      &.active {
        background: var(--accent-color);
        border-color: var(--accent-color);
        color: var(--primary-bg);

        i {
          color: currentColor;
        }
      }
    }

    .count-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
      padding: 0 var(--spacing-sm);
      background: var(--accent-color);
      color: var(--primary-bg);
      border-radius: 50%;
      font-weight: 700;
      font-size: 1rem;
    }

    .points-info {
      display: flex;
      align-items: baseline;
      gap: var(--spacing-xs);
      font-size: 0.9rem;

      .points-label {
        color: var(--text-light);
        font-weight: 500;
      }

      .points-value {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--accent-color);
        font-family: var(--font-mono);

        &.negative {
          color: var(--error-color);
        }
      }

      .points-total {
        color: var(--text-light);
        font-family: var(--font-mono);
      }

      .points-consumed {
        color: var(--text-light);
        font-size: 0.85rem;
      }
    }
  }

  .panel-body {
    flex: 1;
    align-content: center;
    overflow-y: auto;
    padding: var(--spacing-lg);

    .section {
      margin-bottom: var(--spacing-lg);

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        font-size: 1rem;
        font-weight: 600;
        color: var(--title-color);
        margin-bottom: var(--spacing-sm);
        padding-bottom: var(--spacing-xs);
        border-bottom: 1px solid var(--border-color-light);

        .section-label {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);

          i {
            font-size: 1rem;
            color: var(--accent-color);
          }
        }

        .count {
          font-size: 0.9rem;
          color: var(--text-light);
        }
      }

      .item-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .selected-item {
        display: flex;
        gap: var(--spacing-sm);
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm);
        background: var(--input-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        transition: all var(--transition-fast);

        &:hover {
          border-color: var(--accent-color);
          box-shadow: var(--shadow-sm);
        }

        &.batch-mode {
          cursor: pointer;
        }

        &.selected {
          background: rgba(212, 175, 55, 0.14);
          border-color: var(--accent-color);
          box-shadow: 0 0 0 1px rgba(212, 175, 55, 0.2);

          .batch-check {
            background: var(--accent-color);
            border-color: var(--accent-color);
            color: var(--primary-bg);
          }
        }

        .batch-check {
          flex: none;
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background: var(--card-bg);
          color: var(--text-light);
          font-size: 0.82rem;
        }

        .item-info {
          flex: 1;
          min-width: 0;

          .item-name {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-color);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            .name-text {
              min-width: 0;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .item-quantity {
              margin-left: var(--spacing-xs);
              font-size: 0.85rem;
              font-weight: 500;
              color: #4caf50;
            }

            .custom-tag {
              flex: none;
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 2px 6px;
              border-radius: var(--radius-sm);
              background: rgba(76, 175, 80, 0.15);
              color: #43a047;
              font-size: 0.75rem;
              font-weight: 600;

              i {
                font-size: 0.7rem;
              }
            }
          }

          .item-cost {
            font-size: 0.85rem;
            color: var(--accent-color);
            font-family: var(--font-mono);
            margin-top: 2px;
          }
        }

        &.is-custom {
          cursor: pointer;
          border-style: dashed;

          &:hover {
            border-color: #43a047;
            box-shadow: 0 0 0 1px rgba(67, 160, 71, 0.2);
          }
        }

      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-2xl) var(--spacing-lg);
      text-align: center;

      .empty-icon {
        font-size: 3rem;
        margin-bottom: var(--spacing-md);
        opacity: 0.5;
      }

      .empty-text {
        font-size: 0.95rem;
        color: var(--text-light);
        font-style: italic;
      }
    }
  }

  .panel-footer {
    padding: var(--spacing-lg);
    border-top: 2px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-md);

    .total-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);

      .label {
        font-size: 0.95rem;
        color: var(--text-light);
      }

      .value {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--accent-color);
        font-family: var(--font-mono);
      }
    }

    .clear-btn {
      padding: var(--spacing-sm) var(--spacing-lg);
      background: var(--error-color);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
      transition: all var(--transition-fast);

      &:hover {
        background: #b71c1c;
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }
    }

    .batch-footer {
      width: 100%;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: var(--spacing-md);
    }

    .batch-status {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--text-light);
      font-size: 0.9rem;

      strong {
        min-width: 28px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--accent-color);
        color: var(--primary-bg);
        border-radius: 50%;
        font-family: var(--font-mono);
      }
    }

    .batch-actions {
      min-width: 0;
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-xs);
      flex-wrap: wrap;
    }

    .batch-action {
      min-height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px var(--spacing-sm);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--input-bg);
      color: var(--title-color);
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all var(--transition-fast);

      i {
        color: var(--accent-color);
      }

      &:hover:not(:disabled) {
        border-color: var(--accent-color);
        box-shadow: var(--shadow-sm);
      }

      &.danger {
        background: rgba(211, 47, 47, 0.08);
        border-color: rgba(211, 47, 47, 0.3);
        color: var(--error-color);

        i {
          color: currentColor;
        }

        &:hover:not(:disabled) {
          background: var(--error-color);
          border-color: var(--error-color);
          color: white;
        }
      }

      &:disabled {
        opacity: 0.48;
        cursor: not-allowed;
      }
    }
  }
}

// 自定义滚动条
.panel-body {
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

// 响应式设计
@media (max-width: 768px) {
  .selected-panel {
    max-height: none;
    border-width: 1px;
    border-radius: var(--radius-md);

    .panel-header {
      padding: var(--spacing-sm);
      border-bottom: 1px solid var(--border-color);

      .title {
        font-size: 0.95rem;
      }

      .header-actions {
        gap: 4px;
      }

      .batch-toggle {
        min-height: 30px;
        padding: 5px 7px;
        font-size: 0.76rem;
      }

      .count-badge {
        min-width: 28px;
        height: 28px;
        font-size: 0.9rem;
      }

      .points-info {
        flex-wrap: wrap;
        font-size: 0.8rem;

        .points-value {
          font-size: 0.95rem;
        }

        .points-consumed {
          font-size: 0.75rem;
        }
      }
    }

    .panel-body {
      padding: var(--spacing-md);
      max-height: 260px;

      .section {
        .section-title {
          font-size: 0.95rem;
        }

        .selected-item {
          padding: var(--spacing-xs) var(--spacing-sm);
          gap: var(--spacing-xs);

          .batch-check {
            width: 30px;
            height: 30px;
          }

          .item-info {
            .item-name {
              font-size: 0.85rem;
            }

            .item-cost {
              font-size: 0.8rem;
            }
          }

        }
      }

      .empty-state {
        padding: var(--spacing-xl) var(--spacing-md);

        .empty-icon {
          font-size: 2.5rem;
        }

        .empty-text {
          font-size: 0.9rem;
        }
      }
    }

    .panel-footer {
      padding: var(--spacing-sm);
      flex-direction: row;
      align-items: center;
      border-top: none;

      .total-info {
        justify-content: flex-start;
        flex: 1;

        .label {
          font-size: 0.8rem;
        }

        .value {
          font-size: 0.95rem;
        }
      }

      .clear-btn {
        width: auto;
        min-height: 34px;
        padding: 6px var(--spacing-sm);
        font-size: 0.8rem;
      }

      .batch-footer {
        grid-template-columns: 1fr;
        gap: var(--spacing-sm);
      }

      .batch-status {
        justify-content: space-between;
      }

      .batch-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .batch-action {
        min-height: 36px;
        padding: 6px 4px;
        font-size: 0.76rem;
      }
    }
  }
}
</style>
