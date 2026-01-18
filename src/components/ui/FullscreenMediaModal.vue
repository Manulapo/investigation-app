<template>
    <div v-if="media" class="fullscreen-modal" @click="onClose">
        <div class="fullscreen-content" @click.stop>
            <img v-if="media.type === 'image'" ref="imageElement" :src="media.src" :alt="media.alt || 'Media'"
                class="fullscreen-image" :style="imageTransform" @mousedown="onStartDrag" @touchstart="onStartDrag" />
            <button class="close-btn" @click="onClose">×</button>

            <!-- Zoom Controls Footer -->
            <div class="zoom-controls">
                <button @click="onZoomOut" :disabled="zoomLevel <= 1">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
                <button @click="onZoomIn" :disabled="zoomLevel >= 4">
                    <i class="fas fa-plus"></i>
                </button>
                <button @click="onResetZoom">
                    <i class="fas fa-undo"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

interface Props {
    media: any
    imageElement: HTMLImageElement | null
    imageTransform: Record<string, any>
    zoomLevel: number
}

interface Emits {
    (e: 'close'): void
    (e: 'zoom-in'): void
    (e: 'zoom-out'): void
    (e: 'reset-zoom'): void
    (e: 'start-drag', event: MouseEvent | TouchEvent): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const onClose = () => emit('close')
const onZoomIn = () => emit('zoom-in')
const onZoomOut = () => emit('zoom-out')
const onResetZoom = () => emit('reset-zoom')
const onStartDrag = (e: MouseEvent | TouchEvent) => emit('start-drag', e)
</script>

<style scoped lang="scss">
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
    width: 90vw;
    height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.fullscreen-image {
    max-width: 90vw;
    max-height: 90vh;
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
    user-select: none;
    -webkit-user-drag: none;
}

.fullscreen-image:active {
    cursor: grabbing !important;
}

.zoom-controls {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(0, 0, 0, 0.8);
    padding: 0.75rem 1.5rem;
    border-radius: 50px;
    z-index: 2001;
}

.zoom-controls button {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
}

.zoom-controls button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
}

.zoom-controls button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.zoom-controls .zoom-level {
    color: white;
    font-size: 0.9rem;
    min-width: 50px;
    text-align: center;
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
