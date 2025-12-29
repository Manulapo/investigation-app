<template>
  <div class="container">
    <!-- Profile Header -->
    <div class="profile-header">
      <i class="fas fa-chevron-left" @click="goToChat(contactId)"></i>
      <div class="contact-info">
        <img :src="contact?.avatar" :alt="contact?.name" class="avatar" />
        <div class="contact-details">
          <div class="contact-name">{{ contact?.name }}</div>
          <div class="contact-status">Online</div>
        </div>
      </div>
    </div>

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
import { useSaveManager } from '../composables/useSaveManager'
import MediaGrid from '../components/ui/MediaGrid.vue'

const route = useRoute()
const router = useRouter()
const contactId = route.params.id as string
const { state } = useSaveManager()

const contact = computed(() => registry.find((c: any) => c.id === contactId))
const contactData = ref<any>(null)

const goToChat = (id: string) => {
  router.push(`/chat/${id}`)
}

watch(contact, async (newContact) => {
  if (newContact?.file) {
    try {
      const module = await import(`../data/contacts/${newContact.file}.json`)
      contactData.value = module.default
    } catch {
      contactData.value = null
    }
  }
}, { immediate: true })

function messageExists(id: string) {
  return Object.values(state.chatHistories).some((arr: any) => arr.some((m: any) => m.id === id))
}

const unlockedMedia = computed(() => {
  const media = contactData.value?.media || []
  // Find all success messages that have been posted
  const successMessages = Object.values(state.chatHistories).flat().filter((m: any) => 
    m.id?.startsWith('msg_turn') && m.id?.endsWith('_success')
  )
  
  // For each success message, find the corresponding puzzle and get its mediaId(s)
  const unlockedMediaIds = new Set<string>()
  successMessages.forEach((msg: any) => {
    const puzzles = contactData.value?.puzzles || []
    const puzzle = puzzles.find((p: any) => p.solution?.response?.messageId === msg.id)
    if (puzzle?.solution?.response?.mediaId) {
      const mediaIds = Array.isArray(puzzle.solution.response.mediaId) 
        ? puzzle.solution.response.mediaId 
        : [puzzle.solution.response.mediaId]
      mediaIds.forEach((id:string) => unlockedMediaIds.add(id))
    }
  })
  
  return media.filter((m: any) => unlockedMediaIds.has(m.id))
})
</script>

<style scoped lang="scss">
.container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ece5dd;
}

.profile-header {
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
  flex: 1;
}

.avatar {
  width: 50px;
  height: 50px;
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
  border-bottom: 1px solid #e0e0e0;
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
