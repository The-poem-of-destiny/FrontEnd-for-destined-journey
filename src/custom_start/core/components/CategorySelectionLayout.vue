<script setup lang="ts">
import { useDragScroll } from '../composables';

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
  /** 移动端分类控件形态 */
  mobileMode?: 'tabs' | 'select';
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  categoryNameFormatter: (name: string) => name,
  disabledCategories: () => [],
  contentMaxHeight: '560px',
  sidebarWidth: '200px',
  mobileMode: 'tabs',
});

const emit = defineEmits<Emits>();
const {
  scrollRef: categoryListRef,
  isDragging: isDraggingCategories,
  shouldSuppressClick,
  dragScrollHandlers,
} = useDragScroll();

// 分类选择处理
const handleCategorySelect = (category: string, suppressDragClick = true) => {
  if (suppressDragClick && shouldSuppressClick()) return;

  if (props.disabledCategories.includes(category)) {
    return;
  }
  emit('update:modelValue', category);
};

const handleCategoryChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  handleCategorySelect(target.value, false);
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
    :class="{ 'use-mobile-select': mobileMode === 'select' }"
  >
    <!-- 左侧：分类导航 -->
    <nav class="category-sidebar">
      <div class="category-select-wrap">
        <select
          class="category-select"
          :value="modelValue"
          aria-label="选择分类"
          @change="handleCategoryChange"
        >
          <option
            v-for="category in categories"
            :key="category"
            :value="category"
            :disabled="isCategoryDisabled(category)"
          >
            {{ categoryNameFormatter(category) }}
          </option>
        </select>
      </div>

      <div
        ref="categoryListRef"
        class="category-list drag-scroll-x themed-scrollbar"
        :class="{ dragging: isDraggingCategories }"
        v-on="dragScrollHandlers"
      >
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
    <div class="content-area themed-scrollbar">
      <!-- 顶部筛选区域插槽 -->
      <div v-if="$slots.filter" class="filter-area">
        <slot name="filter" />
      </div>

      <!-- 主内容插槽 -->
      <div class="content-main themed-scrollbar">
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
    cursor: default;
    overscroll-behavior-x: auto;
    touch-action: pan-y;
    user-select: auto;
  }

  .category-select-wrap {
    display: none;
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
  background: var(--card-bg);
  overflow: hidden;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
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
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
}

// 响应式设计
@media (max-width: 768px) {
  .category-selection-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
    height: auto;
    max-height: none;
  }

  .category-sidebar {
    border-right: none;
    border-bottom: 2px solid var(--border-color-strong);
    height: auto;

    .category-list {
      flex-direction: row;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm);
      overflow-x: auto;
      overflow-y: hidden;
      cursor: grab;
      overscroll-behavior-x: contain;
      scroll-snap-type: x proximity;
      touch-action: pan-x;
      user-select: none;

      &.dragging {
        cursor: grabbing;
      }
    }

    .category-select-wrap {
      display: none;
    }

    .category-item {
      flex: 0 0 auto;
      font-size: 0.8rem;
      padding: var(--spacing-xs) var(--spacing-sm);
      min-height: 28px;
      line-height: 1.3;
      scroll-snap-align: start;
      white-space: nowrap;
      word-break: keep-all;
      overflow-wrap: normal;
    }
  }

  .content-area {
    height: min(48vh, 380px);
    min-height: 260px;
    max-height: min(48vh, 380px);
  }

  .category-selection-layout.use-mobile-select {
    .category-list {
      display: none;
    }

    .category-select-wrap {
      display: block;
      padding: var(--spacing-sm);
    }

    .category-select {
      width: 100%;
      min-height: 36px;
      padding: 0 var(--spacing-md);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--input-bg);
      color: var(--title-color);
      font-size: 0.9rem;
      font-weight: 600;
      outline: none;

      &:focus {
        border-color: var(--accent-color);
        box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.16);
      }
    }
  }
}

@media (max-width: 480px) {
  .category-selection-layout {
    border-radius: var(--radius-md);
  }

  .category-sidebar {
    .category-list {
      padding: var(--spacing-xs);
    }

    .category-select-wrap {
      padding: var(--spacing-xs);
    }

    .category-item {
      font-size: 0.75rem;
      min-height: 30px;
      padding: var(--spacing-xs) var(--spacing-sm);
    }
  }

  .content-area {
    height: min(42vh, 320px);
    min-height: 240px;
    max-height: min(42vh, 320px);
  }
}
</style>
