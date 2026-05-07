<script setup lang="ts">
import { onMounted } from 'vue';

import { ensureLibraryWorldbook } from './utils/custom-library';

onMounted(() => {
  void ensureLibraryWorldbook();
});
</script>

<template>
  <div class="creator-app">
    <RouterView />
  </div>
</template>

<style lang="scss" scoped>
.creator-app {
  width: 100%;
  max-width: 100%;
  background-color: #f5efe6;
}
</style>
