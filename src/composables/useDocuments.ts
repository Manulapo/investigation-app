import { ref, computed } from 'vue'
import allDocuments from '../data/documents.json'

const unlockedDocumentIds = ref<string[]>([])

// Initialize with documents that have initial: true
const initializeDocuments = () => {
  if (unlockedDocumentIds.value.length === 0) {
    const initialDocs = allDocuments.filter((doc: any) => doc.initial === true)
    unlockedDocumentIds.value = initialDocs.map((doc: any) => doc.id)
  }
}

export function useDocuments() {
  // Make sure to initialize on first use
  initializeDocuments()

  const allDocumentsList = computed(() => {
    return allDocuments.map((doc: any) => ({
      ...doc,
      unlocked: unlockedDocumentIds.value.includes(doc.id)
    }))
  })

  const unlockedDocuments = computed(() => {
    return allDocuments.filter((doc: any) => 
      unlockedDocumentIds.value.includes(doc.id)
    )
  })

  function unlockDocument(id: string) {
    if (!unlockedDocumentIds.value.includes(id)) {
      unlockedDocumentIds.value.push(id)
    }
  }

  function unlockDocuments(ids: string[]) {
    ids.forEach(id => unlockDocument(id))
  }

  function getDocumentById(id: string) {
    return allDocuments.find((doc: any) => doc.id === id)
  }

  function getDocumentsByContactId(contactId: string) {
    return allDocuments.filter((doc: any) => doc.contactId === contactId)
  }

  function isDocumentUnlocked(id: string): boolean {
    return unlockedDocumentIds.value.includes(id)
  }

  return {
    allDocumentsList,
    unlockedDocuments,
    unlockDocument,
    unlockDocuments,
    getDocumentById,
    getDocumentsByContactId,
    isDocumentUnlocked
  }
}
