<template>
  <div class="text-input">
    <input :placeholder="placeholder" v-model="modelValue" @keyup.enter="submit" />
  </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, ref, watch } from 'vue'
const props = defineProps<{ modelValue: string; placeholder?: string }>()
const emit = defineEmits(['update:modelValue','submit'])
const model = ref(props.modelValue)
watch(()=>props.modelValue, v=>model.value = v)
watch(model, v=>emit('update:modelValue', v))
function submit(){ emit('submit') }
</script>

<style scoped lang="scss">
.text-input input { width:100%; padding: .5rem; border-radius:6px; border:1px solid #ddd }
</style>
