import type { Ref } from 'vue'
import { useMessageScheduler } from './useMessageScheduler'
import { useChatStore } from '../stores/chatStore'
import { useGameStore } from '../stores/gameStore'
import { useDocumentsStore } from '../stores/documentsStore'
import { useNarrativeStore } from '../stores/narrativeStore'

interface TurnTransitionParams {
    contactId: string
    isMessageSending: Ref<boolean>
}

export function useTurnTransition({ contactId, isMessageSending }: TurnTransitionParams) {
    const chatStore = useChatStore()
    const gameStore = useGameStore()
    const documentsStore = useDocumentsStore()
    const narrativeStore = useNarrativeStore()

    const scheduler = useMessageScheduler({
        contactId
    })

    const handleTurnChange = (newTurn: number) => {
        // Don't trigger on initial turn or when sending a message
        if (newTurn <= 1 || isMessageSending.value) return

        scheduler.reset()
        let delay = 0

        const narrativeData = narrativeStore.getNarrativeMessagesForTurnStart(contactId, newTurn)
        const triggeredData = narrativeStore.checkTriggeredNarratives(contactId)

        // Schedule turn-start narrative messages
        narrativeData.messages.forEach((message: string, index: number) => {
            const narrativeId = `narrative_turnstart_${newTurn}_${index}`
            if (!gameStore.isNarrativeShown(narrativeId)) {
                setTimeout(() => {
                    chatStore.addMessage(contactId, {
                        id: `msg_narrative_turnstart_${newTurn}_${index}`,
                        content: message,
                        sender: 'contact',
                        timestamp: Date.now()
                    })
                    gameStore.setNarrativeShown(narrativeId)
                }, delay)
                delay += 2000
            }
        })

        // Schedule turn-start narrative media
        if (narrativeData.mediaIds.length > 0) {
            documentsStore.unlockDocuments(narrativeData.mediaIds)
            const mediaArray = documentsStore.findMediaArray(narrativeData.mediaIds)

            mediaArray.forEach((media: any, idx: number) => {
                const narrativeMediaId = `narrative_media_turnstart_${newTurn}_${idx}`
                if (!gameStore.isNarrativeShown(narrativeMediaId)) {
                    setTimeout(() => {
                        chatStore.addMessage(contactId, {
                            id: `msg_narrative_media_turnstart_${newTurn}_${idx}`,
                            content: '',
                            sender: 'contact',
                            media: [media],
                            timestamp: Date.now()
                        })
                        gameStore.setNarrativeShown(narrativeMediaId)
                    }, delay)
                    delay += 2000
                }
            })
        }

        // Schedule triggered narrative messages (from other contacts)
        if (triggeredData.messages.length > 0 && triggeredData.events.length > 0) {
            documentsStore.unlockDocuments(triggeredData.mediaIds)

            triggeredData.messages.forEach((message: string, index: number) => {
                const event = triggeredData.events[0]
                const narrativeId = `narrative_triggered_${event.id}_${index}`
                if (!gameStore.isNarrativeShown(narrativeId)) {
                    setTimeout(() => {
                        chatStore.addMessage(contactId, {
                            id: `msg_narrative_triggered_${event.id}_${index}`,
                            content: message,
                            sender: 'contact',
                            timestamp: Date.now()
                        })
                        gameStore.setNarrativeShown(narrativeId)
                    }, delay)
                    delay += 2000
                }
            })

            // Schedule triggered media
            if (triggeredData.mediaIds.length > 0) {
                const triggeredMediaArray = documentsStore.findMediaArray(triggeredData.mediaIds)

                triggeredMediaArray.forEach((media: any, idx: number) => {
                    const event = triggeredData.events[0]
                    const narrativeMediaId = `narrative_triggered_media_${event.id}_${media.id || idx}`
                    if (!gameStore.isNarrativeShown(narrativeMediaId)) {
                        setTimeout(() => {
                            chatStore.addMessage(contactId, {
                                id: `msg_narrative_triggered_media_${event.id}_${media.id || idx}`,
                                content: '',
                                sender: 'contact',
                                media: [media],
                                timestamp: Date.now()
                            })
                            gameStore.setNarrativeShown(narrativeMediaId)
                        }, delay)
                        delay += 2000
                    }
                })
            }
        }

        // Schedule pre-question after narratives
        const puzzleEvent = narrativeStore.getPuzzleForTurn(contactId, newTurn)
        if (puzzleEvent?.preQuestion && !gameStore.isPreQuestionShown(`${contactId}_${newTurn}`)) {
            setTimeout(() => {
                chatStore.addMessage(contactId, {
                    id: `msg_prequestion_${contactId}_${newTurn}`,
                    content: puzzleEvent.preQuestion as string,
                    sender: 'contact',
                    timestamp: Date.now()
                })
                gameStore.setPreQuestionShown(`${contactId}_${newTurn}`, true)
            }, delay)
        }
    }

    return {
        handleTurnChange
    }
}
