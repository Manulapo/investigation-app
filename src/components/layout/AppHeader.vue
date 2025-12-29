<template>
  <div class="app-header">
    <!-- Left Button (Back or Menu) -->
    <button v-if="showLeftButton" class="left-btn" @click="$emit('left-click')">
      <i :class="leftIcon"></i>
    </button>

    <!-- Title or Custom Content -->
    <div v-if="$slots.default" class="header-content">
      <slot></slot>
    </div>
    <h2 v-else-if="title" class="header-title">{{ title }}</h2>

    <!-- Level Badge (optional) -->
    <div v-if="showLevel" class="level-badge">Level {{ level }}</div>

    <!-- Right Button (optional) -->
    <button v-if="showRightButton" class="right-btn" @click="$emit('right-click')">
      <i :class="rightIcon"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  showLeftButton?: boolean
  leftIcon?: string
  showRightButton?: boolean
  rightIcon?: string
  showLevel?: boolean
  level?: number
}>()

defineEmits<{
  'left-click': []
  'right-click': []
}>()
</script>

<style scoped lang="scss">
.app-header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background: #075e54;
  color: white;
  padding: 0.75rem 1rem;
  gap: 0.75rem;
  flex-shrink: 0;
  min-height: 60px;
  z-index: 100;
}

.left-btn,
.right-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  i {
    font-size: 1.2rem;
  }
}

.left-btn {
  order: -1;
}

.header-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
  text-align: center;
  flex: 1;
  order: 0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 0.75rem;
  order: 0;
}

.level-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.4rem 0.8rem;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  order: 1;
}
</style>
