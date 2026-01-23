import type { Ref } from 'vue'
import type { Contact } from '../types'
import { useMessageScheduler } from './useMessageScheduler'
import { useChatStore } from '../stores/chatStore'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'

interface ContactLoaderParams {
    contactId: Ref<string>
    contact: Ref<Contact | null>
    messages: Ref<any[]>
}

export function useContactLoader({ contactId, contact, messages }: ContactLoaderParams) {
    const chatStore = useChatStore()
    const gameStore = useGameStore()
    const narrativeStore = useNarrativeStore()

    const scheduler = useMessageScheduler({
        contactId: contactId.value
    })

    const loadInitialMessage = (contactData: any, isNewChat: boolean) => {
        if (!isNewChat || !contactData.initialMessage) return

        scheduler.scheduleMessage(
            {
                id: `msg_initial_${contactId.value}`,
                content: contactData.initialMessage,
                sender: 'contact'
            },
            `initial_${contactId.value}`,
            true
        )
    }

    const accountForExistingInitialMessage = (contactData: any, isNewChat: boolean) => {
        // If it's not a new chat but the initial message exists in the chat history,
        // we need to increment the delay counter to account for it
        if (!isNewChat && contactData.initialMessage) {
            const hasInitialMessage = messages.value.some((msg: any) =>
                msg.id === `msg_initial_${contactId.value}`
            )
            if (hasInitialMessage) {
                scheduler.incrementDelay(false)
            }
        }
    }

    const loadTurnNarratives = (currentTurn: number, isNewChat: boolean): number => {
        const narrativeData = narrativeStore.getNarrativeMessagesForTurnStart(contactId.value, currentTurn)
        return scheduler.scheduleNarrativeBlock(
            narrativeData.messages,
            narrativeData.mediaIds,
            'narrative_initial',
            currentTurn,
            isNewChat
        )
    }

    const loadTriggeredNarratives = (isNewChat: boolean) => {
        // Use narrativeStore's checkTriggeredNarratives instead of local duplicate
        const triggeredData = narrativeStore.checkTriggeredNarratives(contactId.value)
        if (triggeredData.events.length === 0) return triggeredData

        const event = triggeredData.events[0]
        scheduler.scheduleNarrativeBlock(
            triggeredData.messages,
            triggeredData.mediaIds,
            `narrative_triggered_${event.id}`,
            0, // Not turn-based
            isNewChat
        )

        return triggeredData
    }

    const loadPreQuestion = (currentTurn: number, isNewChat: boolean, contactData: any | null) => {
        let puzzleEvent: any = null
        let puzzleKey = ''

        if (isNewChat && contactData) {
            // For new chats, find the first puzzle in the timeline
            const timeline = contactData.timeline || []
            const firstPuzzle = timeline.find((event: any) => event.type === 'puzzle')
            if (firstPuzzle) {
                puzzleEvent = firstPuzzle
                puzzleKey = `${contactId.value}_${firstPuzzle.turnId}`
            }
        } else {
            // For existing chats, use the current turn
            puzzleEvent = narrativeStore.getPuzzleForTurn(contactId.value, currentTurn)
            puzzleKey = `${contactId.value}_${currentTurn}`
        }

        if (puzzleEvent?.preQuestion && !gameStore.isPreQuestionShown(puzzleKey)) {
            // Mark as shown immediately to prevent duplicate scheduling
            gameStore.setPreQuestionShown(puzzleKey, true)

            const delay = scheduler.getDelay(isNewChat)

            // Schedule the message
            setTimeout(() => {
                chatStore.addMessage(contactId.value, {
                    id: `msg_prequestion_${puzzleKey}`,
                    content: puzzleEvent.preQuestion,
                    sender: 'contact',
                    timestamp: Date.now()
                })
            }, delay * 1000)

            scheduler.incrementDelay(isNewChat)
        }
    }

    const shouldShowTypingIndicator = (
        narrativeData: { messages: string[] },
        triggeredData: any,
        currentTurn: number
    ): boolean => {
        const hasInitialNarratives = narrativeData.messages.length > 0 &&
            narrativeData.messages.some((_: any, index: number) =>
                !gameStore.isNarrativeShown(`narrative_initial_${currentTurn}_${index}`)
            )

        const hasTriggeredNarratives = triggeredData.messages.length > 0 &&
            triggeredData.events.length > 0 &&
            triggeredData.events.some((event: any) =>
                !gameStore.isNarrativeShown(`narrative_triggered_${event.id}_0`)
            )

        return hasInitialNarratives || hasTriggeredNarratives
    }

    const loadContactData = () => {
        try {
            const contactFile = contact.value?.file
            if (!contactFile) return null

            const contactData = narrativeStore.findContactFile(contactId.value)
            if (!contactData) return null

            const isNewChat = messages.value.length === 0
            const currentTurn = narrativeStore.getCurrentTurnForContact(contactId.value)

            // Reset scheduler for new load
            scheduler.reset()

            // Get narrative data to check if we should show typing indicator
            const narrativeData = narrativeStore.getNarrativeMessagesForTurnStart(contactId.value, currentTurn)
            const triggeredData = narrativeStore.checkTriggeredNarratives(contactId.value)

            // Show typing indicator if there are narratives to display
            if (shouldShowTypingIndicator(narrativeData, triggeredData, currentTurn)) {
                chatStore.setTyping(contactId.value, true)
            }

            // Load all messages in sequence
            loadInitialMessage(contactData, isNewChat)
            accountForExistingInitialMessage(contactData, isNewChat)
            loadTurnNarratives(currentTurn, isNewChat)
            loadTriggeredNarratives(isNewChat)
            loadPreQuestion(currentTurn, isNewChat, contactData)

            // Turn off typing indicator after all messages are sent
            const totalDelay = scheduler.getTotalDelayMs(isNewChat)
            if (totalDelay > 0) {
                setTimeout(() => {
                    chatStore.setTyping(contactId.value, false)
                }, totalDelay)
            }

            return contactData
        } catch (error) {
            console.error('Error loading contact data:', error)
            return null
        }
    }

    return {
        loadContactData
    }
}
