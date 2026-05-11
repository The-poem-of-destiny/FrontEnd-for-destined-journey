<script setup lang="ts">
interface Props {
  transitionName: string;
}

defineProps<Props>();
</script>

<template>
  <div class="content-area">
    <router-view v-slot="{ Component, route: slotRoute }">
      <transition :name="transitionName" mode="out-in">
        <component :is="Component" :key="slotRoute.path" />
      </transition>
    </router-view>
  </div>
</template>

<style lang="scss" scoped>
.content-area {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: var(--spacing-md) 0;
  padding: var(--spacing-md);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
  min-height: 400px;
}

// 向左滑动过渡（前进）
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease-out;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

// 向右滑动过渡（后退）
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease-out;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@media (max-width: 768px) {
  .content-area {
    flex: 1 1 0;
    min-height: 0;
    margin: 0;
    padding: var(--spacing-xs);
    border-radius: var(--radius-md);
    box-shadow: none;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  :deep(.basic-info),
  :deep(.selections),
  :deep(.background-page),
  :deep(.confirm-page) {
    min-height: 0;
  }
}
</style>
