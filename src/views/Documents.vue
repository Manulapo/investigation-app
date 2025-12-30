<template>
  <div class="documents-page">
    <div class="documents-header">
      <router-link to="/" class="back-btn">←</router-link>
      <h1>Documenti Iniziali</h1>
    </div>

    <div class="documents-content">
      <section class="description-section">
        <p>Questi sono i documenti base del caso che hai a disposizione fin dall'inizio dell'indagine. Utilizzali per familiarizzare con i dettagli del caso "Ombra" prima di iniziare le comunicazioni con i contatti.</p>
      </section>

      <section class="gallery-section">
        <h2>Galleria Documenti</h2>
        <MediaGrid :media="unlockedDocuments" empty-message="Nessun documento disponibile" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import MediaGrid from '../components/ui/MediaGrid.vue'
import { useDocuments } from '../composables/useDocuments'

const { unlockedDocuments } = useDocuments()
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
}

.documents-header {
  background: #075e54;
  color: white;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  z-index: 10;
}

.back-btn {
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  text-decoration: none;
  color: white;
  transition: background 0.2s;
  border-radius: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.documents-header h1 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  flex: 1;
}

.documents-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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