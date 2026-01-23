import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import allDocuments from '../data/documents.json'

export const useDocumentsStore = defineStore('documents', () => {
    // State
    const unlockedDocumentIds = ref<string[]>([])

    // Getters
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

    const isDocumentUnlocked = computed(() => (id: string): boolean => {
        return unlockedDocumentIds.value.includes(id)
    })

    // Actions
    function unlockDocument(id: string) {
        if (!unlockedDocumentIds.value.includes(id)) {
            unlockedDocumentIds.value.push(id)
        }
    }

    function unlockDocuments(ids: string[]) {
        ids.forEach(id => {
            if (!unlockedDocumentIds.value.includes(id)) {
                unlockedDocumentIds.value.push(id)
            }
        })
    }

    function getDocumentById(id: string) {
        return allDocuments.find((doc: any) => doc.id === id)
    }

    function getDocumentsByContactId(contactId: string) {
        return allDocuments.filter((doc: any) => doc.contactId === contactId)
    }

    function findMediaArray(mediaIds: string[]) {
        if (!mediaIds || mediaIds.length === 0) return []
        return mediaIds
            .map(id => getDocumentById(id))
            .filter((doc): doc is NonNullable<typeof doc> => doc !== undefined)
    }

    function resetDocuments() {
        // Reset to only initial documents
        const initialDocs = allDocuments.filter((doc: any) => doc.initial === true)
        unlockedDocumentIds.value = initialDocs.map((doc: any) => doc.id)
    }

    function initializeDocuments() {
        if (unlockedDocumentIds.value.length === 0) {
            // Initialize with initial documents
            const initialDocs = allDocuments.filter((doc: any) => doc.initial === true)
            unlockedDocumentIds.value = initialDocs.map((doc: any) => doc.id)
        }
    }

    return {
        // State
        unlockedDocumentIds,

        // Getters
        allDocumentsList,
        unlockedDocuments,
        isDocumentUnlocked,

        // Actions
        unlockDocument,
        unlockDocuments,
        getDocumentById,
        getDocumentsByContactId,
        findMediaArray,
        resetDocuments,
        initializeDocuments
    }
})
