<template>
  <div class="toast-wrap">
    <div v-for="toast in toasts" :key="toast.id" :class="['toast', { clickable: toast.contactId, 'animate-in': !animatedToasts.has(toast.id) }]" @click="handleClick(toast)">
      <div v-if="toast.contactId" class="chat-notification">
         <Avatar :src="getContact(toast.contactId)?.avatar!" :alt="getContact(toast.contactId)?.name" class="avatar" />
        <div class="content">
          <div class="name">{{ getContact(toast.contactId)?.name }}</div>
          <div class="message">{{ toast.text }}</div>
        </div>
      </div>
      <div v-else>{{ toast.text }}</div>
      <div class="progress-bar" :style="{ width: getProgressWidth(toast) + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted, watch } from 'vue'
import registry from '../data/registry.json'
import { toasts } from '../composables/useNotification'
import { useNotification } from '../composables/useNotification'
import Avatar from './ui/Avatar.vue'

const router = useRouter()
const { removeToast } = useNotification()
const animatedToasts = new Set<number>()
const clickedToastIds = new Set<number>()

const progressUpdates = ref(0)

function getContact(id: string) {
  return registry.find((c: any) => c.id === id)
}

function getProgressWidth(toast: any): number {
  // Use progressUpdates to make this function reactive
  progressUpdates.value // This creates a dependency
  
  if (!toast.createdAt || !toast.ttl) return 100
  const elapsed = Date.now() - toast.createdAt
  const remaining = Math.max(0, toast.ttl - elapsed)
  return (remaining / toast.ttl) * 100
}

onMounted(() => {
  // Update progress every 100ms for smooth animation
  const interval = setInterval(() => {
    progressUpdates.value++
  }, 100)
  
  onUnmounted(() => {
    clearInterval(interval)
  })
})

// Mark new toasts as animated after they appear
watch(toasts, (newToasts) => {
  newToasts.forEach(toast => {
    if (!animatedToasts.has(toast.id)) {
      // Mark as animated after a short delay to allow animation to complete
      setTimeout(() => {
        animatedToasts.add(toast.id)
      }, 600) // Slightly longer than animation duration
    }
  })
}, { immediate: true })

function handleClick(toast: any) {
  // Prevent multiple clicks on the same toast
  if (clickedToastIds.has(toast.id)) return
  clickedToastIds.add(toast.id)

  if (toast.contactId) {
    // Navigate to the chat and remove toast after navigation
    router.push({ name: 'chat', params: { id: toast.contactId } }).then(() => {
      removeToast(toast.id)
    })
  }
}
</script>

<style scoped lang="scss">
.toast-wrap {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 0.5rem;
  pointer-events: none;
}

.toast {
  background: white;
  padding: .6rem .75rem;
  border-radius: 6px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, .08);
  margin-bottom: .5rem;
  transition: background 0.2s;
  width: 100%;
  pointer-events: auto;
  position: relative;
  overflow: hidden;
  animation: slideIn 0.5s ease-out;

  &.clickable {
    cursor: pointer;

    &:hover {
      background: #f5f5f5;
    }
  }
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #25d366, #128c7e);
  transition: width 0.08s linear;
  border-radius: 0 0 6px 6px;
}

@keyframes slideIn {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.chat-notification {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 40px !important;
  height: 40px !important;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.content {
  flex: 1;
  min-width: 0;
}

.name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #075e54;
}

.message {
  font-size: 0.85rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
