<script setup lang="ts">
import { computed, watch } from 'vue';
import { scrollToIframe } from '../utils/scroll';

interface Props {
  visible: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

interface Emits {
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: '确认操作',
  confirmText: '确认',
  cancelText: '取消',
  type: 'warning',
});

const emit = defineEmits<Emits>();

// 监听弹窗显示状态，显示时滚动到 iframe
watch(
  () => props.visible,
  visible => {
    if (visible) {
      scrollToIframe();
    }
  },
);

// 根据类型获取图标类名
const typeIconClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'fa-solid fa-triangle-exclamation';
    case 'info':
      return 'fa-solid fa-circle-info';
    case 'warning':
    default:
      return 'fa-solid fa-circle-question';
  }
});

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="confirm-overlay" @click.self="handleCancel">
      <div class="confirm-container" :class="`type-${type}`">
        <!-- 标题栏 -->
        <div class="confirm-header">
          <i class="confirm-icon" :class="typeIconClass"></i>
          <h3 class="confirm-title">{{ title }}</h3>
        </div>

        <!-- 内容区域 -->
        <div class="confirm-content">
          <p class="confirm-message">{{ message }}</p>
        </div>

        <!-- 按钮区域 -->
        <div class="confirm-actions">
          <button class="btn-cancel" @click="handleCancel">
            <i class="fa-solid fa-xmark"></i>
            {{ cancelText }}
          </button>
          <button class="btn-confirm" :class="`btn-${type}`" @click="handleConfirm">
            <i class="fa-solid fa-check"></i>
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(2px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.confirm-container {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 2px solid var(--border-color);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  animation: slideIn 0.2s ease-out;

  &.type-warning {
    border-color: var(--accent-color);
  }

  &.type-danger {
    border-color: var(--error-color);
  }

  &.type-info {
    border-color: var(--info-color, #2196f3);
  }
}

.confirm-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
  border-bottom: 1px solid var(--border-color);

  .type-danger & {
    background: linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(211, 47, 47, 0.05) 100%);
  }

  .type-info & {
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%);
  }

  .confirm-icon {
    font-size: 1.3rem;

    .type-warning & {
      color: var(--accent-color);
    }

    .type-danger & {
      color: var(--error-color);
    }

    .type-info & {
      color: var(--info-color, #2196f3);
    }
  }

  .confirm-title {
    margin: 0;
    font-size: 1.1rem;
    color: var(--title-color);
    font-weight: 700;
  }
}

.confirm-content {
  padding: var(--spacing-lg);

  .confirm-message {
    margin: 0;
    font-size: 0.95rem;
    color: var(--text-color);
    line-height: 1.6;
  }
}

.confirm-actions {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all var(--transition-fast);
  min-width: 80px;

  i {
    font-size: 0.85rem;
  }
}

.btn-cancel {
  background: var(--input-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);

  &:hover {
    background: var(--card-bg);
    border-color: var(--border-color-strong);
  }
}

.btn-confirm {
  color: white;

  &.btn-warning {
    background: var(--accent-color);

    &:hover {
      background: #c9a842;
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
  }

  &.btn-danger {
    background: var(--error-color);

    &:hover {
      background: #c62828;
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
  }

  &.btn-info {
    background: var(--info-color, #2196f3);

    &:hover {
      background: #1976d2;
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
  }
}

// 响应式设计
@media (max-width: 480px) {
  .confirm-container {
    width: 95%;
  }

  .confirm-actions {
    flex-direction: column-reverse;

    .btn-cancel,
    .btn-confirm {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>
