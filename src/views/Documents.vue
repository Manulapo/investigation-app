<template>
  <div class="documents-page">
    <AppHeader title="Documenti Iniziali" show-left-button left-icon="fas fa-chevron-left" @left-click="goBack" />

    <div class="documents-content">
      <section class="description-section">
        <p>Questi sono i documenti base del caso che hai a disposizione fin dall'inizio dell'indagine. Utilizzali per
          familiarizzare con i dettagli del caso "Ombra" prima di iniziare le comunicazioni con i contatti.</p>
      </section>

      <section class="gallery-section">
        <h2>Galleria Documenti</h2>
        <MediaGrid :media="unlockedDocuments" empty-message="Nessun documento disponibile" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import MediaGrid from '../components/ui/MediaGrid.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import { useDocumentsStore } from '../stores/documentsStore'

const router = useRouter()
const documentsStore = useDocumentsStore()
const { unlockedDocuments } = documentsStore

function goBack() {
  router.back()
}
</script>

<style scoped lang="scss">
.documents-page {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #ece5dd;
  color: black;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: pan-y;
}

.documents-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  scrollbar-width: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.documents-content::-webkit-scrollbar {
  display: none;
}

.description-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.description-section p {
  margin: 0;
  color: #333;
  line-height: 1.5;
  font-size: 0.95rem;
}

.gallery-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.gallery-section h2 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}
</style>