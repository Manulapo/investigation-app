<template>
  <div v-if="isDev" class="debug-menu">
    <button @click="showMenu = !showMenu"><i class="fas fa-eye"/></button>
    <div v-if="showMenu" class="debug-menu-inner">
      <button @click="reset">🔄</button>
      <button @click="showMockNotification">🔔</button>
      <button @click="autoSolve">✓</button>
      <div class="level-counter">
        <button @click="decrementLevel">−</button>
        <span class="level-display">Level {{ currentLevel }}</span>
        <button @click="incrementLevel">+</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSaveManager } from '../composables/useSaveManager'
import { useNotification } from '../composables/useNotification'
import { useRouter } from 'vue-router'
const { resetAll, state, setLevel, resetChatHistories } = useSaveManager()
const { show } = useNotification()
const router = useRouter()
const showMenu = ref(false)
const isDev = import.meta.env.DEV 

const currentLevel = computed(() => state.currentGlobalTurn)

function reset(){ if(confirm('Reimpostare il gioco e cancellare localStorage?')) resetAll() }

function incrementLevel() {
  setLevel(currentLevel.value + 1)
  resetChatHistories()
}

function decrementLevel() {
  if (currentLevel.value > 1) {
    setLevel(currentLevel.value - 1)
    resetChatHistories()
  }
}

function showMockNotification() {
  show('Hai ricevuto un nuovo indizio!', 'robert')
}

function autoSolve() {
  const currentRoute = router.currentRoute.value
  
  if (currentRoute.name === 'chat') {
    const contactId = currentRoute.params.id as string
    // Map of contact and their turn answers
    const answers: Record<string, Record<number, string>> = {
      'robert': {
        1: 't1: jerry thompson',
        3: 't3: william thorne',
        6: 't6: 50'
      },
      'martha': {
        2: 't2: 1368'
      },
      'loc': {
        4: 't4: 17',
        5: 't5: dissanguamento',
        8: 't8: arthur'
      },
      'marcus': {
        7: 't7: si'
      },
      'mina': {
        7: 't7: si'
      },
      'edonispharma': {
        9: 't9: 12165'
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
  bottom: 50% ;
  left: 40px;
  display: flex;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.8);
  padding: 0.5rem;
  border-radius: 8px;
  z-index: 9999;
}

.debug-menu-inner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.level-counter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem;
  border-radius: 6px;
}

.level-counter button {
  padding: 0.25rem 0.5rem;
  font-size: 1rem;
  font-weight: bold;
  min-width: 30px;
}

.level-display {
  color: white;
  font-size: 0.85rem;
  padding: 0 0.5rem;
  white-space: nowrap;
}
</style>
