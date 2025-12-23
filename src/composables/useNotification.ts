import { ref } from 'vue'

type Toast = { id: number; text: string; contactId?: string; createdAt: number; ttl: number }

export const toasts = ref<Toast[]>([])
let nextId = 1

export function useNotification() {
  function show(text: string, contactId?: string, ttl = 4000) {
    setTimeout(() => {
      const id = nextId++
      const createdAt = Date.now()
      toasts.value.push({ id, text, contactId, createdAt, ttl })
      
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, ttl)
    }, 1000)
  }

  function getToasts() {
    return toasts
  }

  function removeToast(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { show, getToasts, removeToast }
}
