<script setup lang="ts">
interface Step {
  title: string;
}

interface Props {
  steps?: Step[];
  step?: number;
}

const props = withDefaults(defineProps<Props>(), {
  steps: () => [],
  step: 1,
});

defineExpose({
  steps: props.steps,
  step: props.step,
});
</script>

<template>
  <div class="steps">
    <div v-for="(item, index) in steps" :key="index" :class="['step', { pass: step >= index + 1 }]">
      <div class="title">{{ item.title }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.steps {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  position: relative;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: var(--border-color-light);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--accent-color);
    border-radius: 2px;

    &:hover {
      background: var(--button-hover);
    }
  }

  .step {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--title-color);
    font-size: 16px;
    background: var(--border-color-light);
    margin-left: -6px;
    clip-path: polygon(15px 0, 100% 0, calc(100% - 15px) 50%, 100% 100%, 15px 100%, 0 50%);
    transition: var(--transition-normal);
    padding: 8px 20px;
    position: relative;

    &:first-child {
      clip-path: polygon(0 0, 100% 0, calc(100% - 15px) 50%, 100% 100%, 0 100%, 0 50%);
      padding-left: 16px;
      margin-left: 0;
    }

    &:last-child {
      clip-path: polygon(15px 0, 100% 0, 100% 50%, 100% 100%, 15px 100%, 0 50%);
      padding-right: 16px;
    }

    .title {
      text-align: center;
      width: 100%;
      line-height: 1.3;
      word-break: keep-all;
      overflow-wrap: break-word;
      padding: 4px 0;
    }
  }

  .pass {
    background: var(--accent-color);
    color: var(--primary-bg);
    font-weight: 600;
  }
}

// 平板设备适配
@media (max-width: 1024px) {
  .steps {
    gap: 2px;

    .step {
      font-size: 14px;
      padding: 6px 16px;

      &:first-child {
        padding-left: 14px;
      }

      &:last-child {
        padding-right: 14px;
      }

      .title {
        font-size: 13px;
        line-height: 1.4;
      }
    }
  }
}

// 移动设备适配
@media (max-width: 640px) {
  .steps {
    flex: none;
    gap: var(--spacing-xs);
    overflow-x: auto;
    padding-bottom: 0;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    .step {
      flex: 0 0 auto;
      min-width: 76px;
      min-height: 32px;
      font-size: 0.75rem;
      padding: 5px 8px;
      margin-left: 0;
      clip-path: none;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);

      &:first-child {
        clip-path: none;
        padding-left: 8px;
        margin-left: 0;
      }

      &:last-child {
        clip-path: none;
        padding-right: 8px;
      }

      .title {
        line-height: 1.25;
      }
    }
  }
}

// 小屏幕设备适配
@media (max-width: 480px) {
  .steps {
    gap: var(--spacing-xs);

    .step {
      min-width: 72px;
      font-size: 0.7rem;
      padding: 5px 7px;
      margin-left: 0;
      clip-path: none;

      &:first-child {
        clip-path: none;
        padding-left: 7px;
        margin-left: 0;
      }

      &:last-child {
        clip-path: none;
        padding-right: 7px;
      }

      .title {
        line-height: 1.25;
      }
    }
  }
}
</style>
