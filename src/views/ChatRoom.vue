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
    <FullscreenMediaModal :media="fullscreenMedia" :image-element="imageElement" :image-transform="imageTransform"
      :zoom-level="zoomLevel" @close="closeFullscreen" @zoom-in="zoomIn" @zoom-out="zoomOut" @reset-zoom="resetZoom"
      @start-drag="startDrag" />
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
import { useContactLoader } from '../composables/useContactLoader'
import { useDocuments } from '../composables/useDocuments'
import { useGameEngine } from '../composables/useGameEngine'
import { useImageViewer } from '../composables/useImageViewer'
import { useMessageQueue } from '../composables/useMessageQueue'
import { useNotification } from '../composables/useNotification'
import { useSaveManager } from '../composables/useSaveManager'
import registry from '../data/registry.json'
import type { MessageData } from '../types'


const props = defineProps<{ id: string }>()

const router = useRouter()
const { state, getMessages, addMessage, isLocked, getLockedUntil, setPreQuestionShown, isPreQuestionShown, markMessagesAsRead, getUsedHintsForPuzzle, useHint, isNarrativeShown, setNarrativeShown } = useSaveManager()
const { parseInput, getNarrativeMessagesForTurnStart, getPuzzleForTurn } = useGameEngine()
const { show } = useNotification()
const { getDocumentById, unlockDocuments } = useDocuments()
const { fullscreenMedia, imageElement, imageTransform, openFullscreen, closeFullscreen, zoomIn, zoomOut, resetZoom, startDrag, zoomLevel } = useImageViewer()


const contactData = ref<any>(null)
const isTyping = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const cooldownCountdown = ref(0)
const reactiveTimer = ref(0)
const isMessageSending = ref(false)

const contactId = computed(() => props.id)
const contact = computed(() => registry.find((c: any) => c.id === contactId.value))
const messages = computed(() => getMessages(contactId.value))
const currentTurn = computed(() => getCurrentTurnForContact(contactId.value))

const currentPuzzle = computed(() => {
  if (!contactData.value) return null
  return getPuzzleForTurn(contactId.value, currentTurn.value)
})

const isHintAvailable = computed(() => {
  if (!currentPuzzle.value || !currentPuzzle.value.hints || currentPuzzle.value.hints.length === 0) {
    return false
  }
  const puzzleKey = `${contactId.value}_${currentTurn.value}`
  const usedHints = getUsedHintsForPuzzle(puzzleKey)
  return usedHints < currentPuzzle.value.hints.length
})

const isCooldown = computed(() => {
  reactiveTimer.value
  const key = `${contactId.value}_${currentTurn.value}`
  const status = state.puzzleStatus[key]
  if (!status || !status.lockedUntil) return false
  return Date.now() < status.lockedUntil
})

function getCurrentTurnForContact(contactId: string): number {
  const messages = getMessages(contactId)
  let highestCompletedTurn = 0

  messages.forEach((message: any) => {
    if (message.id?.startsWith('msg_turn') && message.id?.endsWith('_success')) {
      const match = message.id.match(/msg_turn(\d+)_success/)
      if (match) {
        const turnNumber = parseInt(match[1])
        highestCompletedTurn = Math.max(highestCompletedTurn, turnNumber)
      }
    }
  })

  const nextTurn = highestCompletedTurn + 1
  return Math.max(state.currentGlobalTurn, nextTurn)
}

const findMedia = (mediaId: string) => {
  return getDocumentById(mediaId)
}

const findMediaArray = (mediaIds: string | string[]) => {
  const ids = Array.isArray(mediaIds) ? mediaIds : [mediaIds]
  return ids.map(id => findMedia(id)).filter(Boolean)
}

const addDelayedMessage = (contactId: string, messageData: MessageData, delaySeconds: number = 2) => {
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

// Initialize message queue composable
const messageQueue = useMessageQueue({
  contactId,
  addMessage,
  addDelayedMessage,
  unlockDocuments,
  findMediaArray,
  show,
  getPuzzleForTurn,
  isPreQuestionShown,
  setPreQuestionShown,
  currentTurn
})

// Initialize contact loader composable
const contactLoader = useContactLoader({
  contactId,
  contact,
  messages,
  state,
  addMessage,
  addDelayedMessage,
  unlockDocuments,
  findMediaArray,
  getNarrativeMessagesForTurnStart,
  getPuzzleForTurn,
  isNarrativeShown,
  setNarrativeShown,
  isPreQuestionShown,
  setPreQuestionShown,
  getCurrentTurnForContact,
  isTyping
})

const checkTriggeredNarratives = () => {
  return contactLoader.checkTriggeredNarratives(contactData.value)
}

function requestHint() {
  if (!isHintAvailable.value || !currentPuzzle.value) return

  const puzzleKey = `${contactId.value}_${currentTurn.value}`
  const usedHints = getUsedHintsForPuzzle(puzzleKey)
  const hintText = currentPuzzle.value.hints[usedHints]

  if (hintText) {
    addDelayedMessage(contactId.value, {
      id: `msg_hint_${puzzleKey}_${usedHints}`,
      content: hintText,
      sender: 'contact'
    }, 0)

    useHint(puzzleKey)

    isTyping.value = true
    setTimeout(() => {
      isTyping.value = false
      scrollToBottom()
    }, 1000)
  }
}

const loadContactData = () => {
  const loadedData = contactLoader.loadContactData()
  if (loadedData) {
    contactData.value = loadedData
  }
}

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

function goBack() {
  router.push('/')
}

const handleAutoSolve = (event: any) => {
  const answers = event.detail.answers
  const answer = answers[currentTurn.value]
  if (answer) {
    handleSendMessage(answer)
  } else {
    console.log('No answer found for turn:', currentTurn.value)
  }
}

const handleSendMessage = async (userMsg: string) => {
  if (!userMsg.trim() || isCooldown.value) return

  messageQueue.addUserMessage(userMsg)
  isMessageSending.value = true
  isTyping.value = true

  await new Promise(resolve => setTimeout(resolve, 1500))

  const result = parseInput(contactId.value, userMsg)

  messageQueue.addMainResponse(result)

  messageQueue.queueTextMessages(result.textMessages)
  messageQueue.queueSuccessMedia(result.successMedia)
  messageQueue.queueMediaMessages(result.mediaId)
  messageQueue.queueEvidenceText(result.evidenceText)
  messageQueue.queueEvidenceMessages(result.evidenceTextMessages)
  messageQueue.queueNarrativeMessages(result)
  messageQueue.queueNarrativeMedia(result.narrativeMediaIds)

  const totalMessageDelay = messageQueue.calculateTotalDelay(result)

  setTimeout(() => {
    isTyping.value = false
  }, totalMessageDelay)

  if (result.status === 'success') {
    messageQueue.handleSuccessActions(result, totalMessageDelay)
    isMessageSending.value = false
  } else {
    messageQueue.handleFailureActions(result)
    isMessageSending.value = false
  }

  scrollToBottom()
}


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
  if (newTurn > 1 && !isMessageSending.value) {
    const narrativeData = getNarrativeMessagesForTurnStart(contactId.value, newTurn)
    // Also check for triggered narratives coming from other contacts
    const triggeredData = checkTriggeredNarratives()
    let delay = 0

    narrativeData.messages.forEach((message: string, index: number) => {
      const narrativeId = `narrative_turnstart_${newTurn}_${index}`
      if (!isNarrativeShown(narrativeId)) {
        setTimeout(() => {
          addMessage(contactId.value, {
            id: `msg_narrative_turnstart_${newTurn}_${index}`,
            content: message,
            sender: 'contact',
            timestamp: Date.now()
          })
          setNarrativeShown(narrativeId)
        }, delay)
        delay += 2000
      }
    })

    // Add narrative media if any
    if (narrativeData.mediaIds.length > 0) {
      unlockDocuments(narrativeData.mediaIds)
      const mediaArray = findMediaArray(narrativeData.mediaIds)
      mediaArray.forEach((media: any, idx: number) => {
        const narrativeMediaId = `narrative_media_turnstart_${newTurn}_${idx}`
        if (!isNarrativeShown(narrativeMediaId)) {
          setTimeout(() => {
            addMessage(contactId.value, {
              id: `msg_narrative_media_turnstart_${newTurn}_${idx}`,
              content: '',
              sender: 'contact',
              media: [media],
              timestamp: Date.now()
            })
            setNarrativeShown(narrativeMediaId)
          }, delay)
          delay += 2000
        }
      })
    }

    // Add triggered narrative messages (from other contacts) before preQuestion
    if (triggeredData.messages.length > 0 && triggeredData.events && triggeredData.events.length > 0) {
      unlockDocuments(triggeredData.mediaIds)
      triggeredData.messages.forEach((message: string, index: number) => {
        const event = triggeredData.events![0]
        const narrativeId = `narrative_triggered_${event.id}_${index}`
        if (!isNarrativeShown(narrativeId)) {
          setTimeout(() => {
            addMessage(contactId.value, {
              id: `msg_narrative_triggered_${event.id}_${index}`,
              content: message,
              sender: 'contact',
              timestamp: Date.now()
            })
            setNarrativeShown(narrativeId)
          }, delay)
          delay += 2000
        }
      })

      // Add triggered media
      if (triggeredData.mediaIds.length > 0) {
        const triggeredMediaArray = findMediaArray(triggeredData.mediaIds)
        triggeredMediaArray.forEach((media: any, idx: number) => {
          const event = triggeredData.events![0]
          const narrativeMediaId = `narrative_triggered_media_${event.id}_${media.id || idx}`
          if (!isNarrativeShown(narrativeMediaId)) {
            setTimeout(() => {
              addMessage(contactId.value, {
                id: `msg_narrative_triggered_media_${event.id}_${media.id || idx}`,
                content: '',
                sender: 'contact',
                media: [media],
                timestamp: Date.now()
              })
              setNarrativeShown(narrativeMediaId)
            }, delay)
            delay += 2000
          }
        })
      }
    }

    // Show puzzle preQuestion after both turn-start narratives and any triggered narratives
    const puzzleEvent = getPuzzleForTurn(contactId.value, newTurn)
    if (puzzleEvent?.preQuestion && !isPreQuestionShown(`${contactId.value}_${newTurn}`)) {
      setTimeout(() => {
        addMessage(contactId.value, {
          id: `msg_prequestion_${contactId.value}_${newTurn}`,
          content: puzzleEvent.preQuestion,
          sender: 'contact',
          timestamp: Date.now()
        })
        setPreQuestionShown(`${contactId.value}_${newTurn}`, true)
      }, delay)
    }
  }
})


onMounted(() => {
  scrollToBottom()
  markMessagesAsRead(contactId.value)

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
})

onUnmounted(() => {
  window.removeEventListener('debug-auto-solve', handleAutoSolve)
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
