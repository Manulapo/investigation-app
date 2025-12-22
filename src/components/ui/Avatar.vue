<template>
  <img :src="src" :alt="alt" class="avatar" />
</template>

<script setup lang="ts">
defineProps<{ src: string; alt?: string }>()
</script>

<style scoped lang="scss">
.avatar { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
</style>
