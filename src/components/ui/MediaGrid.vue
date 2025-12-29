<template>
  <div class="grid">
    <div v-for="m in media" :key="m.id" class="card" @click="handleCardClick(m)">
      <div v-if="m.type === 'image'" class="card-image">
        <img :src="m.src" :alt="m.alt" />
      </div>
      <div v-else-if="m.type === 'pdf'" class="card-icon">
        <div class="icon-wrapper">
          <i class="fas fa-file-pdf"></i>
          <span v-if="m.alt" class="icon-title">{{ m.alt }}</span>
        </div>
      </div>
      <div v-else-if="m.type === 'audio'" class="card-icon">
        <div class="icon-wrapper">
          <i class="fas fa-music"></i>
          <span v-if="m.alt" class="icon-title">{{ m.alt }}</span>
        </div>
      </div>
    </div>
  </div>
  <div v-if="media.length === 0" class="no-media">
    <p>{{ emptyMessage }}</p>
  </div>

  <!-- Fullscreen Media Modal -->
  <div v-if="fullscreenMedia" class="fullscreen-modal" @click="closeFullscreen">
    <div class="fullscreen-content">
      <img :src="fullscreenMedia.src" :alt="fullscreenMedia.alt || 'Media'" class="fullscreen-image" />
      <button class="close-btn" @click="closeFullscreen">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  media: any[]
  emptyMessage?: string
}>()

const fullscreenMedia = ref<any>(null)

function handleCardClick(media: any) {
  if (media.type === 'image') {
    // Open image in fullscreen modal
    openFullscreen(media)
  } else {
    // Open PDF, audio, or other media in a new tab
    window.open(media.src, '_blank')
  }
}

function openFullscreen(media: any) {
  fullscreenMedia.value = media
}

function closeFullscreen() {
  fullscreenMedia.value = null
}
</script>

<style scoped lang="scss">
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.card {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
}

.icon-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #666;
}

.icon-wrapper i {
  font-size: 2rem;
}

.icon-title {
  font-size: 0.8rem;
  text-align: center;
  max-width: 100%;
  word-wrap: break-word;
}

.no-media {
  text-align: center;
  color: #999;
  font-style: italic;
  margin-top: 1rem;
}

.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.fullscreen-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.fullscreen-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 0.5rem;
}
</style>