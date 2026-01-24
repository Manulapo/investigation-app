<template>
  <div class="chat-list-wrapper">
    <AppHeader title="Contatti" show-left-button left-icon="fas fa-bars" show-level :level="currentLevel"
      @left-click="toggleMenu" />

    <!-- Side Menu -->
    <SideMenu :menu-open="menuOpen" @close-menu="closeMenu" @reset-game="resetGame" @lock-chat="lockChat"
      @go-to-help="goToHelp" @go-to-documents="goToDocuments" />

    <div class="contacts-list">
      <ContactItem v-for="contact in visibleContacts" :key="contact.id" :contact="contact"
        @select="goToChat(contact.id)" />
    </div>
    <div v-if="visibleContacts.length === 0" class="empty-state">
      <div class="empty-icon"><i class="fas fa-comments"></i></div>
      <h2>Nessun contatto ancora</h2>
      <p>Risolvi gli enigmi per sbloccare nuovi contatti</p>
      <div class="hint-box">
        <p><strong>Come giocare:</strong></p>
        <p>Rispondi alle domande con: <code>T1: risposta</code></p>
      </div>
    </div>

    <!-- Floating Phone Button -->
    <button class="floating-phone-btn" @click="goToPhone" title="Telefono">
      <i class="fas fa-phone"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import registry from '../data/registry.json'
import { contactDataMap } from '../data/contactDataMap'
import ContactItem from '../components/ui/ContactItem.vue'
import SideMenu from '../components/ui/SideMenu.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import { useChatStore } from '../stores/chatStore'
import { useGameStore } from '../stores/gameStore'
import { useDocumentsStore } from '../stores/documentsStore'

const router = useRouter()
const chatStore = useChatStore()
const gameStore = useGameStore()
const documentsStore = useDocumentsStore()

// Helper function to get the last message timestamp for a contact
const getLastTimestamp = (contactId: string): number => {
  const messages = chatStore.getMessages(contactId)
  if (messages.length === 0) return 0
  return messages[messages.length - 1].timestamp || 0
}

const visibleContacts = computed(() => {
  const filtered = registry.filter((r: any) => {
    const meetsVisibleAtTurn = r.visibleAtTurn <= gameStore.currentGlobalTurn
    // If contact has phoneNumber, it requires a phone call to unlock
    if (r.phoneNumber) {
      return meetsVisibleAtTurn && gameStore.phoneUnlockedContacts.includes(r.id)
    }
    // Otherwise, appears automatically at the right turn
    return meetsVisibleAtTurn
  })

  // Sort by last message timestamp (most recent first)
  return filtered.sort((a: any, b: any) => {
    const timeA = getLastTimestamp(a.id)
    const timeB = getLastTimestamp(b.id)
    return timeB - timeA // Descending order (newest first)
  })
})
const currentLevel = computed(() => gameStore.currentGlobalTurn)

const menuOpen = ref(false)

// Pre-populate initial messages for visible contacts that haven't been opened yet
// This allows users to see a preview in the chat list
function ensureInitialMessages() {
  for (const contact of visibleContacts.value) {
    const messages = chatStore.getMessages(contact.id)

    // Only add if there are no messages at all
    if (messages.length === 0) {
      try {
        const contactData = contactDataMap[contact.file]

        // Add initial message only (contact loader will handle narratives and pre-questions)
        if (contactData?.initialMessage) {
          chatStore.addMessage(contact.id, {
            id: `msg_initial_${contact.id}`,
            content: contactData.initialMessage,
            sender: 'contact',
            timestamp: Date.now()
          })
        }

      } catch (error) {
        console.error('Error loading contact data:', error)
      }
    }
  }
}

onMounted(() => {
  ensureInitialMessages()
})

watch(visibleContacts, () => {
  ensureInitialMessages()
})

function goToChat(contactId: string) {
  router.push(`/chat/${contactId}`)
}

function goToHelp() {
  router.push('/help')
  closeMenu()
}

function goToDocuments() {
  router.push('/documents')
  closeMenu()
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

function resetGame() {
  if (confirm('Sei sicuro di voler resettare il gioco? Tutti i progressi verranno persi.')) {
    // Reset all stores
    chatStore.resetChatHistories()
    gameStore.resetAll()
    documentsStore.resetDocuments()

    localStorage.removeItem('has_been_unlocked')
    localStorage.setItem('chat_locked', 'true')
    closeMenu()
    router.push('/lock')
  }
}

function lockChat() {
  localStorage.setItem('chat_locked', 'true')
  closeMenu()
  router.push('/lock')
}

function goToPhone() {
  router.push('/phone')
}
</script>

<style scoped lang="scss">
.chat-list-wrapper {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: pan-y;
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9aa4b2;
  padding: 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  margin: 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
}

.empty-state p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.hint-box {
  margin-top: 1.5rem;
  background: #f0f4ff;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  text-align: left;
}

.hint-box p {
  margin: 0.25rem 0;
}

code {
  background: #e0e6ff;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
  color: #333;
}

.floating-phone-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #075e54;
  color: white;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 999;
}
</style>
