<template>
  <div class="debug" style="position:fixed; right:8px; top:8px; opacity:.6">
    <button @click="reset">Reimposta Gioco</button>
    <button @click="showMockNotification">Test Notifica</button>
  </div>
</template>

<script setup lang="ts">
import { useSaveManager } from '../composables/useSaveManager'
import { useNotification } from '../composables/useNotification'
const { resetAll } = useSaveManager()
const { show } = useNotification()

function reset(){ if(confirm('Reimpostare il gioco e cancellare localStorage?')) resetAll() }

function showMockNotification() {
  show('Hai ricevuto un nuovo indizio!', 'c2')
}
</script>

<style scoped>
button{ padding:.35rem .5rem; border-radius:6px }
</style>
