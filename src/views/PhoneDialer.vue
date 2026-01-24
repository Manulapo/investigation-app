<template>
  <div class="phone-dialer">
    <AppHeader title="Telefono" show-left-button left-icon="fas fa-arrow-left" @left-click="goBack" />

    <!-- Initial Dialer State -->
    <div v-if="gameStore.callStatus === 'idle'" class="dialer-container">
      <div class="phone-icon">
        <i class="fas fa-phone"></i>
      </div>
      <h1>Componi Numero</h1>
      <p>Inserisci il numero da chiamare</p>

      <div class="number-display">
        {{ phoneNumber || '—' }}
      </div>

      <Keypad show-letters action-icon="fas fa-phone" action-button-class="call-btn" :action-disabled="!phoneNumber"
        @digit="addDigit" @clear="deleteDigit" @action="handleMakeCall" />
    </div>

    <!-- Dialing State -->
    <div v-else-if="gameStore.callStatus === 'dialing'" class="dialer-container">
      <div class="phone-icon dialing">
        <i class="fas fa-phone"></i>
      </div>
      <h1>Chiamata in corso...</h1>
      <p class="dialing-number">{{ gameStore.dialedNumber }}</p>

      <div class="spinner"></div>
    </div>

    <!-- Call Rejected State -->
    <div v-else-if="gameStore.callStatus === 'rejected'" class="dialer-container">
      <div class="phone-icon rejected">
        <i class="fas fa-phone-slash"></i>
      </div>
      <h1>{{ gameStore.contactName }}</h1>
      <p>{{ gameStore.contactName }} non risponde</p>

      <button class="back-to-dialer-btn" @click="resetDialer">
        Torna al Dialer
      </button>
    </div>

    <!-- Call Accepted State -->
    <div v-else-if="gameStore.callStatus === 'accepted'" class="dialer-container">
      <div class="phone-icon accepted">
        <i class="fas fa-phone"></i>
      </div>
      <h1>{{ gameStore.contactName }}</h1>
      <p>Chiamata accettata. Reindirizzamento alla chat...</p>

      <div class="spinner"></div>
    </div>

    <!-- Number Not Found State -->
    <div v-else-if="gameStore.callStatus === 'not-found'" class="dialer-container">
      <div class="phone-icon not-found">
        <i class="fas fa-times-circle"></i>
      </div>
      <h1>Numero Inesistente</h1>
      <p>Il numero {{ gameStore.dialedNumber }} non esiste</p>

      <button class="back-to-dialer-btn" @click="resetDialer">
        <i class="fas fa-phone"></i>
        Torna al Dialer
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Keypad from '../components/ui/Keypad.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const gameStore = useGameStore()
const phoneNumber = ref('')

const emit = defineEmits<{
  dial: [number: string]
}>()

// Watch for call accepted status and navigate to chat
watch(() => gameStore.callStatus, (newStatus) => {
  if (newStatus === 'accepted' && gameStore.acceptedContactId) {
    // Wait 2 seconds to show the "Call Accepted" screen, then navigate
    setTimeout(() => {
      router.push({ name: 'chat', params: { id: gameStore.acceptedContactId } })
      // Reset after navigation
      setTimeout(() => {
        resetDialer()
      }, 100)
    }, 2000)
  }
})

function addDigit(digit: number) {
  if (phoneNumber.value.length < 10) {
    phoneNumber.value += digit.toString()
  }
}

function deleteDigit() {
  phoneNumber.value = phoneNumber.value.slice(0, -1)
}

async function handleMakeCall() {
  if (phoneNumber.value) {
    emit('dial', phoneNumber.value)
    await gameStore.makePhoneCall(phoneNumber.value)
  }
}

function resetDialer() {
  gameStore.resetCall()
  phoneNumber.value = ''
}

function goBack() {
  router.back()
}
</script>

<style scoped lang="scss">
.phone-dialer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  z-index: 9999;
}

.dialer-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: white;
  border-radius: 0;
  text-align: center;
  max-width: 100%;
  width: 100%;
}

.phone-icon {
  font-size: 3rem;
  color: #075e54;
  margin-bottom: 1rem;

  &.dialing {
    color: #075e54;
    animation: pulse-icon 1.5s ease-in-out infinite;
  }

  &.accepted {
    color: #25d366;
    animation: pulse-icon 1.5s ease-in-out infinite;
  }

  &.rejected {
    color: #e53935;
  }

  &.not-found {
    color: #ff9800;
  }
}

@keyframes pulse-icon {

  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
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

.dialing-number {
  font-size: 1.3rem;
  letter-spacing: 2px;
  font-weight: 300;
  margin-bottom: 2rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #075e54;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 2rem 0;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.back-to-dialer-btn {
  margin-top: 2rem;
  padding: 0.75rem 2rem;
  background: #075e54;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #064d44;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

.number-display {
  min-height: 2rem;
  font-size: 1.8rem;
  color: #333;
  letter-spacing: 3px;
  margin-bottom: 2rem;
  font-weight: 300;
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

  p {
    margin: 0;
  }
}
</style>