import { ref, computed } from 'vue'
import allDocuments from '../data/documents.json'

const STORAGE_KEY = 'investigation_unlocked_documents'

const unlockedDocumentIds = ref<string[]>([])

// Load unlocked documents from localStorage
const loadFromStorage = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading unlocked documents from localStorage:', error)
    return []
  }
}

// Save unlocked documents to localStorage
const saveToStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedDocumentIds.value))
  } catch (error) {
    console.error('Error saving unlocked documents to localStorage:', error)
  }
}

// Initialize with documents from localStorage or initial documents
const initializeDocuments = () => {
  if (unlockedDocumentIds.value.length === 0) {
    // First try to load from localStorage
    const stored = loadFromStorage()
    
    if (stored.length > 0) {
      unlockedDocumentIds.value = stored
    } else {
      // If nothing in storage, initialize with initial documents
      const initialDocs = allDocuments.filter((doc: any) => doc.initial === true)
      unlockedDocumentIds.value = initialDocs.map((doc: any) => doc.id)
      saveToStorage()
    }
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
      saveToStorage()
    }
  }

  function unlockDocuments(ids: string[]) {
    ids.forEach(id => {
      if (!unlockedDocumentIds.value.includes(id)) {
        unlockedDocumentIds.value.push(id)
      }
    })
    saveToStorage()
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

  function resetDocuments() {
    // Reset to only initial documents
    const initialDocs = allDocuments.filter((doc: any) => doc.initial === true)
    unlockedDocumentIds.value = initialDocs.map((doc: any) => doc.id)
    saveToStorage()
  }

  return {
    allDocumentsList,
    unlockedDocuments,
    unlockDocument,
    unlockDocuments,
    getDocumentById,
    getDocumentsByContactId,
    isDocumentUnlocked,
    resetDocuments
  }
}
