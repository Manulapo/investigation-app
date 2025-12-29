<template>
  <div class="lock-screen">
    <AppHeader :title="config.title" />
    
    <div class="lock-container">
      <div class="lock-icon">
        <i class="fas fa-lock"></i>
      </div>
      <h1>Inserisci Codice</h1>
      <p>Inserisci il codice di accesso</p>
      <div v-if="error" class="error-msg">{{ error }}</div>

      <div class="pin-display">
        <span v-for="n in 5" :key="n" class="pin-dot" :class="{ filled: pin.length >= n }"></span>
      </div>

      <Keypad 
        action-icon="fas fa-check"
        action-button-class="enter-btn"
        @digit="addDigit"
        @clear="clearPin"
        @action="submitPin"
      />
    </div>

    <div class="copyright">
      <p>&copy; 2025 {{ config.title }}. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppConfig } from '../composables/useAppConfig'
import Keypad from '../components/ui/Keypad.vue'

import AppHeader from '../components/layout/AppHeader.vue'
const router = useRouter()
const { config } = useAppConfig()
const pin = ref('')
const error = ref('')

function addDigit(digit: number) {
  if (pin.value.length < 5) {
    pin.value += digit.toString()
    error.value = ''
  }
}

function clearPin() {
  pin.value = pin.value.slice(0, -1)
  error.value = ''
}

function submitPin() {
  if (pin.value.length !== 5) {
    error.value = 'Il codice deve essere di 5 cifre'
    return
  }

  if (pin.value === config.lockCode) {
    unlockApp()
  } else {
    error.value = 'Codice errato'
    pin.value = ''
  }
}

function unlockApp() {
  localStorage.removeItem('chat_locked')
  localStorage.setItem('has_been_unlocked', 'true')
  router.push('/')
}
</script>

<style scoped lang="scss">
.lock-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.lock-container {
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  text-align: center;
  max-width: 500px;
  width: 90%;
}

.lock-icon {
  font-size: 3rem;
  color: #075e54;
  margin-bottom: 1rem;
}

h1 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

p {
  margin: 0 0 1.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.pin-display {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.pin-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #ddd;
  transition: background 0.2s;
}

.pin-dot.filled {
  background: #075e54;
  border-color: #075e54;
}

.copyright {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.5rem;
  color: #e7e7e7;
  width: 100%;
  text-align: center;
}
</style>