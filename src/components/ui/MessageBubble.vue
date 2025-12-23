<template>
  <div class="message-row" :class="{ 'is-user': sender === 'user', 'is-contact': sender === 'contact' }">
    <div class="bubble">
      <p v-if="content" class="text">{{ content }}</p>
      <div v-if="media" class="media-container">
        <img v-if="media.type === 'image'" :src="media.src" :alt="media.alt || 'Evidence'" class="media-image" @click="openFullscreen" />
        <div v-else-if="media.type === 'pdf'" class="pdf-container">
          <a :href="media.src" target="_blank" class="pdf-preview">
            <i class="fas fa-file-pdf"></i>
            <span>{{ media.alt + '.pdf' || 'PDF Document' }}</span>
          </a>
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
  media?: Media
}>()

const emit = defineEmits<{
  openFullscreen: [media: { type: 'image'; src: string; alt?: string }]
}>()

const formattedTime = computed(() => {
  if (!props.timestamp || isNaN(props.timestamp)) return ''
  const date = new Date(props.timestamp)
  if (isNaN(date.getTime())) return ''
  return format(date, 'HH:mm')
})

function openFullscreen() {
  if (props.media && props.media.type === 'image') {
    emit('openFullscreen', {
      type: props.media.type,
      src: props.media.src,
      alt: props.media.alt
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

.media-container {
  margin: 0.5rem 0;
  
  .media-image {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
    object-fit: cover;
    cursor: pointer;
    
    &:hover {
      opacity: 0.9;
    }
  }
  
  .pdf-container {
    margin: 0.5rem 0;
  }
  
  .pdf-preview {
    display: inline-flex;
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
    
    &:hover {
      background: #efefef;
      border-color: #075e54;
    }
    
    i {
      font-size: 1.2rem;
      color: #e74c3c;
    }
  }
}

.timestamp {
  font-size: 0.7rem;
  opacity: 0.6;
  align-self: flex-end;
}
</style>
