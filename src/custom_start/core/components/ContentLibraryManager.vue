<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import ConfirmModal from './ConfirmModal.vue';
import type { Equipment, Item, Rarity, Skill } from '../types';
import {
  RARITY_OPTIONS,
  getRarityColor,
  getRarityLabel,
} from '../utils/form-options';
import {
  configureLibraryWorldbook,
  createLibraryEntries,
  deleteLibraryEntries,
  downloadContentPack,
  downloadWorldbookEntries,
  getConfiguredLibraryWorldbookName,
  importContentPackFromFile,
  listLibraryEntries,
  syncLibraryStorageFromWorldbook,
  upsertLibraryEntries,
  type LibraryEntry,
  type LibraryItemType,
} from '../utils/custom-library';

type EditableContent = Equipment | Item | Skill;

interface LibraryForm {
  name: string;
  contentType: string;
  cost: number;
  rarity: Rarity;
  tags: string[];
  effect: Record<string, string>;
  description: string;
  quantity: number;
  consume: string;
}

const props = defineProps<{
  type: LibraryItemType;
}>();

const emit = defineEmits<{
  (e: 'library-updated'): void;
}>();

const TYPE_LABELS: Record<LibraryItemType, string> = {
  equipment: '武器',
  skill: '技能',
  item: '道具',
};

const DEFAULT_CONTENT_TYPE: Record<LibraryItemType, string> = {
  equipment: '武器',
  skill: '主动',
  item: '消耗品',
};

const entries = ref<LibraryEntry[]>([]);
const editingEntryId = ref('');
const deleteTarget = ref<LibraryEntry | null>(null);
const worldbookName = ref(getConfiguredLibraryWorldbookName());
const isWorldbookBusy = ref(false);
const tagDraft = ref('');
const effectDraftKey = ref('');
const effectDraftValue = ref('');

const createEmptyForm = (type: LibraryItemType): LibraryForm => ({
  name: '',
  contentType: DEFAULT_CONTENT_TYPE[type],
  cost: 5,
  rarity: 'common',
  tags: [],
  effect: {},
  description: '',
  quantity: 1,
  consume: '',
});

const form = ref<LibraryForm>(createEmptyForm(props.type));

const typeLabel = computed(() => TYPE_LABELS[props.type]);
const isEditing = computed(() => Boolean(editingEntryId.value));
const sortedEntries = computed(() => entries.value);

const refreshEntries = () => {
  entries.value = listLibraryEntries(props.type);
};

const resetForm = () => {
  form.value = createEmptyForm(props.type);
  editingEntryId.value = '';
  tagDraft.value = '';
  effectDraftKey.value = '';
  effectDraftValue.value = '';
};

const normalizeCost = (cost: number) => Math.max(0, Math.round(Number(cost) || 0));
const normalizeQuantity = (quantity: number) => Math.max(1, Math.round(Number(quantity) || 1));

const buildContent = (): EditableContent => {
  const base = {
    name: form.value.name.trim(),
    cost: normalizeCost(form.value.cost),
    type: form.value.contentType.trim(),
    tag: form.value.tags.map(tag => tag.trim()).filter(Boolean),
    rarity: form.value.rarity,
    effect: { ...form.value.effect },
    description: form.value.description.trim() || '自定义内容',
    isCustom: true,
  };

  if (props.type === 'item') {
    return {
      ...base,
      quantity: normalizeQuantity(form.value.quantity),
    } as Item;
  }

  if (props.type === 'skill') {
    return {
      ...base,
      consume: form.value.consume.trim(),
    } as Skill;
  }

  return base as Equipment;
};

const validateForm = () => {
  if (!form.value.name.trim()) {
    toastr.warning(`请输入${typeLabel.value}名称`);
    return false;
  }

  if (!form.value.contentType.trim()) {
    toastr.warning('请输入类型');
    return false;
  }

  return true;
};

const saveContent = () => {
  if (!validateForm()) return;

  const content = buildContent();
  const [entry] = createLibraryEntries([{ type: props.type, item: content }]);

  if (editingEntryId.value && editingEntryId.value !== entry.id) {
    deleteLibraryEntries([editingEntryId.value]);
  }

  upsertLibraryEntries([entry]);
  toastr.success(isEditing.value ? `已更新「${entry.name}」` : `已保存「${entry.name}」`);
  refreshEntries();
  resetForm();
  emit('library-updated');
};

const startEdit = (entry: LibraryEntry) => {
  const item = entry.data as EditableContent;

  form.value = {
    name: item.name || '',
    contentType: item.type || DEFAULT_CONTENT_TYPE[props.type],
    cost: normalizeCost(item.cost),
    rarity: item.rarity || 'common',
    tags: [...(item.tag || [])],
    effect: { ...(item.effect || {}) },
    description: item.description || '',
    quantity: 'quantity' in item ? normalizeQuantity(item.quantity || 1) : 1,
    consume: 'consume' in item ? item.consume || '' : '',
  };
  editingEntryId.value = entry.id;
};

const requestDelete = (entry: LibraryEntry) => {
  deleteTarget.value = entry;
};

const confirmDelete = () => {
  if (!deleteTarget.value) return;

  const deletedCount = deleteLibraryEntries([deleteTarget.value.id]);
  if (deletedCount > 0) {
    toastr.info(`已删除「${deleteTarget.value.name}」`);
  }
  deleteTarget.value = null;
  refreshEntries();
  resetForm();
  emit('library-updated');
};

const cancelDelete = () => {
  deleteTarget.value = null;
};

const addTag = () => {
  const tag = tagDraft.value.trim();
  if (!tag) return;

  if (!form.value.tags.includes(tag)) {
    form.value.tags.push(tag);
  }
  tagDraft.value = '';
};

const removeTag = (tag: string) => {
  form.value.tags = form.value.tags.filter(item => item !== tag);
};

const addEffect = () => {
  const key = effectDraftKey.value.trim();
  const value = effectDraftValue.value.trim();

  if (!key || !value) {
    toastr.warning('效果名和效果内容都需要填写');
    return;
  }

  form.value.effect = {
    ...form.value.effect,
    [key]: value,
  };
  effectDraftKey.value = '';
  effectDraftValue.value = '';
};

const removeEffect = (key: string) => {
  form.value.effect = _.omit(form.value.effect, key);
};

const getEffectRows = (item: EditableContent) => Object.entries(item.effect || {});

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const saveWorldbookName = async () => {
  isWorldbookBusy.value = true;
  try {
    await configureLibraryWorldbook(worldbookName.value);
    worldbookName.value = getConfiguredLibraryWorldbookName();
    refreshEntries();
    emit('library-updated');
  } finally {
    isWorldbookBusy.value = false;
  }
};

const syncWorldbook = async () => {
  if (!worldbookName.value.trim()) {
    toastr.warning('请先填写素材库世界书名称');
    return;
  }

  isWorldbookBusy.value = true;
  try {
    const storage = await syncLibraryStorageFromWorldbook();
    if (!storage) {
      toastr.warning('没有在该世界书中找到自定义内容库条目');
    }
    refreshEntries();
    emit('library-updated');
  } finally {
    isWorldbookBusy.value = false;
  }
};

const exportJson = () => {
  if (entries.value.length === 0) {
    toastr.warning(`当前没有可导出的${typeLabel.value}`);
    return;
  }

  downloadContentPack(entries.value);
};

const exportWorldbookEntries = () => {
  if (entries.value.length === 0) {
    toastr.warning(`当前没有可导出的${typeLabel.value}`);
    return;
  }

  downloadWorldbookEntries(entries.value);
};

const importJson = async () => {
  try {
    const importedCount = await importContentPackFromFile();
    if (importedCount > 0) {
      refreshEntries();
      emit('library-updated');
    }
  } catch (error) {
    if ((error as Error).message !== '用户取消') {
      toastr.error('导入素材失败：JSON 格式不正确');
    }
  }
};

watch(
  () => props.type,
  () => {
    refreshEntries();
    resetForm();
  },
);

onMounted(refreshEntries);
</script>

<template>
  <div class="library-manager">
    <section class="worldbook-section">
      <div class="section-heading">
        <h3><i class="fa-solid fa-book" aria-hidden="true"></i> 素材库世界书</h3>
      </div>
      <div class="worldbook-row">
        <input
          v-model="worldbookName"
          class="text-input"
          type="text"
          placeholder="输入用于存储自定义内容的世界书名称"
        />
        <button class="manager-button primary" :disabled="isWorldbookBusy" @click="saveWorldbookName">
          <i class="fa-solid fa-link" aria-hidden="true"></i>
          连接/保存
        </button>
        <button class="manager-button" :disabled="isWorldbookBusy" @click="syncWorldbook">
          <i class="fa-solid fa-rotate" aria-hidden="true"></i>
          读取世界书
        </button>
      </div>
      <p class="helper-text">
        默认使用 custom_start_database；不会绑定角色世界书、聊天世界书或全局世界书。内容会自动写入该世界书里的隐藏 JSON 条目。
      </p>
    </section>

    <section class="editor-section">
      <div class="section-heading">
        <h3>
          <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
          {{ isEditing ? `编辑${typeLabel}` : `新增${typeLabel}` }}
        </h3>
        <button v-if="isEditing" class="manager-button subtle" @click="resetForm">取消编辑</button>
      </div>

      <div class="form-grid">
        <label class="field">
          <span>{{ typeLabel }}名称</span>
          <input v-model="form.name" class="text-input" type="text" placeholder="例如：月影长剑" />
        </label>
        <label class="field">
          <span>类型</span>
          <input
            v-model="form.contentType"
            class="text-input"
            type="text"
            placeholder="例如：武器 / 主动 / 消耗品"
          />
        </label>
        <label class="field short">
          <span>消耗点数</span>
          <input v-model.number="form.cost" class="text-input" type="number" min="0" />
        </label>
        <label v-if="type === 'item'" class="field short">
          <span>数量</span>
          <input v-model.number="form.quantity" class="text-input" type="number" min="1" max="99" />
        </label>
        <label v-if="type === 'skill'" class="field">
          <span>技能消耗</span>
          <input v-model="form.consume" class="text-input" type="text" placeholder="例如：[动作: 50 SP]" />
        </label>
      </div>

      <div class="field">
        <span>品质</span>
        <div class="rarity-grid">
          <button
            v-for="option in RARITY_OPTIONS"
            :key="option.value"
            class="rarity-button"
            :class="{ active: form.rarity === option.value }"
            :style="{ '--rarity-color': option.color }"
            @click="form.rarity = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="field">
        <span>标签</span>
        <div class="tag-list">
          <button v-for="tag in form.tags" :key="tag" class="tag-chip" @click="removeTag(tag)">
            {{ tag }}
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
        <div class="inline-row">
          <input
            v-model="tagDraft"
            class="text-input"
            type="text"
            placeholder="输入标签后添加"
            @keyup.enter="addTag"
          />
          <button class="manager-button" @click="addTag">添加标签</button>
        </div>
      </div>

      <div class="field">
        <span>效果</span>
        <div class="effect-list">
          <div v-for="([effectKey, effectValue], index) in Object.entries(form.effect)" :key="effectKey" class="effect-row">
            <strong>{{ index + 1 }}. {{ effectKey }}</strong>
            <span>{{ effectValue }}</span>
            <button class="icon-button danger" aria-label="删除效果" @click="removeEffect(effectKey)">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div class="effect-editor">
          <input
            v-model="effectDraftKey"
            class="text-input"
            type="text"
            placeholder="效果名"
            @keyup.enter="addEffect"
          />
          <input
            v-model="effectDraftValue"
            class="text-input"
            type="text"
            placeholder="效果内容"
            @keyup.enter="addEffect"
          />
          <button class="manager-button" @click="addEffect">添加效果</button>
        </div>
      </div>

      <label class="field">
        <span>描述</span>
        <textarea
          v-model="form.description"
          class="text-area"
          rows="3"
          placeholder="描述背景、外观、特殊限制或叙事用途"
        ></textarea>
      </label>

      <div class="form-actions">
        <button class="manager-button subtle" @click="resetForm">清空</button>
        <button class="manager-button primary" @click="saveContent">
          <i class="fa-solid fa-floppy-disk" aria-hidden="true"></i>
          {{ isEditing ? '保存修改' : `保存${typeLabel}` }}
        </button>
      </div>
    </section>

    <section class="list-section">
      <div class="section-heading">
        <h3>
          <i class="fa-solid fa-box-archive" aria-hidden="true"></i>
          DIY内容：{{ typeLabel }} ({{ sortedEntries.length }})
        </h3>
        <div class="list-tools">
          <button class="manager-button" @click="importJson">
            <i class="fa-solid fa-file-import" aria-hidden="true"></i>
            导入JSON
          </button>
          <button class="manager-button" @click="exportJson">
            <i class="fa-solid fa-file-export" aria-hidden="true"></i>
            导出JSON
          </button>
          <button class="manager-button" @click="exportWorldbookEntries">
            <i class="fa-solid fa-book-open" aria-hidden="true"></i>
            导出世界书条目
          </button>
        </div>
      </div>

      <div v-if="sortedEntries.length === 0" class="empty-state">
        <i class="fa-solid fa-inbox" aria-hidden="true"></i>
        <span>还没有保存的{{ typeLabel }}。上方新增后会出现在“玩家DIY内容”分类里。</span>
      </div>

      <div v-else class="library-list">
        <article v-for="entry in sortedEntries" :key="entry.id" class="library-item">
          <div class="item-main">
            <div class="item-title-row">
              <strong class="item-title">{{ entry.name }}</strong>
              <span
                class="rarity-pill"
                :style="{ '--rarity-color': getRarityColor(entry.data.rarity) }"
              >
                {{ getRarityLabel(entry.data.rarity) }}
              </span>
            </div>
            <div class="item-meta">
              <span>{{ entry.data.type || '未分类' }}</span>
              <span>{{ entry.data.cost }} 点</span>
              <span>{{ formatTime(entry.updatedAt) }}</span>
            </div>
            <div v-if="entry.data.tag?.length" class="tag-list compact">
              <span v-for="tag in entry.data.tag" :key="tag" class="tag-chip passive">{{ tag }}</span>
            </div>
            <div v-if="getEffectRows(entry.data).length" class="effect-preview">
              <span v-for="[effectKey, effectValue] in getEffectRows(entry.data)" :key="effectKey">
                <strong>{{ effectKey }}：</strong>{{ effectValue }}
              </span>
            </div>
            <p class="item-description">{{ entry.data.description }}</p>
          </div>
          <div class="item-actions">
            <button class="manager-button" @click="startEdit(entry)">
              <i class="fa-solid fa-pen" aria-hidden="true"></i>
              编辑
            </button>
            <button class="manager-button danger" @click="requestDelete(entry)">
              <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
              删除
            </button>
          </div>
        </article>
      </div>
    </section>

    <ConfirmModal
      :visible="Boolean(deleteTarget)"
      title="确认删除DIY内容"
      :message="`确定要删除「${deleteTarget?.name || ''}」吗？此操作不可撤销。`"
      confirm-text="确认删除"
      cancel-text="取消"
      type="danger"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<style lang="scss" scoped>
.library-manager {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.worldbook-section,
.editor-section,
.list-section {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: rgba(255, 249, 240, 0.58);
  padding: var(--spacing-md);
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);

  h3 {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin: 0;
    color: var(--title-color);
    font-size: 1rem;
    font-family: var(--font-body);
    letter-spacing: 0;

    i {
      color: var(--accent-color);
    }
  }
}

.worldbook-row,
.inline-row,
.effect-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: var(--spacing-sm);
  align-items: center;
}

.inline-row {
  grid-template-columns: minmax(0, 1fr) auto;
}

.effect-editor {
  grid-template-columns: minmax(0, 0.7fr) minmax(0, 1fr) auto;
}

.helper-text {
  margin: var(--spacing-sm) 0 0;
  color: var(--text-light);
  font-size: 0.82rem;
  line-height: 1.5;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-md);

  .short {
    max-width: 180px;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);

  > span {
    color: var(--title-color);
    font-size: 0.88rem;
    font-weight: 700;
  }
}

.text-input,
.text-area {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--input-bg);
  color: var(--text-color);
  font: inherit;
  font-size: 0.9rem;
  padding: var(--spacing-sm);

  &:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.18);
  }
}

.text-area {
  resize: vertical;
}

.rarity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: var(--spacing-xs);
}

.rarity-button,
.manager-button,
.icon-button,
.tag-chip {
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.rarity-button {
  min-height: 34px;
  border: 1px solid var(--border-color);
  background: var(--input-bg);
  color: var(--text-color);
  font-weight: 700;

  &.active {
    border-color: var(--rarity-color);
    background: color-mix(in srgb, var(--rarity-color) 16%, var(--input-bg));
    color: var(--title-color);
    box-shadow: inset 0 -2px 0 var(--rarity-color);
  }
}

.manager-button {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--border-color);
  background: var(--input-bg);
  color: var(--title-color);
  font-size: 0.84rem;
  font-weight: 700;
  padding: 6px var(--spacing-sm);
  white-space: nowrap;

  &:hover:not(:disabled) {
    border-color: var(--accent-color);
    box-shadow: var(--shadow-sm);
  }

  &.primary {
    background: var(--accent-color);
    border-color: var(--accent-color);
    color: var(--primary-bg);
  }

  &.danger {
    color: var(--error-color);
    border-color: rgba(211, 47, 47, 0.35);
    background: rgba(211, 47, 47, 0.06);
  }

  &.subtle {
    background: transparent;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);

  &.compact {
    margin-top: var(--spacing-xs);
  }
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 28px;
  border: 1px solid rgba(212, 175, 55, 0.38);
  background: rgba(212, 175, 55, 0.12);
  color: var(--title-color);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 8px;

  &.passive {
    cursor: default;
  }
}

.effect-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

.effect-row {
  display: grid;
  grid-template-columns: minmax(90px, 0.4fr) minmax(0, 1fr) auto;
  gap: var(--spacing-sm);
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px dashed var(--border-color);
  background: rgba(255, 249, 240, 0.62);

  strong,
  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
}

.icon-button {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-color);
  background: var(--input-bg);
  color: var(--text-light);

  &.danger {
    color: var(--error-color);
  }
}

.form-actions,
.list-tools,
.item-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl) var(--spacing-md);
  border: 1px dashed var(--border-color);
  color: var(--text-light);
  text-align: center;
}

.library-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.library-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--input-bg);
}

.item-main {
  min-width: 0;
}

.item-title-row,
.item-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.item-title {
  color: var(--title-color);
  font-size: 0.95rem;
}

.rarity-pill {
  border: 1px solid var(--rarity-color);
  background: color-mix(in srgb, var(--rarity-color) 12%, var(--input-bg));
  color: var(--title-color);
  border-radius: var(--radius-sm);
  padding: 1px 6px;
  font-size: 0.76rem;
  font-weight: 700;
}

.item-meta {
  margin-top: 3px;
  color: var(--text-light);
  font-size: 0.8rem;

  span:not(:last-child)::after {
    content: '·';
    margin-left: var(--spacing-xs);
  }
}

.effect-preview {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: var(--spacing-xs);
  color: var(--text-color);
  font-size: 0.82rem;
}

.item-description {
  margin: var(--spacing-xs) 0 0;
  color: var(--text-light);
  font-size: 0.84rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .worldbook-row,
  .inline-row,
  .effect-editor,
  .form-grid,
  .library-item {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .list-tools,
  .form-actions,
  .item-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .list-tools {
    grid-template-columns: 1fr;
  }

  .form-grid .short {
    max-width: none;
  }

  .effect-row {
    grid-template-columns: 1fr auto;

    span {
      grid-column: 1 / -1;
    }
  }
}
</style>
