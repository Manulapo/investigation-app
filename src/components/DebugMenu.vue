<template>
  <div class="debug" style="position:fixed; left:8px; bottom:8px; opacity:.6">
    <button @click="reset">Reset Game</button>
  </div>
</template>

<script setup lang="ts">
import { useSaveManager } from '../composables/useSaveManager'
const { resetAll } = useSaveManager()
function reset(){ if(confirm('Reset game and clear localStorage?')) resetAll() }
</script>

<style scoped>
button{ padding:.35rem .5rem; border-radius:6px }
</style>
