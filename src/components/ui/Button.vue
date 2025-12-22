<template>
  <button class="btn" @click="$emit('click')"><slot /></button>
</template>

<script setup lang="ts">
defineProps<{}>()
</script>

<style scoped lang="scss">
.btn { background: $primary; color: white; padding: .5rem .75rem; border-radius: 6px; border: none }
</style>
