import { computed, onMounted, onUnmounted, ref } from 'vue'

export function useImageViewer() {
    // State
    const fullscreenMedia = ref<any>(null)
    const imageElement = ref<HTMLImageElement | null>(null)
    const zoomLevel = ref(1)
    const position = ref({ x: 0, y: 0 })
    const isDragging = ref(false)
    const dragStart = ref({ x: 0, y: 0 })

    // Computed
    const imageTransform = computed(() => {
        return {
            transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${zoomLevel.value})`,
            cursor: zoomLevel.value > 1 ? 'grab' : 'default',
            transition: isDragging.value ? 'none' : 'transform 0.2s ease'
        }
    })

    // Functions
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

    // Lifecycle
    onMounted(() => {
        document.addEventListener('mousemove', onDrag)
        document.addEventListener('mouseup', stopDrag)
        document.addEventListener('touchmove', onDrag)
        document.addEventListener('touchend', stopDrag)
    })

    onUnmounted(() => {
        document.removeEventListener('mousemove', onDrag)
        document.removeEventListener('mouseup', stopDrag)
        document.removeEventListener('touchmove', onDrag)
        document.removeEventListener('touchend', stopDrag)
    })

    return {
        // State
        fullscreenMedia,
        imageElement,
        zoomLevel,
        position,
        isDragging,
        dragStart,
        // Computed
        imageTransform,
        // Methods
        openFullscreen,
        closeFullscreen,
        zoomIn,
        zoomOut,
        resetZoom,
        startDrag,
        onDrag,
        stopDrag
    }
}
