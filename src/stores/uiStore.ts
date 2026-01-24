import { defineStore } from 'pinia'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Toast } from '../types'

export const useUIStore = defineStore('ui', () => {
    // Toast Notifications State
    const toasts = ref<Toast[]>([])
    let nextToastId = 1

    // Image Viewer State
    const fullscreenMedia = ref<any>(null)
    const zoomLevel = ref(1)
    const position = ref({ x: 0, y: 0 })
    const isDragging = ref(false)
    const dragStart = ref({ x: 0, y: 0 })

    // Toast Getters
    const getToasts = computed(() => toasts.value)

    // Image Viewer Getters
    const imageTransform = computed(() => ({
        transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${zoomLevel.value})`,
        cursor: zoomLevel.value > 1 ? 'grab' : 'default',
        transition: isDragging.value ? 'none' : 'transform 0.2s ease'
    }))

    const isFullscreenOpen = computed(() => fullscreenMedia.value !== null)

    // Toast Actions
    function showNotification(text: string, contactId?: string, ttl = 4000) {
        const id = nextToastId++
        const createdAt = Date.now()
        toasts.value.push({ id, text, contactId, createdAt, ttl })

        setTimeout(() => {
            toasts.value = toasts.value.filter(t => t.id !== id)
        }, ttl)
    }

    function removeToast(id: number) {
        toasts.value = toasts.value.filter(t => t.id !== id)
    }

    function clearAllToasts() {
        toasts.value = []
    }

    // Image Viewer Actions
    function openFullscreen(media: any) {
        fullscreenMedia.value = media
        resetZoom()
    }

    function closeFullscreen() {
        fullscreenMedia.value = null
        resetZoom()
    }

    function zoomIn() {
        if (zoomLevel.value < 4) {
            zoomLevel.value = Math.min(4, zoomLevel.value + 0.5)
        }
    }

    function zoomOut() {
        if (zoomLevel.value > 1) {
            zoomLevel.value = Math.max(1, zoomLevel.value - 0.5)
            if (zoomLevel.value === 1) {
                position.value = { x: 0, y: 0 }
            }
        }
    }

    function resetZoom() {
        zoomLevel.value = 1
        position.value = { x: 0, y: 0 }
    }

    function startDrag(e: MouseEvent | TouchEvent) {
        if (zoomLevel.value <= 1) return

        isDragging.value = true

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

        dragStart.value = {
            x: clientX - position.value.x,
            y: clientY - position.value.y
        }

        e.preventDefault()
    }

    function onDrag(e: MouseEvent | TouchEvent) {
        if (!isDragging.value) return

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

        position.value = {
            x: clientX - dragStart.value.x,
            y: clientY - dragStart.value.y
        }
    }

    function stopDrag() {
        isDragging.value = false
    }

    // Event listener setup (call from component using this store)
    function setupDragListeners() {
        document.addEventListener('mousemove', onDrag)
        document.addEventListener('mouseup', stopDrag)
        document.addEventListener('touchmove', onDrag)
        document.addEventListener('touchend', stopDrag)
    }

    function removeDragListeners() {
        document.removeEventListener('mousemove', onDrag)
        document.removeEventListener('mouseup', stopDrag)
        document.removeEventListener('touchmove', onDrag)
        document.removeEventListener('touchend', stopDrag)
    }

    return {
        // Toast State
        toasts,
        getToasts,

        // Image Viewer State
        fullscreenMedia,
        zoomLevel,
        position,
        isDragging,
        imageTransform,
        isFullscreenOpen,

        // Toast Actions
        showNotification,
        removeToast,
        clearAllToasts,

        // Image Viewer Actions
        openFullscreen,
        closeFullscreen,
        zoomIn,
        zoomOut,
        resetZoom,
        startDrag,
        onDrag,
        stopDrag,
        setupDragListeners,
        removeDragListeners
    }
})
