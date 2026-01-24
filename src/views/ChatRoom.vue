<template>
  <div class="chat-room">
    <!-- Chat Header -->
    <AppHeader show-left-button left-icon="fas fa-chevron-left" show-hint-button :hint-enabled="isHintAvailable"
      @left-click="goBack" @hint-click="requestHint">
      <router-link :to="`/profile/${contactId}`" class="contact-info">
        <Avatar :src="contact?.avatar!" :alt="contact?.name" class="avatar" />
        <div class="contact-details">
          <div class="contact-name">{{ contact?.name }}</div>
          <div class="contact-status">{{ isTyping ? 'sta scrivendo...' : 'Online' }}</div>
        </div>
      </router-link>
    </AppHeader>

    <!-- Messages -->
    <div class="messages-area" ref="messagesContainer">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-emoji"><i class="fas fa-search"></i></div>
        <p>Ancora nessun messaggio</p>
        <p class="hint">Digita la tua risposta per iniziare</p>
        <p class="format">Esempio: <code>T1: Blue eagle</code></p>
      </div>
      <MessageBubble v-for="msg in messages" :key="msg.id" :content="msg.content" :sender="msg.sender"
        :timestamp="msg.timestamp" :media="msg.media" @openFullscreen="openFullscreen" />
    </div>

    <!-- Input -->
    <ChatInput :is-cooldown="isCooldown" :cooldown-countdown="cooldownCountdown" @send="handleSendMessage" />

    <!-- Fullscreen Media Modal -->
    <FullscreenMediaModal :media="uiStore.fullscreenMedia" :image-element="null"
      :image-transform="uiStore.imageTransform" :zoom-level="uiStore.zoomLevel" @close="closeFullscreen"
      @zoom-in="zoomIn" @zoom-out="zoomOut" @reset-zoom="resetZoom" @start-drag="startDrag" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/layout/AppHeader.vue'
import Avatar from '../components/ui/Avatar.vue'
import ChatInput from '../components/ui/ChatInput.vue'
import FullscreenMediaModal from '../components/ui/FullscreenMediaModal.vue'
import MessageBubble from '../components/ui/MessageBubble.vue'
import { useChatStore } from '../stores/chatStore'
import { useGameStore } from '../stores/gameStore'
import { useDocumentsStore } from '../stores/documentsStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useUIStore } from '../stores/uiStore'
import registry from '../data/registry.json'


const props = defineProps<{ id: string }>()

const router = useRouter()
const chatStore = useChatStore()
const gameStore = useGameStore()
const documentsStore = useDocumentsStore()
const narrativeStore = useNarrativeStore()
const uiStore = useUIStore()

const contactData = ref<any>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const cooldownCountdown = ref(0)
const reactiveTimer = ref(0)

const contactId = computed(() => props.id)
const contact = computed(() => registry.find((c: any) => c.id === contactId.value) || null)
const messages = computed(() => chatStore.getMessages(contactId.value))
const currentTurn = computed(() => narrativeStore.getCurrentTurnForContact(contactId.value))
const isTyping = computed(() => chatStore.isTyping(contactId.value))
const isMessageSending = computed(() => chatStore.isMessageSending(contactId.value))

const currentPuzzle = computed(() => {
  if (!contactData.value) return null
  return narrativeStore.getPuzzleForTurn(contactId.value, currentTurn.value)
})

const isHintAvailable = computed(() => {
  if (!currentPuzzle.value || !currentPuzzle.value.hints || currentPuzzle.value.hints.length === 0) {
    return false
  }
  const puzzleKey = `${contactId.value}_${currentTurn.value}`
  const usedHints = gameStore.getUsedHintsForPuzzle(puzzleKey)
  return usedHints < currentPuzzle.value.hints.length
})

const isCooldown = computed(() => {
  reactiveTimer.value
  const key = `${contactId.value}_${currentTurn.value}`
  const status = gameStore.puzzleStatus[key]
  if (!status || !status.lockedUntil) return false
  return Date.now() < status.lockedUntil
})

const requestHint = () => {
  if (!isHintAvailable.value || !currentPuzzle.value) return

  const puzzleKey = `${contactId.value}_${currentTurn.value}`
  const usedHints = gameStore.getUsedHintsForPuzzle(puzzleKey)
  const hintText = currentPuzzle.value.hints?.[usedHints]

  if (hintText) {
    chatStore.addMessage(contactId.value, {
      id: `msg_hint_${puzzleKey}_${usedHints}`,
      content: hintText,
      sender: 'contact',
      timestamp: Date.now()
    })

    gameStore.useHint(puzzleKey)

    chatStore.setTyping(contactId.value, true)
    setTimeout(() => {
      chatStore.setTyping(contactId.value, false)
      scrollToBottom()
    }, 1000)
  }
}

const loadContactData = () => {
  const contactFile = contact.value?.file
  if (!contactFile) return

  contactData.value = narrativeStore.findContactFile(contactId.value)
  if (!contactData.value) return

  // Load messages using chatStore
  chatStore.loadContactMessages(contactId.value)
}

const updateCooldownTimer = () => {
  const key = `${contactId.value}_${currentTurn.value}`
  const until = gameStore.getLockedUntil(key)
  cooldownCountdown.value = until ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const goBack = () => {
  router.push('/')
}

const handleAutoSolve = (event: any) => {
  const answers = event.detail.answers
  const answer = answers[currentTurn.value]
  if (answer) {
    handleSendMessage(answer)
  } else {
    console.warn('No answer found for turn:', currentTurn.value)
  }
}

const handleSendMessage = async (userMsg: string) => {
  if (!userMsg.trim() || isCooldown.value) return

  // Add user message
  chatStore.addMessage(contactId.value, {
    id: `msg_user_${Date.now()}`,
    content: userMsg,
    sender: 'user',
    timestamp: Date.now()
  })

  chatStore.setMessageSending(contactId.value, true)
  chatStore.setTyping(contactId.value, true)

  await new Promise(resolve => setTimeout(resolve, 1500))

  // Validate answer using gameStore
  const result = gameStore.validateAnswer(contactId.value, userMsg)

  // Add main response
  chatStore.addMessage(contactId.value, {
    id: result.messageId || `msg_auto_${Date.now()}`,
    content: result.text,
    sender: 'contact',
    timestamp: Date.now()
  })

  // Queue remaining puzzle response messages
  const totalMessageDelay = chatStore.queuePuzzleResponse(contactId.value, result)

  setTimeout(() => {
    chatStore.setTyping(contactId.value, false)
  }, totalMessageDelay)

  if (result.status === 'success') {
    // Handle success: show notification after messages
    setTimeout(() => {
      if (result.notificationContact && result.notificationMessage) {
        uiStore.showNotification(result.notificationMessage, result.notificationContact)
      }
    }, totalMessageDelay + 2000)

    chatStore.setMessageSending(contactId.value, false)

    // Schedule triggered narratives in other contacts
    if (result.messageId) {
      setTimeout(() => {
        chatStore.scheduleTriggeredNarratives(result.messageId)
      }, totalMessageDelay + 1000)
    }
  } else {
    // Handle failure
    if (result.status === 'locked') {
      uiStore.showNotification('🔒 Sistema Bloccato - Cooldown Attivo')
    }
    chatStore.setMessageSending(contactId.value, false)
  }

  scrollToBottom()
}

// Image viewer methods from UIStore
const openFullscreen = (media: any) => uiStore.openFullscreen(media)
const closeFullscreen = () => uiStore.closeFullscreen()
const zoomIn = () => uiStore.zoomIn()
const zoomOut = () => uiStore.zoomOut()
const resetZoom = () => uiStore.resetZoom()
const startDrag = (e: MouseEvent | TouchEvent) => uiStore.startDrag(e)


watch(() => messages.value.length, scrollToBottom)

watch(contactId, () => {
  loadContactData()
}, { immediate: true })

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
  }
})

watch(currentTurn, (newTurn) => {
  chatStore.handleTurnTransition(contactId.value, newTurn, isMessageSending.value)
})


onMounted(() => {
  scrollToBottom()
  chatStore.markMessagesAsRead(contactId.value)

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

  window.addEventListener('debug-auto-solve', handleAutoSolve)
  uiStore.setupDragListeners()
})

onUnmounted(() => {
  window.removeEventListener('debug-auto-solve', handleAutoSolve)
  uiStore.removeDragListeners()
})


</script>

<style scoped lang="scss">
.chat-room {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background: #ece5dd;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overscroll-behavior: none;
  touch-action: pan-y;
}

.contact-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: white;
  flex: 1;
  margin-left: 3em;
}

.avatar {
  width: 40px !important;
  height: 40px !important;
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
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
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
</style>
