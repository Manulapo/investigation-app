<template>
  <div class="message-row" :class="{ 'is-user': sender === 'user', 'is-contact': sender === 'contact' }">
    <div class="bubble">
      <p v-if="content" class="text">{{ content }}</p>
      <div v-if="media && media.length > 0" class="media-gallery">
        <div v-for="(item, idx) in media" :key="idx" class="media-item">
          <img v-if="item.type === 'image'" :src="item.src" :alt="item.alt || 'Evidence'" class="media-image" @click="openFullscreen(item)" />
          <div v-else-if="item.type === 'pdf'" class="pdf-container">
            <a :href="item.src" target="_blank" class="pdf-preview">
              <i class="fas fa-file-pdf"></i>
              <span>{{ item.alt + '.pdf' || 'PDF Document' }}</span>
              <i class="fas fa-chevron-right"></i>
            </a>
          </div>
          <div v-else-if="item.type === 'audio'" class="pdf-container">
            <a :href="getMediaSrc(item.src, 'audio')" target="_blank" class="pdf-preview">
              <i class="fas fa-music"></i>
              <span>{{ item.alt || 'Audio' }}</span>
              <i class="fas fa-chevron-right"></i>
            </a>
          </div>
        </div>
      </div>
      <span class="timestamp">
      <i v-if="sender === 'user'" class="fas fa-check"></i>
      {{ formattedTime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import type { Media } from '../../types'

const props = defineProps<{
  content: string
  sender: 'user' | 'contact'
  timestamp: number
  media?: Media[]
}>()

const emit = defineEmits<{
  openFullscreen: [media: { type: 'image'; src: string; alt?: string }]
}>()

const convertGoogleDriveUrl = (url: string): string => {
  // Convert Google Drive view/preview links to streamable format
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
  if (fileIdMatch) {
    const fileId = fileIdMatch[1]
    // Try using the uc endpoint without export for direct streaming
    return `https://drive.google.com/uc?id=${fileId}`
  }
  return url
}

const getMediaSrc = (src: string, type: string): string => {
  if (type === 'audio' && src.includes('drive.google.com')) {
    return convertGoogleDriveUrl(src)
  }
  return src
}

const formattedTime = computed(() => {
  if (!props.timestamp || isNaN(props.timestamp)) return ''
  const date = new Date(props.timestamp)
  if (isNaN(date.getTime())) return ''
  return format(date, 'HH:mm')
})

function openFullscreen(media: Media) {
  if (media.type === 'image') {
    emit('openFullscreen', {
      type: media.type,
      src: media.src,
      alt: media.alt
    })
  }
}
</script>

<style scoped lang="scss">
.message-row {
  display: flex;
  margin-bottom: 0.5rem;
  animation: slideIn 0.3s ease;

  &.is-user {
    justify-content: flex-end;
  }

  &.is-contact {
    justify-content: flex-start;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bubble {
  max-width: 85%;
  padding: 0.6rem 0.9rem;
  border-radius: 12px;
  word-wrap: break-word;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  .is-user & {
    background: #dcf8c6;
    color: #000;
    border-bottom-right-radius: 2px;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  }

  .is-contact & {
    background: #fff;
    color: #000;
    border-bottom-left-radius: 2px;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  }
}

.text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.3;
}

.media-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.5rem 0;
}

.media-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.media-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
}

.pdf-container {
  margin: 0.5rem 0;
  display: flex;
}

.pdf-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  color: #075e54;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
  
  i {
    font-size: 1.2rem;
    color: #e74c3c;
    flex-shrink: 0;
    
    &.fa-chevron-right {
      margin-left: auto;
      font-size: 1rem;
      color: #999;
    }
    
    &.fa-music {
      color: #9b59b6;
    }
  }
}

.media-container {
  margin: 0.5rem 0;
  
  .audio-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    margin: 0.5rem 0;
  }
  
  .audio-player {
    width: 100%;
    height: 32px;
    cursor: pointer;
  }
  
  .audio-label {
    font-size: 0.85rem;
    color: #666;
    font-weight: 500;
  }
}

.timestamp {
  font-size: 0.7rem;
  opacity: 0.6;
  align-self: flex-end;
}
</style>
