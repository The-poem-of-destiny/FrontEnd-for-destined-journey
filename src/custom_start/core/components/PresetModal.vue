<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useCharacterStore } from '../store/character';
import { useCustomContentStore } from '../store/customContent';
import {
  applyPresetToStore,
  countConflicts,
  createPresetFromStore,
  deletePreset,
  exportAllPresets,
  exportPreset,
  formatPresetTime,
  importPresets,
  isPresetNameExists,
  listPresets,
  parsePresetFile,
  readFileFromInput,
  savePreset,
  type CharacterPreset,
} from '../utils/preset-manager';
import { scrollToIframe } from '../utils/scroll';

const props = defineProps<{
  visible: boolean;
  mode?: 'manage' | 'load'; // manage: 完整管理模式，load: 仅加载模式（用于初始化询问）
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'loaded', preset: CharacterPreset): void;
  (e: 'saved', preset: CharacterPreset): void;
}>();

const characterStore = useCharacterStore();
const customContentStore = useCustomContentStore();

// 预设列表
const presetList = ref<CharacterPreset[]>([]);

// 新预设名称
const newPresetName = ref('');

// 当前选中的预设（用于确认删除）
const presetToDelete = ref<string | null>(null);

// 刷新预设列表
const refreshPresetList = () => {
  presetList.value = listPresets();
};

// 监听弹窗显示状态
watch(
  () => props.visible,
  visible => {
    if (visible) {
      refreshPresetList();
      newPresetName.value = '';
      presetToDelete.value = null;
      scrollToIframe();
    }
  },
);

// 组件挂载时刷新列表
onMounted(() => {
  if (props.visible) {
    refreshPresetList();
    scrollToIframe();
  }
});

// 保存当前配置为预设
const handleSavePreset = () => {
  const name = newPresetName.value.trim();
  if (!name) {
    toastr.warning('请输入预设名称');
    return;
  }

  const preset = createPresetFromStore(name, characterStore);
  const exists = isPresetNameExists(name);

  if (exists) {
    // 显示覆盖确认
    presetToDelete.value = null;
    if (presetToOverwrite.value === name) {
      // 二次点击确认覆盖
      savePreset(preset, true);
      newPresetName.value = '';
      presetToOverwrite.value = null;
      refreshPresetList();
      emit('saved', preset);
    } else {
      presetToOverwrite.value = name;
      toastr.info(`预设「${name}」已存在，再次点击保存确认覆盖`);
    }
  } else {
    savePreset(preset, false);
    newPresetName.value = '';
    refreshPresetList();
    emit('saved', preset);
  }
};

// 待覆盖的预设名称
const presetToOverwrite = ref<string | null>(null);

// 加载预设
const handleLoadPreset = (preset: CharacterPreset) => {
  applyPresetToStore(preset, characterStore);
  const isCustomBackground = preset.background?.name === '【自定义开局】';
  const description = isCustomBackground ? (preset.background?.description ?? '') : '';
  customContentStore.updateCustomBackgroundDescription(description);
  emit('loaded', preset);
  emit('close');
};

// 请求删除预设（第一次点击）
const requestDeletePreset = (name: string) => {
  if (presetToDelete.value === name) {
    // 二次点击确认删除
    deletePreset(name);
    presetToDelete.value = null;
    refreshPresetList();
  } else {
    presetToDelete.value = name;
    presetToOverwrite.value = null;
  }
};

// 取消删除
const cancelDelete = () => {
  presetToDelete.value = null;
};

// 关闭弹窗
const handleClose = () => {
  emit('close');
};

// 弹窗标题
const modalTitle = computed(() => {
  return props.mode === 'load' ? '加载预设' : '预设管理';
});

// 是否显示保存区域
const showSaveSection = computed(() => {
  return props.mode !== 'load';
});

// 导入/导出

// 导出单个预设
const handleExportPreset = (preset: CharacterPreset) => {
  exportPreset(preset);
};

// 导出所有预设
const handleExportAll = () => {
  exportAllPresets();
};

// 待确认导入的预设和冲突数
const pendingImportPresets = ref<CharacterPreset[]>([]);
const pendingConflictCount = ref(0);

// 处理导入：读取文件、解析、检测冲突
const handleImport = async () => {
  try {
    const content = await readFileFromInput();
    let data: unknown;

    try {
      data = JSON.parse(content);
    } catch {
      toastr.error('导入失败：文件不是有效的 JSON 格式');
      return;
    }

    const presets = parsePresetFile(data);
    if (!presets) return;

    const conflictNum = countConflicts(presets);

    if (conflictNum === 0) {
      // 无冲突，直接导入
      const { imported } = importPresets(presets, false);
      toastr.success(`成功导入 ${imported} 个预设`);
      refreshPresetList();
    } else {
      // 有冲突，暂存待用户确认
      pendingImportPresets.value = presets;
      pendingConflictCount.value = conflictNum;
    }
  } catch (error: unknown) {
    // 用户取消选择文件不需要提示
    if (error instanceof Error && error.message === '用户取消') return;
    console.error('导入预设失败:', error);
    toastr.error('导入预设失败');
  }
};

// 确认导入（覆盖冲突）
const confirmImportOverwrite = () => {
  const { imported } = importPresets(pendingImportPresets.value, true);
  toastr.success(`成功导入 ${imported} 个预设（已覆盖同名预设）`);
  pendingImportPresets.value = [];
  pendingConflictCount.value = 0;
  refreshPresetList();
};

// 确认导入（跳过冲突）
const confirmImportSkip = () => {
  const { imported, skipped } = importPresets(pendingImportPresets.value, false);
  const messages = [`成功导入 ${imported} 个预设`];
  if (skipped > 0) messages.push(`跳过 ${skipped} 个同名预设`);
  toastr.success(messages.join('，'));
  pendingImportPresets.value = [];
  pendingConflictCount.value = 0;
  refreshPresetList();
};

// 取消导入
const cancelImport = () => {
  pendingImportPresets.value = [];
  pendingConflictCount.value = 0;
};
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container">
        <!-- 标题栏 -->
        <div class="modal-header">
          <h2 class="modal-title">{{ modalTitle }}</h2>
          <button class="close-button" title="关闭" @click="handleClose">✕</button>
        </div>
        <!-- 内容区域 -->
        <div class="modal-content">
          <!-- 保存新预设区域 -->
          <div v-if="showSaveSection" class="save-section">
            <h3 class="section-title"><i class="fa-solid fa-floppy-disk"></i> 保存当前配置</h3>
            <div class="save-row">
              <input
                v-model="newPresetName"
                type="text"
                class="preset-input"
                placeholder="输入预设名称..."
                @keyup.enter="handleSavePreset"
              />
              <button
                class="action-button save-button"
                :class="{ confirm: presetToOverwrite === newPresetName.trim() }"
                @click="handleSavePreset"
              >
                <i
                  class="fa-solid"
                  :class="presetToOverwrite === newPresetName.trim() ? 'fa-check' : 'fa-save'"
                ></i>
                {{ presetToOverwrite === newPresetName.trim() ? '确认覆盖' : '保存预设' }}
              </button>
            </div>
          </div>

          <!-- 导入预设区域 -->
          <div v-if="showSaveSection" class="import-section">
            <h3 class="section-title"><i class="fa-solid fa-file-import"></i> 导入预设</h3>
            <div class="import-row">
              <button class="action-button import-button" @click="handleImport">
                <i class="fa-solid fa-upload"></i> 导入预设文件
              </button>
              <span class="import-hint">支持 .json 格式的预设文件</span>
            </div>
          </div>

          <!-- 预设列表 -->
          <div class="list-section">
            <div class="list-header">
              <h3 class="section-title"><i class="fa-solid fa-list"></i> 已保存的预设</h3>
              <button
                v-if="presetList.length > 0 && showSaveSection"
                class="action-button export-all-button"
                @click="handleExportAll"
              >
                <i class="fa-solid fa-file-export"></i> 全部导出
              </button>
            </div>
            <div v-if="presetList.length === 0" class="empty-state">
              <i class="fa-solid fa-inbox empty-icon"></i>
              <p>暂无保存的预设</p>
              <p v-if="showSaveSection" class="hint">在上方输入名称保存当前配置</p>
            </div>
            <div v-else class="preset-list">
              <div
                v-for="preset in presetList"
                :key="preset.name"
                class="preset-item"
                :class="{ 'delete-pending': presetToDelete === preset.name }"
              >
                <div class="preset-main">
                  <div class="preset-info">
                    <span class="preset-name">{{ preset.name }}</span>
                    <span class="preset-time">{{ formatPresetTime(preset.updatedAt) }}</span>
                  </div>
                  <div class="preset-meta">
                    <span class="meta-item"
                      ><i class="fa-solid fa-user"></i>
                      {{ preset.character.name || '未命名' }}</span
                    >
                    <span class="meta-item"
                      ><i class="fa-solid fa-star"></i> Lv.{{ preset.character.level }}</span
                    >
                    <span class="meta-item"
                      ><i class="fa-solid fa-shield"></i> {{ preset.equipments.length }}</span
                    >
                    <span class="meta-item"
                      ><i class="fa-solid fa-wand-magic-sparkles"></i>
                      {{ preset.skills.length }}</span
                    >
                    <span class="meta-item"
                      ><i class="fa-solid fa-heart"></i> {{ preset.partners.length }}</span
                    >
                  </div>
                </div>
                <div class="preset-actions">
                  <template v-if="presetToDelete === preset.name">
                    <button
                      class="action-button confirm-delete"
                      @click="requestDeletePreset(preset.name)"
                    >
                      <i class="fa-solid fa-check"></i> 确认删除
                    </button>
                    <button class="action-button cancel-button" @click="cancelDelete">
                      <i class="fa-solid fa-xmark"></i> 取消
                    </button>
                  </template>
                  <template v-else>
                    <button class="action-button load-button" @click="handleLoadPreset(preset)">
                      <i class="fa-solid fa-download"></i> 加载
                    </button>
                    <button
                      v-if="showSaveSection"
                      class="action-button export-button"
                      @click="handleExportPreset(preset)"
                    >
                      <i class="fa-solid fa-file-export"></i> 导出
                    </button>
                    <button
                      v-if="showSaveSection"
                      class="action-button delete-button"
                      @click="requestDeletePreset(preset.name)"
                    >
                      <i class="fa-solid fa-trash"></i> 删除
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 底部按钮 -->
        <div class="modal-footer">
          <button class="footer-button" @click="handleClose">关闭</button>
        </div>
      </div>
    </div>

    <!-- 导入冲突确认弹窗 -->
    <div
      v-if="pendingImportPresets.length > 0"
      class="modal-overlay conflict-overlay"
      @click.self="cancelImport"
    >
      <div class="modal-container conflict-container">
        <div class="modal-header">
          <h2 class="modal-title"><i class="fa-solid fa-triangle-exclamation"></i> 导入冲突</h2>
          <button class="close-button" title="关闭" @click="cancelImport">✕</button>
        </div>
        <div class="modal-content">
          <p class="conflict-description">
            共 {{ pendingImportPresets.length }} 个预设，其中
            {{ pendingConflictCount }} 个与现有预设同名，请选择处理方式：
          </p>
        </div>
        <div class="modal-footer conflict-footer">
          <button class="footer-button cancel-footer" @click="cancelImport">取消</button>
          <button class="footer-button skip-footer" @click="confirmImportSkip">
            <i class="fa-solid fa-forward"></i> 跳过冲突
          </button>
          <button class="footer-button confirm-footer" @click="confirmImportOverwrite">
            <i class="fa-solid fa-arrows-rotate"></i> 覆盖冲突
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.modal-container {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);

  .modal-title {
    margin: 0;
    font-size: 1.3rem;
    color: var(--title-color);
    font-weight: 700;
    font-family: var(--font-title);
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: var(--text-light);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    transition: var(--transition-fast);

    &:hover {
      background: var(--border-color-light);
      color: var(--error-color);
    }
  }
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

.section-title {
  font-size: 1rem;
  color: var(--title-color);
  margin: 0 0 var(--spacing-md) 0;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  i {
    color: var(--accent-color);
  }
}

.save-section {
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px dashed var(--border-color);
}

.save-row {
  display: flex;
  gap: var(--spacing-sm);

  .preset-input {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 0.95rem;
    background: var(--input-bg);
    color: var(--text-color);
    transition: var(--transition-fast);

    &:focus {
      outline: none;
      border-color: var(--accent-color);
      box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
    }

    &::placeholder {
      color: var(--text-light);
    }
  }
}

// 导入区域样式
.import-section {
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px dashed var(--border-color);
}

.import-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);

  .import-hint {
    font-size: 0.85rem;
    color: var(--text-light);
    font-style: italic;
  }
}

// 列表头部（标题 + 全部导出按钮）
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);

  .section-title {
    margin-bottom: 0;
  }
}

.action-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;

  i {
    font-size: 0.85rem;
  }

  &.save-button {
    background: linear-gradient(135deg, var(--accent-color) 0%, #b8941f 100%);
    color: white;
    border-color: var(--accent-color);

    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    &.confirm {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      border-color: #ff9800;
      animation: pulse 1s infinite;
    }
  }

  &.load-button {
    background: linear-gradient(135deg, var(--success-color) 0%, #2e7d32 100%);
    color: white;
    border-color: var(--success-color);

    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
  }

  &.export-button {
    background: linear-gradient(135deg, #5c6bc0 0%, #3949ab 100%);
    color: white;
    border-color: #5c6bc0;

    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
  }

  &.export-all-button {
    background: linear-gradient(135deg, #5c6bc0 0%, #3949ab 100%);
    color: white;
    border-color: #5c6bc0;
    padding: var(--spacing-xs) var(--spacing-md);
    font-size: 0.85rem;

    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
  }

  &.import-button {
    background: linear-gradient(135deg, #26a69a 0%, #00897b 100%);
    color: white;
    border-color: #26a69a;

    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
  }

  &.delete-button {
    background: var(--card-bg);
    color: var(--error-color);
    border-color: var(--error-color);

    &:hover {
      background: var(--error-color);
      color: white;
    }
  }

  &.confirm-delete {
    background: var(--error-color);
    color: white;
    border-color: var(--error-color);
    animation: pulse 1s infinite;
  }

  &.cancel-button {
    background: var(--card-bg);
    color: var(--text-color);
    border-color: var(--border-color);

    &:hover {
      background: var(--button-bg);
    }
  }

  &.batch-button {
    background: var(--card-bg);
    color: var(--text-color);
    border-color: var(--border-color);
    font-size: 0.85rem;
    padding: var(--spacing-xs) var(--spacing-md);

    &:hover {
      background: var(--button-bg);
      border-color: var(--accent-color);
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-light);

  .empty-icon {
    font-size: 2.5rem;
    margin-bottom: var(--spacing-md);
    opacity: 0.5;
  }

  p {
    margin: 0 0 var(--spacing-xs) 0;
  }

  .hint {
    font-size: 0.85rem;
    font-style: italic;
  }
}

.preset-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.preset-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);

  &:hover {
    border-color: var(--accent-color);
    box-shadow: var(--shadow-sm);
  }

  &.delete-pending {
    border-color: var(--error-color);
    background: rgba(211, 47, 47, 0.05);
  }
}

.preset-main {
  flex: 1;
  min-width: 0;
}

.preset-info {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);

  .preset-name {
    font-weight: 600;
    color: var(--title-color);
    font-size: 1rem;
  }

  .preset-time {
    font-size: 0.8rem;
    color: var(--text-light);
    font-family: var(--font-mono);
  }
}

.preset-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);

  .meta-item {
    font-size: 0.85rem;
    color: var(--text-light);

    i {
      margin-right: 2px;
      color: var(--accent-color);
      opacity: 0.7;
    }
  }
}

.preset-actions {
  display: flex;
  gap: var(--spacing-xs);
  margin-left: var(--spacing-md);
}

.modal-footer {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;

  .footer-button {
    padding: var(--spacing-sm) var(--spacing-xl);
    background: var(--button-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition-fast);
    color: var(--title-color);

    &:hover {
      background: var(--button-hover);
    }
  }
}

// ===================== 冲突弹窗样式 =====================

.conflict-overlay {
  z-index: 10000;
}

.conflict-container {
  max-width: 550px;
}

.conflict-description {
  margin: 0 0 var(--spacing-md) 0;
  font-size: 0.95rem;
  color: var(--text-color);
}

.batch-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px dashed var(--border-color);
}

.conflict-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.conflict-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.conflict-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;

  .conflict-name {
    font-weight: 600;
    color: var(--title-color);
    font-size: 0.95rem;
  }

  .conflict-detail {
    font-size: 0.8rem;
    color: var(--text-light);

    i {
      margin-right: 2px;
    }
  }
}

.conflict-options {
  display: flex;
  gap: var(--spacing-sm);
  margin-left: var(--spacing-md);
}

.conflict-option {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 0.85rem;

  input[type='radio'] {
    margin: 0;
    cursor: pointer;
  }

  .option-label {
    font-weight: 500;

    &.overwrite-label {
      color: #ff9800;
    }

    &.rename-label {
      color: #5c6bc0;
    }

    &.skip-label {
      color: var(--text-light);
    }
  }
}

.no-conflict-hint {
  margin: var(--spacing-md) 0 0 0;
  font-size: 0.9rem;
  color: var(--success-color);

  i {
    margin-right: var(--spacing-xs);
  }
}

.conflict-footer {
  gap: var(--spacing-sm);

  .cancel-footer {
    background: var(--card-bg);
    color: var(--text-color);
    border-color: var(--border-color);

    &:hover {
      background: var(--button-bg);
    }
  }

  .confirm-footer {
    background: linear-gradient(135deg, var(--success-color) 0%, #2e7d32 100%);
    color: white;
    border-color: var(--success-color);

    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
  }
}

// 响应式设计
@media (max-width: 600px) {
  .modal-container {
    width: 95%;
    max-height: 90vh;
  }

  .save-row {
    flex-direction: column;
  }

  .import-row {
    flex-direction: column;
    align-items: stretch;

    .import-hint {
      text-align: center;
    }
  }

  .list-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }

  .preset-item {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm, 8px);
  }

  .preset-actions {
    margin-left: 0;
    justify-content: flex-end;
  }
}
</style>
