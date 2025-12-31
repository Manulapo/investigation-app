<template>
  <div class="container">
    <!-- Profile Header -->
    <AppHeader 
      show-left-button
      left-icon="fas fa-chevron-left"
      @left-click="goToChat(contactId)"
    >
      <div class="contact-info">
        <img :src="contact?.avatar" :alt="contact?.name" class="avatar" />
        <div class="contact-details">
          <div class="contact-name">{{ contact?.name }}</div>
          <div class="contact-status">Online</div>
        </div>
      </div>
    </AppHeader>

    <!-- Profile Picture Section -->
    <div class="profile-picture-section">
      <img :src="contact?.avatar" :alt="contact?.name" class="profile-picture" />
    </div>

    <!-- Description Section -->
    <div class="description-section" v-if="contact?.description">
      <p>{{ contact.description }}</p>
    </div>

    <!-- Media Section -->
    <div class="media-section">
      <p>Media</p>
      <MediaGrid :media="unlockedMedia" empty-message="Nessun media" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import registry from '../data/registry.json'
import c1Data from '../data/contacts/c1_informant.json'
import c2Data from '../data/contacts/c2_informant.json'
import c3Data from '../data/contacts/c3_risolutore.json'
import c4Data from '../data/contacts/c4_risolutore.json'
import AppHeader from '../components/layout/AppHeader.vue'
import { useSaveManager } from '../composables/useSaveManager'
import { useDocuments } from '../composables/useDocuments'
import MediaGrid from '../components/ui/MediaGrid.vue'

const route = useRoute()
const router = useRouter()
const contactId = route.params.id as string
const { state } = useSaveManager()
const { getDocumentsByContactId, isDocumentUnlocked } = useDocuments()

const contact = computed(() => registry.find((c: any) => c.id === contactId))
const contactData = ref<any>(null)

const contactDataMap: Record<string, any> = {
  c1_informant: c1Data,
  c2_informant: c2Data,
  c3_risolutore: c3Data,
  c4_risolutore: c4Data
}

const goToChat = (id: string) => {
  router.push(`/chat/${id}`)
}

watch(contact, (newContact) => {
  if (newContact?.file) {
    try {
      contactData.value = contactDataMap[newContact.file]
    } catch {
      contactData.value = null
    }
  }
}, { immediate: true })

function messageExists(id: string) {
  return Object.values(state.chatHistories).some((arr: any) => arr.some((m: any) => m.id === id))
}

const unlockedMedia = computed(() => {
  // Get all documents for this contact
  const contactDocuments = getDocumentsByContactId(contactId)
  
  // Filter only unlocked documents
  return contactDocuments.filter((doc: any) => isDocumentUnlocked(doc.id))
})
</script>

<style scoped lang="scss">
.container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ece5dd;
}

.contact-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  margin-left: 3em;

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
  font-size: 1.1rem;
}

.contact-status {
  font-size: 0.8rem;
  opacity: 0.8;
}

.profile-picture-section {
  background: white;
  padding: 2rem 1rem;
  display: flex;
  justify-content: center;
}

.profile-picture {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e0e0e0;
}

.description-section {
  background: white;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.description-section p {
  margin: 0;
  color: #333;
  line-height: 1.4;
  font-size: 0.95rem;
}

.media-section {
  background: white;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.media-section p {
  margin: 0 0 1rem 0;
  color: #757575;
  font-size: .8rem;
}
</style>
