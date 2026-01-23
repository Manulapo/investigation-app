import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import './assets/styles/main.scss'
import { migrateFromLegacyStorage } from './utils/storeMigration'
import { useDocumentsStore } from './stores/documentsStore'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)

// Migrate legacy data after Pinia is initialized
migrateFromLegacyStorage()

// Initialize documents store
const documentsStore = useDocumentsStore()
documentsStore.initializeDocuments()

router.isReady().then(() => {
  app.mount('#app')
})
