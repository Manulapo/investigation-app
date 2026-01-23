import type { MessageData } from '../types'
import { useChatStore } from '../stores/chatStore'
import { useGameStore } from '../stores/gameStore'
import { useDocumentsStore } from '../stores/documentsStore'

interface SchedulerDependencies {
    contactId: string
}

export function useMessageScheduler({ contactId }: SchedulerDependencies) {
    const chatStore = useChatStore()
    const gameStore = useGameStore()
    const documentsStore = useDocumentsStore()

    let currentDelay = 0
    const DELAY_INCREMENT = 2

    const reset = () => {
        currentDelay = 0
    }

    const incrementDelay = (isNewChat: boolean) => {
        if (isNewChat) {
            currentDelay += DELAY_INCREMENT
        } else {
            currentDelay += DELAY_INCREMENT
        }
    }

    const getDelay = (isNewChat: boolean): number => {
        return isNewChat ? currentDelay * 2 : currentDelay
    }

    const scheduleMessage = (
        messageData: MessageData,
        narrativeId: string,
        isNewChat: boolean
    ): boolean => {
        if (gameStore.isNarrativeShown(narrativeId)) {
            return false
        }

        const delay = getDelay(isNewChat)
        chatStore.addDelayedMessage(contactId, messageData, delay)
        gameStore.setNarrativeShown(narrativeId)
        incrementDelay(isNewChat)

        return true
    }

    const scheduleTextMessages = (
        messages: string[],
        idPrefix: string,
        currentTurn: number,
        isNewChat: boolean
    ): number => {
        let scheduled = 0
        messages.forEach((message, index) => {
            const narrativeId = `${idPrefix}_${currentTurn}_${index}`
            const success = scheduleMessage(
                {
                    id: `msg_${idPrefix}_${currentTurn}_${index}`,
                    content: message,
                    sender: 'contact'
                },
                narrativeId,
                isNewChat
            )
            if (success) scheduled++
        })
        return scheduled
    }

    const scheduleMediaMessages = (
        mediaIds: string[],
        idPrefix: string,
        currentTurn: number,
        isNewChat: boolean
    ): number => {
        if (mediaIds.length === 0) return 0

        documentsStore.unlockDocuments(mediaIds)
        const mediaArray = documentsStore.findMediaArray(mediaIds)
        let scheduled = 0

        mediaArray.forEach((media, index) => {
            const narrativeMediaId = `${idPrefix}_media_${currentTurn}_${media.id || index}`
            const success = scheduleMessage(
                {
                    id: `msg_${idPrefix}_media_${currentTurn}_${media.id || index}`,
                    content: '',
                    sender: 'contact',
                    media: [{
                        type: media.type as 'image' | 'pdf' | 'audio',
                        src: media.src,
                        alt: media.alt
                    }]
                },
                narrativeMediaId,
                isNewChat
            )
            if (success) scheduled++
        })

        return scheduled
    }

    const scheduleNarrativeBlock = (
        messages: string[],
        mediaIds: string[],
        prefix: string,
        currentTurn: number,
        isNewChat: boolean
    ): number => {
        const textCount = scheduleTextMessages(messages, prefix, currentTurn, isNewChat)
        const mediaCount = scheduleMediaMessages(mediaIds, prefix, currentTurn, isNewChat)
        return textCount + mediaCount
    }

    const getCurrentDelay = () => currentDelay

    const getTotalDelayMs = (isNewChat: boolean) => {
        return getDelay(isNewChat) * 1000
    }

    return {
        reset,
        incrementDelay,
        getDelay,
        scheduleMessage,
        scheduleTextMessages,
        scheduleMediaMessages,
        scheduleNarrativeBlock,
        getCurrentDelay,
        getTotalDelayMs
    }
}
