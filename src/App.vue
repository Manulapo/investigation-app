<template>
  <div id="app">
    <Header v-if="$route.name !== 'lock'" />
    <div class="app-container">
      <transition name="dissolve" mode="out-in">
        <router-view />
      </transition>
    </div>
    <ToastNotification v-if="$route.name !== 'lock'" />
    <!-- <DebugMenu /> -->
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Header from './components/layout/Header.vue'
import DebugMenu from './components/DebugMenu.vue'
import ToastNotification from './components/ToastNotification.vue'

const router = useRouter()
const route = useRoute()



function checkLock() {
  const isLocked = localStorage.getItem('chat_locked') === 'true'
  const isOnLockScreen = route.name === 'lock'

  if (isLocked) {
    if (!isOnLockScreen) {
      router.replace('/lock')
    }
  } else {
    if (isOnLockScreen) {
      router.replace('/')
    }
  }
}

onMounted(() => {
  // Initialize lock state - default to locked if not set
  if (localStorage.getItem('chat_locked') === null) {
    localStorage.setItem('chat_locked', 'true')
  }
  checkLock()
})

// Watch for route changes
router.afterEach(() => {
  checkLock()
})
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

/* Dissolve transition */
.dissolve-enter-active,
.dissolve-leave-active {
  transition: opacity 0.4s ease;
}

.dissolve-enter-from,
.dissolve-leave-to {
  opacity: 0;
}
</style>
