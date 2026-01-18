import type { MessageQueueDependencies } from '../types'

export function useMessageQueue(deps: MessageQueueDependencies) {
    let messageDelayCounter = 0
    const MESSAGE_DELAY_SECONDS = 2 // Configurable delay between messages in seconds

    const addUserMessage = (content: string) => {
        deps.addMessage(deps.contactId.value, {
            id: `msg_user_${Date.now()}`,
            content,
            sender: 'user',
            timestamp: Date.now()
        })
    }

    const addMainResponse = (result: any) => {
        deps.addMessage(deps.contactId.value, {
            id: result.messageId || `msg_auto_${Date.now()}`,
            content: result.text,
            sender: 'contact',
            timestamp: Date.now()
        })

        // Initialize counter with first delay
        messageDelayCounter = MESSAGE_DELAY_SECONDS
    }

    const queueTextMessages = (messages: string[] | undefined) => {
        if (!messages || messages.length === 0) return

        messages.forEach((msg: string) => {
            deps.addDelayedMessage(deps.contactId.value, {
                id: `msg_text_${Date.now()}_${Math.random()}`,
                content: msg,
                sender: 'contact'
            }, messageDelayCounter)

            messageDelayCounter += MESSAGE_DELAY_SECONDS
        })
    }

    const queueSuccessMedia = (media: any) => {
        if (!media) return

        deps.addDelayedMessage(deps.contactId.value, {
            id: `msg_success_media_${Date.now()}`,
            content: '',
            sender: 'contact',
            media
        }, messageDelayCounter)

        messageDelayCounter += MESSAGE_DELAY_SECONDS
    }

    const queueMediaMessages = (mediaId: string | string[] | undefined) => {
        if (!mediaId) return

        const ids = Array.isArray(mediaId) ? mediaId : [mediaId]
        deps.unlockDocuments(ids)

        const mediaArray = deps.findMediaArray(mediaId)
        mediaArray.forEach((media: any) => {
            deps.addDelayedMessage(deps.contactId.value, {
                id: `msg_media_${Date.now()}_${Math.random()}`,
                content: '',
                sender: 'contact',
                media: [media]
            }, messageDelayCounter)

            messageDelayCounter += MESSAGE_DELAY_SECONDS
        })
    }

    const queueEvidenceText = (evidenceText: string | undefined) => {
        if (!evidenceText) return

        deps.addDelayedMessage(deps.contactId.value, {
            id: `msg_evidence_${Date.now()}`,
            content: evidenceText,
            sender: 'contact'
        }, messageDelayCounter)

        messageDelayCounter += MESSAGE_DELAY_SECONDS
    }

    const queueEvidenceMessages = (messages: string[] | undefined) => {
        if (!messages || messages.length === 0) return

        messages.forEach((msg: string) => {
            deps.addDelayedMessage(deps.contactId.value, {
                id: `msg_evidence_${Date.now()}_${Math.random()}`,
                content: msg,
                sender: 'contact'
            }, messageDelayCounter)

            messageDelayCounter += MESSAGE_DELAY_SECONDS
        })
    }

    const queueNarrativeMessages = (result: any) => {
        if (result.status !== 'success' || !result.narrativeMessages || result.narrativeMessages.length === 0) return

        result.narrativeMessages.forEach((message: string, index: number) => {
            deps.addDelayedMessage(deps.contactId.value, {
                id: `msg_narrative_${Date.now()}_${index}`,
                content: message,
                sender: 'contact'
            }, messageDelayCounter)

            messageDelayCounter += MESSAGE_DELAY_SECONDS
        })
    }

    const queueNarrativeMedia = (mediaIds: string[] | undefined) => {
        if (!mediaIds || mediaIds.length === 0) return

        deps.unlockDocuments(mediaIds)
        const narrativeMediaArray = deps.findMediaArray(mediaIds)
        narrativeMediaArray.forEach((media: any) => {
            deps.addDelayedMessage(deps.contactId.value, {
                id: `msg_narrative_media_${Date.now()}_${Math.random()}`,
                content: '',
                sender: 'contact',
                media: [media]
            }, messageDelayCounter)

            messageDelayCounter += MESSAGE_DELAY_SECONDS
        })
    }

    const calculateTotalDelay = (result: any) => {
        return messageDelayCounter * 1000 // Convert to milliseconds
    }

    const handleSuccessActions = (result: any, totalMessageDelay: number) => {
        setTimeout(() => {
            const puzzleEvent = deps.getPuzzleForTurn(deps.contactId.value, deps.currentTurn.value)
            if (puzzleEvent?.preQuestion && !deps.isPreQuestionShown(`${deps.contactId.value}_${deps.currentTurn.value}`)) {
                deps.addMessage(deps.contactId.value, {
                    id: `msg_prequestion_${deps.contactId.value}_${deps.currentTurn.value}`,
                    content: puzzleEvent.preQuestion,
                    sender: 'contact',
                    timestamp: Date.now()
                })
                deps.setPreQuestionShown(`${deps.contactId.value}_${deps.currentTurn.value}`, true)
            }

            // Show notification after all messages are sent and preQuestion is shown
            if (result.notificationContact && result.notificationMessage) {
                deps.show(result.notificationMessage, result.notificationContact)
            }
        }, totalMessageDelay + (MESSAGE_DELAY_SECONDS * 1000))
    }

    const handleFailureActions = (result: any) => {
        if (result.status === 'locked') {
            deps.show('🔒 Sistema Bloccato - Cooldown Attivo')
        }
    }

    const resetCounter = () => {
        messageDelayCounter = 0
    }

    const setCounter = (value: number) => {
        messageDelayCounter = value
    }

    const getCounter = () => messageDelayCounter

    return {
        addUserMessage,
        addMainResponse,
        queueTextMessages,
        queueSuccessMedia,
        queueMediaMessages,
        queueEvidenceText,
        queueEvidenceMessages,
        queueNarrativeMessages,
        queueNarrativeMedia,
        calculateTotalDelay,
        handleSuccessActions,
        handleFailureActions,
        resetCounter,
        setCounter,
        getCounter
    }
}


