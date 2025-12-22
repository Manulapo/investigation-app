<template>
  <div class="lock-screen">
  <div class="header">
    <h2>{{ config.title }}</h2>
  </div>
    <div class="lock-container">
      <div class="lock-icon">
        <i class="fas fa-lock"></i>
      </div>
      <h1>Inserisci Codice</h1>
      <p>Inserisci il codice di accesso</p>
      <div v-if="error" class="error-msg">{{ error }}</div>

      <div class="pin-display">
        <span v-for="n in 4" :key="n" class="pin-dot" :class="{ filled: pin.length >= n }"></span>
      </div>

      <div class="keypad">
        <button v-for="num in 9" :key="num" class="key-btn" @click="addDigit(num)">
          {{ num }}
        </button>
        <button class="key-btn clear-btn" @click="clearPin">
          <i class="fas fa-backspace"></i>
        </button>
        <button class="key-btn" @click="addDigit(0)">
          0
        </button>
        <button class="key-btn enter-btn" @click="submitPin">
          <i class="fas fa-check"></i>
        </button>
      </div>
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

const router = useRouter()
const { config } = useAppConfig()
const pin = ref('')
const error = ref('')

function addDigit(digit: number) {
  if (pin.value.length < 4) {
    pin.value += digit.toString()
    error.value = ''
  }
}

function clearPin() {
  pin.value = pin.value.slice(0, -1)
  error.value = ''
}

function submitPin() {
  if (pin.value.length !== 4) {
    error.value = 'Il codice deve essere di 4 cifre'
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

.header {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1em;
  top: 0;
  width: 100%;
  color: #333;
  padding: 1rem;
  text-align: center;
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

.keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.75rem;
  margin-bottom: 1rem;
}

.key-btn {
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 50%;
  background: #f5f5f5;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.key-btn:hover {
  background: #e0e0e0;
  transform: scale(1.05);
}

.key-btn:active {
  transform: scale(0.95);
}

.clear-btn {
  background: #e53935;
  color: white;
}

.enter-btn {
  background: #4caf50;
  color: white;
}

.enter-btn:hover {
  background: #45a049;
}

.error-msg {
  color: #f44336;
  font-size: 0.8rem;
  margin-bottom: 1rem;
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