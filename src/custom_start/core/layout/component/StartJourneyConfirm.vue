<script setup lang="ts">
interface Props {
  visible: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  generate: [];
  wait: [];
  cancel: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="start-overlay" @click.self="emit('cancel')">
      <div class="start-dialog">
        <div class="start-header">
          <i class="fa-solid fa-route"></i>
          <h3>开始旅程</h3>
        </div>
        <div class="start-body">
          <p>选择开局消息创建后的处理方式。</p>
        </div>
        <div class="start-actions">
          <button class="start-button generate" @click="emit('generate')">
            <i class="fa-solid fa-play"></i>
            立即生成
          </button>
          <button class="start-button wait" @click="emit('wait')">
            <i class="fa-solid fa-message"></i>
            只创建消息
          </button>
          <button class="start-button cancel" @click="emit('cancel')">
            <i class="fa-solid fa-xmark"></i>
            取消
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.start-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.start-dialog {
  width: 90%;
  max-width: 430px;
  overflow: hidden;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.start-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
  border-bottom: 1px solid var(--border-color);

  i {
    color: var(--accent-color);
    font-size: 1.3rem;
  }

  h3 {
    margin: 0;
    color: var(--title-color);
    font-size: 1.2rem;
    font-weight: 700;
  }
}

.start-body {
  padding: var(--spacing-lg);
  text-align: center;

  p {
    margin: 0;
    color: var(--text-color);
    font-size: 1rem;
  }
}

.start-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
}

.start-button {
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

  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  &.generate {
    color: white;
    background: linear-gradient(135deg, var(--success-color) 0%, #2e7d32 100%);
    border-color: var(--success-color);
  }

  &.wait {
    color: white;
    background: linear-gradient(135deg, var(--accent-color) 0%, #b8941f 100%);
    border-color: var(--accent-color);
  }

  &.cancel {
    color: var(--text-color);
    background: var(--card-bg);

    &:hover {
      background: var(--button-bg);
    }
  }
}

@media (max-width: 480px) {
  .start-actions {
    flex-direction: column;
  }

  .start-button {
    justify-content: center;
    width: 100%;
  }
}
</style>
