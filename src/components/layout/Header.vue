<template>
  <header v-if="showHeader" class="app-header">
    <div class="header-content">
      <router-link v-if="showBack" to="/" class="back-btn">←</router-link>
      <div class="title">{{ config.title }}</div>
      <div class="turn-badge">Level {{ currentTurn }}</div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSaveManager } from '../../composables/useSaveManager'
import { useAppConfig } from '../../composables/useAppConfig'

const route = useRoute()
const { state } = useSaveManager()
const { config } = useAppConfig()
const currentTurn = computed(() => state.currentGlobalTurn)
const showBack = computed(() => route.name === 'chat' || route.name === 'profile')
const showHeader = computed(() => route.name === 'list')
</script>

<style scoped lang="scss">
.app-header {
  background: #333;
  color: white;
  padding: 0.75rem 1rem;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 100%;
}

.back-btn {
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  color: white;
  text-decoration: none;
}

.logo {
  font-size: 1.5rem;
}

.title {
  flex: 1;
  font-weight: 600;
  font-size: 0.95rem;
}

.turn-badge {
  background: rgba(255, 255, 255, 0.3);
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}
</style>
