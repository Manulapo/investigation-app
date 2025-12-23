<template>
  <div class="debug-menu">
    <button @click="reset">🔄</button>
    <button @click="showMockNotification">🔔</button>
    <button @click="autoSolve">✓</button>
  </div>
</template>

<script setup lang="ts">
import { useSaveManager } from '../composables/useSaveManager'
import { useNotification } from '../composables/useNotification'
import { useRouter } from 'vue-router'
const { resetAll } = useSaveManager()
const { show } = useNotification()
const router = useRouter()

function reset(){ if(confirm('Reimpostare il gioco e cancellare localStorage?')) resetAll() }

function showMockNotification() {
  show('Hai ricevuto un nuovo indizio!', 'c2')
}

function autoSolve() {
  const currentRoute = router.currentRoute.value
  
  if (currentRoute.name === 'chat') {
    const contactId = currentRoute.params.id as string
    // Map of contact and their turn answers
    const answers: Record<string, Record<number, string>> = {
      'c1': {
        1: 't1: blue eagle',
        3: 't3: red wolf'
      },
      'c2': {
        2: 't2: detective badge',
        5: 't5: detective badge'
      },
      'c3': {
        4: 't4: ombra'
      }
    }
    
    // Dispatch event - ChatRoom will figure out which turn it is
    const contactAnswers = answers[contactId]
    if (contactAnswers) {
      window.dispatchEvent(new CustomEvent('debug-auto-solve', { detail: { answers: contactAnswers } }))
    }
  }
}
</script>

<style scoped>
.debug-menu {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.8);
  padding: 0.5rem;
  border-radius: 8px;
  z-index: 9999;
}

button {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: none;
  background: #075e54;
  color: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}

button:hover {
  background: #064e47;
}
</style>
