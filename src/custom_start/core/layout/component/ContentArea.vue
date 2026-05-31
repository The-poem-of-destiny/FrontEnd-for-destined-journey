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
    margin: var(--spacing-sm) 0;
    padding: var(--spacing-sm);
    border-radius: var(--radius-md);
    min-height: 320px;
  }
}

@media (max-width: 480px) {
  .content-area {
    padding: var(--spacing-xs);
    border-left: none;
    border-right: none;
  }
}
</style>
