<template>
  <div class="container">
    <h2>{{ contact?.id }} — Evidence</h2>
    <div class="grid">
      <div v-for="m in unlockedMedia" :key="m.id" class="card">
        <img :src="m.src" alt="evidence" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import registry from '../data/registry.json'
import contactData from '../data/contacts/c1_informant.json'
import { useSaveManager } from '../composables/useSaveManager'
const { state } = useSaveManager()
const contact = contactData

function messageExists(id:string){
  return Object.values(state.chatHistories).some((arr:any)=> arr.some((m:any)=> m.id === id))
}

const unlockedMedia = (contact.media || []).filter((m:any)=> messageExists(m.triggerMessageId))
</script>

<style scoped>
.grid{ display:grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap:10px }
.card img{ width:100%; height:140px; object-fit:cover; border-radius:6px }
</style>
