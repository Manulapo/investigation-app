<template>
  <img :src="src || '/investigation-app/assets/avatar/default.jpg'" :alt="alt" class="avatar" />
</template>

<script setup lang="ts">
const props = defineProps<{ src: string; alt?: string }>()
</script>

<style scoped lang="scss">
.avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
</style>
