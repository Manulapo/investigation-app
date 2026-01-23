<template>
  <div id="app">
    <div class="app-container">
      <transition name="dissolve" mode="out-in">
        <router-view />
      </transition>
    </div>

    <!-- PWA Install Button -->
    <transition name="slide-up">
      <div v-if="showInstallButton && !isInstalled" class="install-banner">
        <div class="install-content">
          <i class="fas fa-download"></i>
          <span>Installa l'app per un'esperienza migliore</span>
        </div>
        <button @click="installPWA" class="install-btn">Installa</button>
        <button @click="showInstallButton = false" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </transition>

    <ToastNotification v-if="$route.name !== 'lock' && $route.name !== 'documents'" />
    <DebugMenu />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DebugMenu from './components/DebugMenu.vue'
import ToastNotification from './components/ToastNotification.vue'
import { usePWAInstall } from './composables/usePWAInstall'

const router = useRouter()
const route = useRoute()

// PWA Install
const { showInstallButton, isInstalled, installPWA } = usePWAInstall()



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
  // Initialize lock state - locked only if never unlocked before OR manually locked
  const hasBeenUnlocked = localStorage.getItem('has_been_unlocked') === 'true'
  const isManuallyLocked = localStorage.getItem('chat_locked') === 'true'

  if (!hasBeenUnlocked || isManuallyLocked) {
    localStorage.setItem('chat_locked', 'true')
  } else {
    localStorage.removeItem('chat_locked')
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
  overflow: visible;
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

/* PWA Install Banner */
.install-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #075e54 0%, #128c7e 100%);
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  z-index: 9999;
}

.install-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  font-size: 0.9rem;
}

.install-content i {
  font-size: 1.2rem;
}

.install-btn {
  background: white;
  color: #075e54;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.install-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.install-btn:active {
  transform: scale(0.98);
}

.close-btn {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  font-size: 1.2rem;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.close-btn:hover {
  opacity: 1;
}

/* Slide up animation */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
