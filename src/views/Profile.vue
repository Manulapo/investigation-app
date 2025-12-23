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
      <h2>Media</h2>
      <div class="grid">
        <div v-for="m in unlockedMedia" :key="m.id" class="card" @click="openFullscreen(m)">
          <img :src="m.src" alt="media" />
        </div>
      </div>
      <div v-if="unlockedMedia.length === 0" class="no-media">
        <p>Nessun media</p>
      </div>
    </div>

    <!-- Fullscreen Media Modal -->
    <div v-if="fullscreenMedia" class="fullscreen-modal" @click="closeFullscreen">
      <div class="fullscreen-content">
        <img :src="fullscreenMedia.src" :alt="fullscreenMedia.alt || 'Media'" class="fullscreen-image" />
        <button class="close-btn" @click="closeFullscreen">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import registry from '../data/registry.json'
import { useSaveManager } from '../composables/useSaveManager'

const route = useRoute()
const router = useRouter()
const contactId = route.params.id as string
const { state } = useSaveManager()

const contact = computed(() => registry.find((c: any) => c.id === contactId))
const contactData = ref<any>(null)
const fullscreenMedia = ref<any>(null)

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
  
  // For each success message, find the corresponding puzzle and get its mediaId
  const unlockedMediaIds = new Set<string>()
  successMessages.forEach((msg: any) => {
    const puzzles = contactData.value?.puzzles || []
    const puzzle = puzzles.find((p: any) => p.solution?.response?.messageId === msg.id)
    if (puzzle?.solution?.response?.mediaId) {
      unlockedMediaIds.add(puzzle.solution.response.mediaId)
    }
  })
  
  return media.filter((m: any) => unlockedMediaIds.has(m.id))
})

function openFullscreen(media: any) {
  fullscreenMedia.value = media
}

function closeFullscreen() {
  fullscreenMedia.value = null
}
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
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.media-section h2 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.2rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 1rem;
}

.card {
  cursor: pointer;
  transition: transform 0.2s;
}

.card:hover {
  transform: scale(1.05);
}

.card img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.no-media {
  text-align: center;
  color: #999;
  padding: 2rem 1rem;
}

.no-media .hint {
  font-size: 0.9rem;
  margin-top: 0.5rem;
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

.fullscreen-image {
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
