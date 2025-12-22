<template>
  <div class="chat-room">
    <!-- Messages -->
    <div class="messages-area" ref="messagesContainer">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-emoji">🔍</div>
        <p>No messages yet</p>
        <p class="hint">Type your answer to start</p>
        <p class="format">Example: <code>T1: Blue Eagle</code></p>
      </div>
      <MessageBubble
        v-for="msg in messages"
        :key="msg.id"
        :content="msg.content"
        :sender="msg.sender"
        :timestamp="msg.timestamp"
      />
      <div v-if="isTyping" class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>

    <!-- Input -->
    <div class="input-section">
      <div class="input-area">
        <input
          v-model="inputValue"
          :disabled="isCooldown"
          class="input-field"
          placeholder="T1: your answer"
          @keyup.enter="sendMessage"
        />
        <button :disabled="!inputValue || isCooldown" class="send-btn" @click="sendMessage">📤</button>
      </div>
      <p v-if="isCooldown" class="cooldown-msg">⏱️ Cooldown: {{ cooldownCountdown }}s</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import registry from '../data/registry.json'
import MessageBubble from '../components/ui/MessageBubble.vue'
import { useSaveManager } from '../composables/useSaveManager'
import { useGameEngine } from '../composables/useGameEngine'
import { useNotification } from '../composables/useNotification'

const props = defineProps<{ id: string }>()

const contactId = props.id || 'c1'
const { getMessages, addMessage, getCooldown } = useSaveManager()
const { parseInput } = useGameEngine()
const { show } = useNotification()

const contact = computed(() => registry.find((c: any) => c.id === contactId))
const messages = computed(() => getMessages(contactId))
const inputValue = ref('')
const isTyping = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const cooldownCountdown = ref(0)

const isCooldown = computed(() => {
  const now = Date.now()
  const key = `${contactId}_1`
  const until = getCooldown(key)
  return until && now < until
})

watch(isCooldown, (val) => {
  if (val) {
    const key = `${contactId}_1`
    const until = getCooldown(key)
    updateCooldownTimer()
    const interval = setInterval(() => {
      if (!isCooldown.value) clearInterval(interval)
      updateCooldownTimer()
    }, 500)
  }
})

function updateCooldownTimer() {
  const now = Date.now()
  const key = `${contactId}_1`
  const until = getCooldown(key)
  if (until && now < until) {
    cooldownCountdown.value = Math.ceil((until - now) / 1000)
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

watch(() => messages.value.length, scrollToBottom)

onMounted(() => {
  scrollToBottom()
})

const sendMessage = async () => {
  if (!inputValue.value.trim() || isCooldown.value) return

  const userMsg = inputValue.value.trim()
  addMessage(contactId, {
    id: `msg_user_${Date.now()}`,
    content: userMsg,
    sender: 'user',
    timestamp: Date.now()
  })

  inputValue.value = ''
  isTyping.value = true

  // Simulate typing delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const result = parseInput(contactId, userMsg)
  addMessage(contactId, {
    id: `msg_auto_${Date.now()}`,
    content: result.text,
    sender: 'contact',
    timestamp: Date.now()
  })

  isTyping.value = false

  if (result.status === 'success') {
    show('Puzzle Solved! ✓')
  } else if (result.status === 'locked') {
    show('System Locked - Cooldown Active')
  }

  scrollToBottom()
}
</script>

<style scoped lang="scss">
.chat-room {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #ece5dd;
  overflow: hidden;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.empty-emoji {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0.25rem 0;
  text-align: center;
}

.hint {
  font-size: 0.85rem;
}

.format {
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

code {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.75rem;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-bottom: 0.5rem;

  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #999;
    animation: bounce 1.4s infinite;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes bounce {
  0%,
  80%,
  100% {
    opacity: 0.5;
  }
  40% {
    opacity: 1;
  }
}

.input-section {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid #e0e0e0;
}

.input-area {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  align-items: flex-end;
}

.input-field {
  flex: 1;
  padding: 0.65rem 1rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 0.95rem;
  outline: none;
  background: #f5f5f5;
  transition: border-color 0.2s;
  resize: none;
  max-height: 100px;

  &:focus {
    border-color: #075e54;
    background: #fff;
  }

  &:disabled {
    background: #f0f0f0;
    cursor: not-allowed;
  }
}

.send-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  background: #075e54;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: #064e47;
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}

.cooldown-msg {
  text-align: center;
  color: #e53935;
  font-size: 0.8rem;
  margin: 0;
  padding: 0.5rem 0.75rem;
  background: #ffebee;
}
</style>
