<script setup lang="ts">
/**
 * 通用分类选择布局组件
 * 抽象了 Selections 和 Background 页面中相似的布局结构
 */

interface Props {
  /** 分类列表 */
  categories: string[];
  /** 当前选中的分类（支持 v-model） */
  modelValue: string;
  /** 分类名称映射函数（可选，用于显示友好名称） */
  categoryNameFormatter?: (name: string) => string;
  /** 禁用的分类列表 */
  disabledCategories?: string[];
  /** 内容区域最大高度 */
  contentMaxHeight?: string;
  /** 左侧导航宽度 */
  sidebarWidth?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  categoryNameFormatter: (name: string) => name,
  disabledCategories: () => [],
  contentMaxHeight: '500px',
  sidebarWidth: '200px',
});

const emit = defineEmits<Emits>();

// 分类选择处理
const handleCategorySelect = (category: string) => {
  if (props.disabledCategories.includes(category)) {
    return;
  }
  emit('update:modelValue', category);
};

const isCategoryDisabled = (category: string) => props.disabledCategories.includes(category);
</script>

<template>
  <div
    class="category-selection-layout"
    :style="{
      '--sidebar-width': sidebarWidth,
      '--content-max-height': contentMaxHeight,
    }"
  >
    <!-- 左侧：分类导航 -->
    <nav class="category-sidebar">
      <div class="category-list">
        <button
          v-for="category in categories"
          :key="category"
          class="category-item"
          :class="{ active: modelValue === category, disabled: isCategoryDisabled(category) }"
          :disabled="isCategoryDisabled(category)"
          @click="handleCategorySelect(category)"
        >
          {{ categoryNameFormatter(category) }}
        </button>

        <!-- 分类项插槽，用于在分类后插入额外内容（如二级分类） -->
        <template v-for="category in categories" :key="`slot-${category}`">
          <slot v-if="modelValue === category" name="sub-category" :category="category" />
        </template>
      </div>
    </nav>

    <!-- 右侧：内容区域 -->
    <div class="content-area">
      <!-- 顶部筛选区域插槽 -->
      <div v-if="$slots.filter" class="filter-area">
        <slot name="filter" />
      </div>

      <!-- 主内容插槽 -->
      <div class="content-main">
        <slot name="content" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.category-selection-layout {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  gap: 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: var(--content-max-height);
  max-height: var(--content-max-height);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

// 左侧分类导航
.category-sidebar {
  background: var(--card-bg);
  border-right: 2px solid var(--border-color-strong);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .category-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-md);
    overflow-y: auto;
    flex: 1;

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

    &.disabled {
      cursor: not-allowed;
      opacity: 0.5;
      background: var(--input-bg);
      border-color: var(--border-color);
      color: var(--text-light);

      &:hover {
        background: var(--input-bg);
        border-color: var(--border-color);
      }
    }
  }
}

// 右侧内容区域
.content-area {
  min-width: 0;
  background: var(--card-bg);
  overflow-y: auto;
  height: 100%;
  display: flex;
  flex-direction: column;

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

.filter-area {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--card-bg);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-bottom: 2px solid var(--border-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.content-main {
  flex: 1;
  overflow-y: auto;
}

// 响应式设计
@media (max-width: 768px) {
  .category-selection-layout {
    display: flex;
    flex-direction: column;
    height: auto;
    max-height: none;
    min-height: 0;
    min-width: 0;
    max-width: 100%;
    border-width: 1px;
    border-radius: var(--radius-md);
  }

  .category-sidebar {
    flex: none;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border-color);

    .category-list {
      flex-direction: row;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs);
      max-width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
      touch-action: pan-x;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .category-item {
      flex: 0 0 auto;
      min-width: 76px;
      max-width: 124px;
      min-height: 38px;
      font-size: 0.8rem;
      padding: 7px var(--spacing-sm);
      line-height: 1.3;
      text-align: center;
      white-space: normal;
      word-break: keep-all;
    }
  }

  .content-area {
    flex: none;
    min-height: 120px;
    overflow: visible;
  }

  .filter-area {
    flex: none;
    padding: 4px var(--spacing-xs);
    border-bottom-width: 1px;
    box-shadow: none;
  }

  .content-main {
    min-height: 120px;
    overflow-y: visible;
    touch-action: pan-y;
  }
}

@media (max-width: 480px) {
  .category-selection-layout {
    height: auto;
    max-height: none;
  }

  .category-sidebar {
    .category-list {
      padding: 4px;
    }

    .category-item {
      font-size: 0.78rem;
      padding: 7px 9px;
      min-height: 38px;
    }
  }
}
</style>
