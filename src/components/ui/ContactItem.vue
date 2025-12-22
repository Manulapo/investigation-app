<template>
  <div class="contact-item" @click="$emit('select')">
    <img :src="contact.avatar" :alt="contact.name" class="avatar" />
    <div class="info">
      <p class="name">{{ contact.name }}</p>
      <p class="preview">{{ lastMessage || 'Tap to start' }}</p>
    </div>
    <span v-if="timestamp" class="time">{{ formattedTime }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSaveManager } from '../../composables/useSaveManager'
import { format } from 'date-fns'

const props = defineProps<{
  contact: any
}>()

defineEmits(['select'])

const { getMessages } = useSaveManager()
const messages = computed(() => getMessages(props.contact.id))
const lastMessage = computed(() => {
  if (messages.value.length === 0) return ''
  const last = messages.value[messages.value.length - 1]
  return last.content.substring(0, 35) + (last.content.length > 35 ? '...' : '')
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

.time {
  font-size: 0.75rem;
  color: #999;
  flex-shrink: 0;
}
</style>
