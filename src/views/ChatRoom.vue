<template>
  <div class="chat-room">
    <!-- Chat Header -->
    <div class="chat-header">
      <router-link to="/" class="back-btn">←</router-link>
      <router-link :to="`/profile/${contactId}`" class="contact-info">
        <img :src="contact?.avatar" :alt="contact?.name" class="avatar" />
        <div class="contact-details">
          <div class="contact-name">{{ contact?.name }}</div>
          <div class="contact-status">Online</div>
        </div>
      </router-link>
    </div>

    <!-- Messages -->
    <div class="messages-area" ref="messagesContainer">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-emoji"><i class="fas fa-search"></i></div>
        <p>Ancora nessun messaggio</p>
        <p class="hint">Digita la tua risposta per iniziare</p>
        <p class="format">Esempio: <code>T1: Aquila Blu</code></p>
      </div>
      <MessageBubble
        v-for="msg in messages"
        :key="msg.id"
        :content="msg.content"
        :sender="msg.sender"
        :timestamp="msg.timestamp"
        :media="msg.media"
        @openFullscreen="openFullscreen"
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
          placeholder="T1: la tua risposta"
          @keyup.enter="sendMessage"
        />
        <button :disabled="!inputValue || isCooldown" class="send-btn" @click="sendMessage"><i class="fas fa-paper-plane"></i></button>
      </div>
      <p v-if="isCooldown" class="cooldown-msg">⏱️ Raffreddamento: {{ cooldownCountdown }}s</p>
    </div>

    <!-- Fullscreen Media Modal -->
    <div v-if="fullscreenMedia" class="fullscreen-modal" @click="closeFullscreen">
      <div class="fullscreen-content">
        <img v-if="fullscreenMedia.type === 'image'" :src="fullscreenMedia.src" :alt="fullscreenMedia.alt || 'Media'" class="fullscreen-image" />
        <video v-else-if="fullscreenMedia.type === 'video'" :src="fullscreenMedia.src" controls class="fullscreen-video"></video>
        <button class="close-btn" @click="closeFullscreen">×</button>
      </div>
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

const contactId = computed(() => props.id || 'c1')
const { state, getMessages, addMessage, isLocked, getLockedUntil, setPreQuestionShown, isPreQuestionShown } = useSaveManager()
const { parseInput } = useGameEngine()
const { show } = useNotification()

// Function to determine the current turn for a contact
function getCurrentTurnForContact(contactId: string): number {
  const messages = getMessages(contactId)
  let highestCompletedTurn = 0
  
  // Find all success messages and extract turn numbers
  messages.forEach((message: any) => {
    if (message.id?.startsWith('msg_turn') && message.id?.endsWith('_success')) {
      // Extract turn number from message ID like "msg_turn1_success"
      const match = message.id.match(/msg_turn(\d+)_success/)
      if (match) {
        const turnNumber = parseInt(match[1])
        highestCompletedTurn = Math.max(highestCompletedTurn, turnNumber)
      }
    }
  })
  
  const nextTurn = highestCompletedTurn + 1
  // Return the max of global turn and next turn to ensure progression
  return Math.max(state.currentGlobalTurn, nextTurn)
}

const contact = computed(() => registry.find((c: any) => c.id === contactId.value))
const messages = computed(() => getMessages(contactId.value))
const currentTurn = computed(() => getCurrentTurnForContact(contactId.value))
const fullscreenMedia = ref<any>(null)

// Helper function to add messages with delay
let messageDelayCounter = 0
const addDelayedMessage = (contactId: string, messageData: any, delaySeconds: number = 2) => {
  const addMsg = () => {
    addMessage(contactId, {
      ...messageData,
      timestamp: Date.now()
    })
  }
  if (delaySeconds === 0) {
    addMsg()
  } else {
    setTimeout(addMsg, delaySeconds * 1000)
  }
}

// Load contact data and add initial message if chat is empty
const contactData = ref<any>(null)
const loadContactData = async () => {
  try {
    const contactFile = contact.value?.file
    if (contactFile) {
      // Import the JSON file dynamically
      const module = await import(`../data/contacts/${contactFile}.json`)
      contactData.value = module.default
      
      // Add initial message if chat is empty
      if (messages.value.length === 0) {
        messageDelayCounter = 0
        if (contactData.value.initialMessage) {
          addDelayedMessage(contactId.value, {
            id: `msg_initial_${contactId.value}`,
            content: contactData.value.initialMessage,
            sender: 'contact'
          }, 0) // No delay for first message
          messageDelayCounter++
        }
      }
      
      // Determine current turn for this contact and trigger appropriate puzzle
      const currentTurn = getCurrentTurnForContact(contactId.value)
      const nextPuzzle = contactData.value.puzzles?.find((p: any) => p.turnId === currentTurn)
      
      if (nextPuzzle?.preQuestion && !isPreQuestionShown(`${contactId.value}_${currentTurn}`)) {
        addDelayedMessage(contactId.value, {
          id: `msg_prequestion_${contactId.value}_${currentTurn}`,
          content: nextPuzzle.preQuestion,
          sender: 'contact'
        }, messages.value.length === 0 ? messageDelayCounter * 2 : 0)
        if (messages.value.length === 0) messageDelayCounter++
        // Mark preQuestion as shown so it doesn't show again
        setPreQuestionShown(`${contactId.value}_${currentTurn}`, true)
      }
    }
  } catch (error) {
    console.error('Error loading contact data:', error)
  }
}

const findMedia = (mediaId: string) => {
  return contactData.value?.media?.find((m: any) => m.id === mediaId)
}

const inputValue = ref('')
const isTyping = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const cooldownCountdown = ref(0)
const reactiveTimer = ref(0)

const isCooldown = computed(() => {
  // Include reactiveTimer to make this computed property reactive
  reactiveTimer.value
  const key = `${contactId.value}_${currentTurn.value}`
  const status = state.puzzleStatus[key]
  if (!status || !status.lockedUntil) return false
  return Date.now() < status.lockedUntil
})

const isMessageSending = ref(false)

watch(isCooldown, (val) => {
  if (val) {
    updateCooldownTimer()
    const interval = setInterval(() => {
      reactiveTimer.value = Date.now()
      if (!isCooldown.value) {
        clearInterval(interval)
        cooldownCountdown.value = 0
      } else {
        updateCooldownTimer()
      }
    }, 100)
  } else {
    cooldownCountdown.value = 0
  }
})

watch(currentTurn, (newTurn) => {
  // Only show preQuestion from watcher if NOT in a message send flow
  // Message send flow handles preQuestion with proper timing
  if (isMessageSending.value) return
  
  if (contactData.value && messages.value.length > 0) {
    const nextPuzzle = contactData.value.puzzles?.find((p: any) => p.turnId === newTurn)
    if (nextPuzzle?.preQuestion && !isPreQuestionShown(`${contactId.value}_${newTurn}`)) {
      addMessage(contactId.value, {
        id: `msg_prequestion_${contactId.value}_${newTurn}`,
        content: nextPuzzle.preQuestion,
        sender: 'contact',
        timestamp: Date.now()
      })
      setPreQuestionShown(`${contactId.value}_${newTurn}`, true)
    }
  }
})

function updateCooldownTimer() {
  const key = `${contactId.value}_${currentTurn.value}`
  const until = getLockedUntil(key)
  cooldownCountdown.value = until ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function openFullscreen(media: any) {
  fullscreenMedia.value = media
}

function closeFullscreen() {
  fullscreenMedia.value = null
}

watch(() => messages.value.length, scrollToBottom)

watch(contactId, () => {
  loadContactData()
}, { immediate: true })

onMounted(() => {
  scrollToBottom()
  // Initialize cooldown timer if already in cooldown when component mounts
  if (isCooldown.value) {
    updateCooldownTimer()
    const interval = setInterval(() => {
      reactiveTimer.value = Date.now()
      if (!isCooldown.value) {
        clearInterval(interval)
        cooldownCountdown.value = 0
      } else {
        updateCooldownTimer()
      }
    }, 100)
  }
})

const sendMessage = async () => {
  if (!inputValue.value.trim() || isCooldown.value) return

  const userMsg = inputValue.value.trim()
  addMessage(contactId.value, {
    id: `msg_user_${Date.now()}`,
    content: userMsg,
    sender: 'user',
    timestamp: Date.now()
  })

  inputValue.value = ''
  isTyping.value = true
  isMessageSending.value = true

  // Simulate typing delay (1.5s as specified)
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const result = parseInput(contactId.value, userMsg)
  
  isTyping.value = false
  
  // Add main response immediately after typing
  addMessage(contactId.value, {
    id: result.messageId || `msg_auto_${Date.now()}`,
    content: result.text,
    sender: 'contact',
    timestamp: Date.now()
  })

  // Reset delay counter for response sequence
  messageDelayCounter = 0
  messageDelayCounter++

  // Add evidence text if present
  if (result.evidenceText) {
    addDelayedMessage(contactId.value, {
      id: `msg_evidence_${Date.now()}`,
      content: result.evidenceText,
      sender: 'contact'
    }, messageDelayCounter * 2)
    messageDelayCounter++
  }

  // Add media evidence if present
  if (result.mediaId) {
    const media = findMedia(result.mediaId)
    if (media) {
      addDelayedMessage(contactId.value, {
        id: `msg_media_${Date.now()}`,
        content: '',
        sender: 'contact',
        media: {
          type: media.type,
          src: media.src,
          alt: media.alt || 'Evidence'
        }
      }, messageDelayCounter * 2)
      messageDelayCounter++
    }
  }
  
  // Calculate total delay for all messages to complete
  const totalMessageDelay = messageDelayCounter * 2 * 1000
  
  // Turn off typing after the last message
  setTimeout(() => {
    isTyping.value = false
  }, totalMessageDelay)

  if (result.status === 'success') {
    // Show notification after all evidence messages
    if (result.showNotification && result.notificationContact && result.notificationMessage) {
      setTimeout(() => {
        show(result.notificationMessage, result.notificationContact)
      }, totalMessageDelay + 500)
    }
    
    // Show preQuestion for next turn if it exists
    setTimeout(() => {
      const nextTurnData = contactData.value?.puzzles?.find((p: any) => p.turnId === currentTurn.value)
      if (nextTurnData?.preQuestion && !isPreQuestionShown(`${contactId.value}_${currentTurn.value}`)) {
        addMessage(contactId.value, {
          id: `msg_prequestion_${contactId.value}_${currentTurn.value}`,
          content: nextTurnData.preQuestion,
          sender: 'contact',
          timestamp: Date.now()
        })
        setPreQuestionShown(`${contactId.value}_${currentTurn.value}`, true)
      }
      isMessageSending.value = false
    }, totalMessageDelay + 1500)
  } else if (result.status === 'locked') {
    show('🔒 Sistema Bloccato - Raffreddamento Attivo')
    isMessageSending.value = false
  } else {
    isMessageSending.value = false
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

.chat-header {
  background: #075e54;
  color: white;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.back-btn {
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  color: white;
  text-decoration: none;
}

.contact-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: white;
  flex: 1;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.contact-details {
  flex: 1;
}

.contact-name {
  font-weight: 600;
  font-size: 1rem;
}

.contact-status {
  font-size: 0.8rem;
  opacity: 0.8;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.messages-area::-webkit-scrollbar {
  display: none;
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

.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: pointer;
}

.fullscreen-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.fullscreen-image, .fullscreen-video {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
