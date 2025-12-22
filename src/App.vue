<template>
  <div id="app">
    <Header />
    <div class="app-container">
      <router-view />
    </div>
    <ToastNotification />
    <DebugMenu />
  </div>
</template>

<script setup lang="ts">
import Header from './components/layout/Header.vue'
import DebugMenu from './components/DebugMenu.vue'
import ToastNotification from './components/ToastNotification.vue'
</script>

<style scoped>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.app-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  width: 100%;
}
</style>
