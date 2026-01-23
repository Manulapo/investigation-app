import { defineStore } from 'pinia'
import { computed } from 'vue'
import { contactDataMap } from '../data/contactDataMap'
import registry from '../data/registry.json'
import type { ContactData, PuzzleEvent } from '../types/narrative'
import { useChatStore } from './chatStore'

export const useNarrativeStore = defineStore('narrative', () => {
    const chatStore = useChatStore()

    // Getters
    const findContactFile = computed(() => (id: string): ContactData | null => {
        const contact = registry.find((c: any) => c.id === id)
        if (!contact) return null
        return contactDataMap[contact.file] || null
    })

    const getNarrativeMessagesForTurnStart = computed(() => (contactId: string, turnId: number) => {
        const contact = findContactFile.value(contactId)
        if (!contact) return { messages: [], mediaIds: [] }

        const timeline = contact.timeline || []
        const narrativeEvents = timeline.filter((event: any) =>
            event.type === 'narrative' &&
            event.turnId === turnId &&
            event.triggerAfter === null
        )

        return {
            messages: narrativeEvents.flatMap((event: any) => event.messages || []),
            mediaIds: narrativeEvents.flatMap((event: any) => event.mediaId || [])
        }
    })

    const getPuzzleForTurn = computed(() => (contactId: string, turnId: number): PuzzleEvent | null => {
        const contact = findContactFile.value(contactId)
        if (!contact) return null

        const timeline = contact.timeline || []
        const puzzleEvent = timeline.find((event: any) =>
            event.type === 'puzzle' && event.turnId === turnId
        )
        return puzzleEvent as PuzzleEvent | null
    })

    const getCurrentTurnForContact = computed(() => (contactId: string): number => {
        const messages = chatStore.getMessages(contactId)
        if (messages.length === 0) return 1

        // Find the highest turn number in message IDs
        let maxTurn = 1
        messages.forEach((msg: any) => {
            const match = msg.id.match(/_(\d+)_/)
            if (match) {
                const turn = parseInt(match[1], 10)
                if (turn > maxTurn) maxTurn = turn
            }
        })
        return maxTurn
    })

    const checkTriggeredNarratives = computed(() => (contactId: string) => {
        const contactData = findContactFile.value(contactId)
        if (!contactData) return { messages: [], mediaIds: [], events: [] }

        const timeline = contactData.timeline || []
        const triggeredNarratives: any[] = []

        timeline.forEach((event: any) => {
            if (event.type === 'narrative' && event.triggerAfter) {
                const triggerExists = Object.keys(chatStore.chatHistories).some(cId => {
                    const contactMessages = chatStore.chatHistories[cId] || []
                    return contactMessages.some((msg: any) => msg.id === event.triggerAfter)
                })

                if (triggerExists) {
                    triggeredNarratives.push(event)
                }
            }
        })

        return {
            messages: triggeredNarratives.flatMap((event: any) => event.messages || []),
            mediaIds: triggeredNarratives.flatMap((event: any) => event.mediaId || []),
            events: triggeredNarratives
        }
    })

    return {
        // Getters
        findContactFile,
        getNarrativeMessagesForTurnStart,
        getPuzzleForTurn,
        getCurrentTurnForContact,
        checkTriggeredNarratives
    }
})
