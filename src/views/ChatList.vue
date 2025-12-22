<template>
  <div class="chat-list-wrapper">
    <div class="contacts-list">
      <ContactItem
        v-for="contact in visibleContacts"
        :key="contact.id"
        :contact="contact"
        @select="goToChat(contact.id)"
      />
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

    <!-- Floating Help Button -->
    <button class="help-button" @click="goToHelp">
      <i class="fas fa-question-circle"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import registry from '../data/registry.json'
import ContactItem from '../components/ui/ContactItem.vue'
import { useSaveManager } from '../composables/useSaveManager'

const router = useRouter()
const { state } = useSaveManager()
const visibleContacts = computed(() => registry.filter((r: any) => r.visibleAtTurn <= state.currentGlobalTurn))

function goToChat(contactId: string) {
  router.push(`/chat/${contactId}`)
}

function goToHelp() {
  router.push('/help')
}
</script>

<style scoped lang="scss">
.chat-list-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
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

.help-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #075e54;
  color: white;
  border: none;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: background 0.2s;
  z-index: 1000;
}

.help-button:hover {
  background: #064e47;
}
</style>

