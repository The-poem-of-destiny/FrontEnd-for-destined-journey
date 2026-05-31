<script setup lang="ts">
interface Props {
  visible: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  save: [];
  skip: [];
  cancel: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="confirm-overlay" @click.self="emit('cancel')">
      <div class="confirm-dialog">
        <div class="confirm-header">
          <i class="fa-solid fa-bookmark"></i>
          <h3>保存预设</h3>
        </div>
        <div class="confirm-body">
          <p>是否在踏上旅程前保存当前配置为预设？</p>
          <p class="confirm-hint">保存后下次可以快速加载相同配置</p>
        </div>
        <div class="confirm-actions">
          <button class="confirm-button save" @click="emit('save')">
            <i class="fa-solid fa-floppy-disk"></i>
            保存预设
          </button>
          <button class="confirm-button skip" @click="emit('skip')">
            <i class="fa-solid fa-forward"></i>
            不保存
          </button>
          <button class="confirm-button cancel" @click="emit('cancel')">
            <i class="fa-solid fa-xmark"></i>
            取消
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
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.confirm-dialog {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.confirm-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
  border-bottom: 1px solid var(--border-color);

  i {
    font-size: 1.3rem;
    color: var(--accent-color);
  }

  h3 {
    margin: 0;
    font-size: 1.2rem;
    color: var(--title-color);
    font-weight: 700;
  }
}

.confirm-body {
  padding: var(--spacing-lg);
  text-align: center;

  p {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--text-color);
    font-size: 1rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .confirm-hint {
    font-size: 0.9rem;
    color: var(--text-light);
    font-style: italic;
  }
}

.confirm-actions {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
  justify-content: center;
}

.confirm-button {
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

  i {
    font-size: 0.9rem;
  }

  &.save {
    background: linear-gradient(135deg, var(--accent-color) 0%, #b8941f 100%);
    color: white;
    border-color: var(--accent-color);

    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
  }

  &.skip {
    background: linear-gradient(135deg, var(--success-color) 0%, #1b5e20 100%);
    color: white;
    border-color: var(--success-color);

    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
  }

  &.cancel {
    background: var(--card-bg);
    color: var(--text-color);
    border-color: var(--border-color);

    &:hover {
      background: var(--button-bg);
    }
  }
}
</style>
