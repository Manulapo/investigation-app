<template>
  <div class="toast-wrap">
    <div v-for="t in toasts" :key="t.id" class="toast">{{ t.text }}</div>
  </div>
</template>

<script setup lang="ts">
import { useNotification } from '../composables/useNotification'
const { getToasts } = useNotification()
const toasts = getToasts()
</script>

<style scoped lang="scss">
.toast { background: white; padding:.6rem .75rem; border-radius:6px; box-shadow:0 6px 18px rgba(0,0,0,.08); margin-bottom:.5rem }
</style>
