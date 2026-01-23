import { contactDataMap } from '../data/contactDataMap'
import type { Ref } from 'vue'
import type { Contact } from '../types'
import type { ContactData, NarrativeEvent, NarrativeResult } from '../types/narrative'
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

    const checkTriggeredNarratives = (contactData: ContactData | null): NarrativeResult => {
        if (!contactData) return { messages: [], mediaIds: [], events: [] }

        const timeline = contactData.timeline || []
        const triggeredNarratives: NarrativeEvent[] = []

        timeline.forEach((event: NarrativeEvent) => {
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
            messages: triggeredNarratives.flatMap((event: NarrativeEvent) => event.messages || []),
            mediaIds: triggeredNarratives.flatMap((event: NarrativeEvent) => event.mediaId || []),
            events: triggeredNarratives
        }
    }

    const loadInitialMessage = (contactData: ContactData, isNewChat: boolean) => {
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

    const loadTriggeredNarratives = (contactData: ContactData, isNewChat: boolean): NarrativeResult => {
        const triggeredData = checkTriggeredNarratives(contactData)
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

    const loadPreQuestion = (currentTurn: number, isNewChat: boolean) => {
        const puzzleEvent = narrativeStore.getPuzzleForTurn(contactId.value, currentTurn)
        const puzzleKey = `${contactId.value}_${currentTurn}`

        if (puzzleEvent?.preQuestion && !gameStore.isPreQuestionShown(puzzleKey)) {
            const delay = scheduler.getCurrentDelay()
            chatStore.addDelayedMessage(contactId.value, {
                id: `msg_prequestion_${puzzleKey}`,
                content: puzzleEvent.preQuestion,
                sender: 'contact'
            }, isNewChat ? delay * 2 : delay)
            gameStore.setPreQuestionShown(puzzleKey, true)
        }
    }

    const shouldShowTypingIndicator = (
        narrativeData: { messages: string[] },
        triggeredData: NarrativeResult,
        currentTurn: number
    ): boolean => {
        const hasInitialNarratives = narrativeData.messages.length > 0 &&
            narrativeData.messages.some((_: any, index: number) =>
                !gameStore.isNarrativeShown(`narrative_initial_${currentTurn}_${index}`)
            )

        const hasTriggeredNarratives = triggeredData.messages.length > 0 &&
            triggeredData.events.length > 0 &&
            triggeredData.events.some((event: NarrativeEvent) =>
                !gameStore.isNarrativeShown(`narrative_triggered_${event.id}_0`)
            )

        return hasInitialNarratives || hasTriggeredNarratives
    }

    const loadContactData = (): ContactData | null => {
        try {
            const contactFile = contact.value?.file
            if (!contactFile) return null

            const contactData: ContactData = contactDataMap[contactFile]
            if (!contactData) return null

            const isNewChat = messages.value.length === 0
            const currentTurn = narrativeStore.getCurrentTurnForContact(contactId.value)

            // Reset scheduler for new load
            scheduler.reset()

            // Get narrative data to check if we should show typing indicator
            const narrativeData = narrativeStore.getNarrativeMessagesForTurnStart(contactId.value, currentTurn)
            const triggeredData = checkTriggeredNarratives(contactData)

            // Show typing indicator if there are narratives to display
            if (shouldShowTypingIndicator(narrativeData, triggeredData, currentTurn)) {
                chatStore.setTyping(contactId.value, true)
            }

            // Load all messages in sequence
            loadInitialMessage(contactData, isNewChat)
            loadTurnNarratives(currentTurn, isNewChat)
            loadTriggeredNarratives(contactData, isNewChat)
            loadPreQuestion(currentTurn, isNewChat)

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
        loadContactData,
        checkTriggeredNarratives
    }
}
