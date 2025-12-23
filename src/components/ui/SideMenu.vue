<template>
  <transition name="slide-menu">
    <div v-if="menuOpen" class="side-menu" @click="$emit('close-menu')">
      <div class="menu-content" @click.stop>
        <button class="close-btn" @click="$emit('close-menu')">
          <i class="fas fa-times"></i>
        </button>
        <h3>Menu</h3>
        <button class="menu-btn" @click="$emit('lock-chat')">
          <i class="fas fa-lock"></i> Blocca Chat
        </button>
        <button class="reset-btn" @click="$emit('reset-game')">
          <i class="fas fa-undo"></i> Reset Gioco
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
defineProps<{
  menuOpen: boolean
}>()

defineEmits<{
  'close-menu': []
  'reset-game': []
  'lock-chat': []
}>()
</script>

<style scoped lang="scss">
.side-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-start;
}

.menu-content {
  background: white;
  width: 300px;
  height: 100%;
  padding: 1rem;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.close-btn {
  position: absolute;
  align-self: flex-end;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  color: #666;
}

.menu-content h3 {
  margin: 1rem 0;
  color: #075e54;
  font-size: 1.1rem;
  border-bottom: 1px solid #ddd;
  padding-bottom: 1rem;
}

.menu-btn {
  color: #2196f3;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
  margin-bottom: 0.5rem;
  width: 100%;
  justify-content: flex-start;
  background: transparent;
}

.reset-btn {
  background: transparent;
  color: #e53935;
  border: none;
  padding: 0.75rem 1rem;
  border-top: 1px solid #ddd;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
  margin-top: auto;
}

/* Side Menu Transitions */
.slide-menu-enter-active,
.slide-menu-leave-active {
  transition: opacity 0.3s ease;
}

.slide-menu-enter-from,
.slide-menu-leave-to {
  opacity: 0;
}

.slide-menu-enter-active .menu-content,
.slide-menu-leave-active .menu-content {
  transition: transform 0.3s ease;
}

.slide-menu-enter-from .menu-content,
.slide-menu-leave-to .menu-content {
  transform: translateX(-100%);
}
</style>