import type { ComputedRef } from 'vue'
import type { MessageData } from '../types'
import { useSaveManager } from './useSaveManager'
import { useDocuments } from './useDocuments'
import { useNotification } from './useNotification'
import { useGameEngine } from './useGameEngine'

export function useMessageQueue(
    contactId: ComputedRef<string>,
    currentTurn: ComputedRef<number>,
    addDelayedMessage: (contactId: string, messageData: MessageData, delaySeconds: number) => void
) {
    let messageDelayCounter = 0
    const MESSAGE_DELAY_SECONDS = 2

    const { addMessage, isPreQuestionShown, setPreQuestionShown } = useSaveManager()
    const { unlockDocuments, getDocumentById } = useDocuments()
    const { show } = useNotification()
    const { getPuzzleForTurn } = useGameEngine()

    const findMediaArray = (mediaIds: string | string[]) => {
        const ids = Array.isArray(mediaIds) ? mediaIds : [mediaIds]
        return ids.map(id => getDocumentById(id)).filter(Boolean)
    }

    const addUserMessage = (content: string) => {
        addMessage(contactId.value, {
            id: `msg_user_${Date.now()}`,
            content,
            sender: 'user',
            timestamp: Date.now()
        })
    }

    const addMainResponse = (result: any) => {
        addMessage(contactId.value, {
            id: result.messageId || `msg_auto_${Date.now()}`,
            content: result.text,
            sender: 'contact',
            timestamp: Date.now()
        })

        // Initialize counter with first delay
        messageDelayCounter = MESSAGE_DELAY_SECONDS
    }

    // Message creator factory function with switch statement
    const createMessage = (type: 'text' | 'media' | 'evidence' | 'narrative' | 'narrativeMedia', item: any, index = 0): MessageData => {
        const baseMessage = {
            id: generateMessageId(type, index),
            sender: 'contact' as const
        }

        // Text-based messages
        if (type === 'text' || type === 'evidence' || type === 'narrative') {
            return { ...baseMessage, content: item }
        }

        // Media-based messages
        return { ...baseMessage, content: '', media: [item] }
    }

    const generateMessageId = (type: string, index: number): string => {
        const timestamp = Date.now()
        const random = Math.random()

        switch (type) {
            case 'narrative':
                return `msg_${type}_${timestamp}_${index}`
            default:
                return `msg_${type}_${timestamp}_${random}`
        }
    }

    // Generic helper to queue messages and reduce code duplication
    const queueMessages = (items: any[], type: 'text' | 'media' | 'evidence' | 'narrative' | 'narrativeMedia') => {
        items.forEach((item, index) => {
            const message = createMessage(type, item, index)
            addDelayedMessage(contactId.value, message, messageDelayCounter)
            messageDelayCounter += MESSAGE_DELAY_SECONDS
        })
    }

    // Queue one or more text messages
    const queueTextMessages = (messages: string[] | undefined) => {
        if (!messages || messages.length === 0) return
        queueMessages(messages, 'text')
    }

    // Queue a single success media message
    const queueSuccessMedia = (media: any) => {
        if (!media) return

        addDelayedMessage(contactId.value, {
            id: `msg_success_media_${Date.now()}`,
            content: '',
            sender: 'contact',
            media
        }, messageDelayCounter)

        messageDelayCounter += MESSAGE_DELAY_SECONDS
    }

    // Queue one or more media messages
    const queueMediaMessages = (mediaId: string | string[] | undefined) => {
        if (!mediaId) return

        const ids = Array.isArray(mediaId) ? mediaId : [mediaId]
        unlockDocuments(ids)

        const mediaArray = findMediaArray(mediaId)
        queueMessages(mediaArray, 'media')
    }


    // Queue a single evidence text message
    const queueEvidenceText = (evidenceText: string | undefined) => {
        if (!evidenceText) return

        addDelayedMessage(contactId.value, {
            id: `msg_evidence_${Date.now()}`,
            content: evidenceText,
            sender: 'contact'
        }, messageDelayCounter)

        messageDelayCounter += MESSAGE_DELAY_SECONDS
    }

    // Queue multiple evidence text messages
    const queueEvidenceMessages = (messages: string[] | undefined) => {
        if (!messages || messages.length === 0) return
        queueMessages(messages, 'evidence')
    }

    // Queue multiple narrative text messages
    const queueNarrativeMessages = (result: any) => {
        if (result.status !== 'success' || !result.narrativeMessages || result.narrativeMessages.length === 0) return
        queueMessages(result.narrativeMessages, 'narrative')
    }


    // Queue multiple narrative media messages
    const queueNarrativeMedia = (mediaIds: string[] | undefined) => {
        if (!mediaIds || mediaIds.length === 0) return

        unlockDocuments(mediaIds)
        const narrativeMediaArray = findMediaArray(mediaIds)
        queueMessages(narrativeMediaArray, 'narrativeMedia')
    }

    const calculateTotalDelay = (result: any) => {
        return messageDelayCounter * 1000 // Convert to milliseconds
    }

    const handleSuccessActions = (result: any, totalMessageDelay: number) => {
        setTimeout(() => {
            const puzzleEvent = getPuzzleForTurn(contactId.value, currentTurn.value)
            if (puzzleEvent?.preQuestion && !isPreQuestionShown(`${contactId.value}_${currentTurn.value}`)) {
                addMessage(contactId.value, {
                    id: `msg_prequestion_${contactId.value}_${currentTurn.value}`,
                    content: puzzleEvent.preQuestion,
                    sender: 'contact',
                    timestamp: Date.now()
                })
                setPreQuestionShown(`${contactId.value}_${currentTurn.value}`, true)
            }

            // Show notification after all messages are sent and preQuestion is shown
            if (result.notificationContact && result.notificationMessage) {
                show(result.notificationMessage, result.notificationContact)
            }
        }, totalMessageDelay + (MESSAGE_DELAY_SECONDS * 1000))
    }

    const handleFailureActions = (result: any) => {
        if (result.status === 'locked') {
            show('🔒 Sistema Bloccato - Cooldown Attivo')
        }
    }

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
        handleFailureActions
    }
}


