<template>
  <div class="contact-item" @click="$emit('select')">
    <img :src="contact.avatar" :alt="contact.name" class="avatar" />
    <div class="info">
      <p class="name">{{ contact.name }}</p>
      <p class="preview">{{ lastMessage }}</p>
    </div>
    <div class="right-section">
      <span v-if="timestamp" class="time">{{ formattedTime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { useSaveManager } from '../../composables/useSaveManager'

const props = defineProps<{
  contact: any
}>()

defineEmits(['select'])

const { getMessages } = useSaveManager()
const messages = computed(() => getMessages(props.contact.id))
const contactData = ref<any>(null)

onMounted(async () => {
  try {
    const contactFile = props.contact?.file
    if (contactFile) {
      const module = await import(`../../data/contacts/${contactFile}.json`)
      contactData.value = module.default
    }
  } catch (error) {
    console.error('Error loading contact data:', error)
  }
})

const lastMessage = computed(() => {
  if (messages.value.length === 0) {
    // Show initialMessage preview for unopened chats
    const preview = contactData.value?.initialMessage || 'Tocca per iniziare'
    return preview.substring(0, 50) + (preview.length > 50 ? '...' : '')
  }
  const last = messages.value[messages.value.length - 1]
  
  // If message has media but no text content
  if (last.media && !last.content && last.media.length > 0) {
    const mediaType = last.media[last.media.length - 1].type
    if (mediaType === 'image') return '📷 Foto'
    if (mediaType === 'pdf') return '📎 File'
    if (mediaType === 'audio') return '🎵 Audio'
    return '📎 File'
  }
  
  return last.content.substring(0, 50) + (last.content.length > 50 ? '...' : '')
})
const timestamp = computed(() => {
  if (messages.value.length === 0) return null
  return messages.value[messages.value.length - 1].timestamp
})
const formattedTime = computed(() => {
  if (!timestamp.value) return ''
  return format(new Date(timestamp.value), 'HH:mm')
})
</script>

<style scoped lang="scss">
.contact-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.15s;

  &:active {
    background: #f5f5f5;
  }
}

.name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  margin: 0;
  font-weight: 500;
  font-size: 0.95rem;
  color: #000;
}

.preview {
  margin: 0.2rem 0 0 0;
  font-size: 0.8rem;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.time {
  font-size: 0.75rem;
  color: #999;
}
</style>