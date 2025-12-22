import { ref } from 'vue'

type Toast = { id: number; text: string }

const toasts = ref<Toast[]>([])
let nextId = 1

export function useNotification() {
  function show(text: string, ttl = 4000) {
    const id = nextId++
    toasts.value.push({ id, text })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, ttl)
  }

  function getToasts() {
    return toasts
  }

  return { show, getToasts }
}
