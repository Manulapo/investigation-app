<template>
  <div class="grid">
    <div v-for="m in media" :key="m.id" class="card" @click="handleCardClick(m)">
      <div v-if="m.type === 'image'" class="card-image">
        <img :src="m.src" :alt="m.alt" />
      </div>
      <div v-else-if="m.type === 'pdf'" class="card-icon">
        <div class="icon-wrapper">
          <i class="fas fa-file-pdf"></i>
          <span v-if="m.alt" class="icon-title">{{ m.alt }}</span>
        </div>
      </div>
      <div v-else-if="m.type === 'audio'" class="card-icon">
        <div class="icon-wrapper">
          <i class="fas fa-music"></i>
          <span v-if="m.alt" class="icon-title">{{ m.alt }}</span>
        </div>
      </div>
    </div>
  </div>
  <div v-if="media.length === 0" class="no-media">
    <p>{{ emptyMessage }}</p>
  </div>

  <!-- Fullscreen Media Modal -->
  <div v-if="fullscreenMedia" class="fullscreen-modal" @click="closeFullscreen">
    <div class="fullscreen-content" @click.stop>
      <img 
        ref="imageElement"
        :src="fullscreenMedia.src" 
        :alt="fullscreenMedia.alt || 'Media'" 
        class="fullscreen-image"
        :style="imageTransform"
        @mousedown="startDrag"
        @touchstart="startDrag"
      />
      <button class="close-btn" @click="closeFullscreen">×</button>
      
      <!-- Zoom Controls Footer -->
      <div class="zoom-controls">
        <button @click="zoomOut" :disabled="zoomLevel <= 1">
          <i class="fas fa-minus"></i>
        </button>
        <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
        <button @click="zoomIn" :disabled="zoomLevel >= 4">
          <i class="fas fa-plus"></i>
        </button>
        <button @click="resetZoom">
          <i class="fas fa-undo"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  media: any[]
  emptyMessage?: string
}>()

const fullscreenMedia = ref<any>(null)
const imageElement = ref<HTMLImageElement | null>(null)
const zoomLevel = ref(1)
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const imageTransform = computed(() => {
  return {
    transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${zoomLevel.value})`,
    cursor: zoomLevel.value > 1 ? 'grab' : 'default',
    transition: isDragging.value ? 'none' : 'transform 0.2s ease'
  }
})

function handleCardClick(media: any) {
  if (media.type === 'image') {
    openFullscreen(media)
  } else {
    window.open(media.src, '_blank')
  }
}

function openFullscreen(media: any) {
  fullscreenMedia.value = media
  console.log('Opening fullscreen for media:', media)
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
</script>

<style scoped lang="scss">
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.card {
  width: 100%;
  aspect-ratio: 1;
  max-width: 150px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.card-image img {
  object-fit: cover;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
}

.icon-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #666;
}

.icon-wrapper i {
  font-size: 2rem;
}

.icon-title {
  font-size: 0.8rem;
  text-align: center;
  max-width: 100%;
  word-wrap: break-word;
}

.no-media {
  text-align: center;
  color: #999;
  font-style: italic;
  margin-top: 1rem;
}

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