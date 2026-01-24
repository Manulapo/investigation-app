import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message, ContactHistory, MessageData } from '../types'
import { useGameStore } from './gameStore'
import { useDocumentsStore } from './documentsStore'
import { useNarrativeStore } from './narrativeStore'
import registry from '../data/registry.json'

export const useChatStore = defineStore('chat', () => {
    // State
    const chatHistories = ref<Record<string, ContactHistory>>({})
    const hasNotification = ref<Record<string, boolean>>({})
    const delayedMessages = ref<Map<string, any>>(new Map())
    const typingIndicators = ref<Record<string, boolean>>({})
    const messageSending = ref<Record<string, boolean>>({})

    // Getters
    const getMessages = computed(() => (contactId: string): Message[] => {
        return chatHistories.value[contactId] || []
    })

    const getUnreadCount = computed(() => (contactId: string): number => {
        return hasNotification.value[contactId] ? 1 : 0
    })

    const isTyping = computed(() => (contactId: string): boolean => {
        return typingIndicators.value[contactId] === true
    })

    const isMessageSending = computed(() => (contactId: string): boolean => {
        return messageSending.value[contactId] === true
    })

    // Actions
    function addMessage(contactId: string, msg: Message) {
        if (!chatHistories.value[contactId]) {
            chatHistories.value[contactId] = []
        }
        // User messages are always read
        const messageWithReadStatus = {
            ...msg,
            isRead: msg.sender === 'user' ? true : (msg.isRead ?? true)
        }
        chatHistories.value[contactId].push(messageWithReadStatus)
    }

    function addDelayedMessage(contactId: string, messageData: MessageData, delaySeconds: number) {
        const timeoutId = setTimeout(() => {
            addMessage(contactId, {
                ...messageData,
                timestamp: Date.now()
            })
            delayedMessages.value.delete(`${contactId}_${messageData.id}`)
        }, delaySeconds * 1000)

        delayedMessages.value.set(`${contactId}_${messageData.id}`, timeoutId)
    }

    function markMessagesAsRead(contactId: string) {
        const messages = getMessages.value(contactId)
        messages.forEach((msg: Message) => {
            if (msg.sender === 'contact' && !msg.isRead) {
                msg.isRead = true
            }
        })
    }

    function setNotificationForContact(contactId: string) {
        hasNotification.value[contactId] = true
    }

    function clearNotificationForContact(contactId: string) {
        hasNotification.value[contactId] = false
    }

    function setTyping(contactId: string, typing: boolean) {
        typingIndicators.value[contactId] = typing
    }

    function setMessageSending(contactId: string, sending: boolean) {
        messageSending.value[contactId] = sending
    }

    function clearDelayedMessages(contactId?: string) {
        if (contactId) {
            // Clear specific contact's delayed messages
            delayedMessages.value.forEach((timeoutId, key) => {
                if (key.startsWith(`${contactId}_`)) {
                    clearTimeout(timeoutId)
                    delayedMessages.value.delete(key)
                }
            })
        } else {
            // Clear all delayed messages
            delayedMessages.value.forEach((timeoutId) => clearTimeout(timeoutId))
            delayedMessages.value.clear()
        }
    }

    function resetChatHistories() {
        chatHistories.value = {}
        hasNotification.value = {}
        clearDelayedMessages()
        typingIndicators.value = {}
        messageSending.value = {}
    }

    // ============================================
    // MESSAGE SCHEDULING & QUEUING
    // ============================================

    const MESSAGE_DELAY_SECONDS = 2

    /**
     * Queue puzzle response messages in order:
     * 1. Main response (already added)
     * 2. Additional text messages
     * 3. Success media or regular media
     * 4. Evidence text
     * 5. Evidence text messages
     * 6. Narrative messages
     * 7. Narrative media
     */
    function queuePuzzleResponse(contactId: string, result: any): number {
        const documentsStore = useDocumentsStore()
        let messageDelayCounter = MESSAGE_DELAY_SECONDS

        // Helper to create messages
        const createMessage = (type: string, item: any, index = 0): MessageData => {
            const baseMessage = {
                id: `msg_${type}_${Date.now()}_${index}`,
                sender: 'contact' as const
            }
            return type.includes('media')
                ? { ...baseMessage, content: '', media: [item] }
                : { ...baseMessage, content: item }
        }

        // Helper to queue messages
        const queueMessages = (items: any[], type: string) => {
            items.forEach((item, index) => {
                const message = createMessage(type, item, index)
                addDelayedMessage(contactId, message, messageDelayCounter)
                messageDelayCounter += MESSAGE_DELAY_SECONDS
            })
        }

        // 1. Additional text messages
        if (result.textMessages?.length > 0) {
            queueMessages(result.textMessages, 'text')
        }

        // 2. Success media or regular media
        if (result.successMedia) {
            addDelayedMessage(contactId, {
                id: `msg_success_media_${Date.now()}`,
                content: '',
                sender: 'contact',
                media: result.successMedia
            }, messageDelayCounter)
            messageDelayCounter += MESSAGE_DELAY_SECONDS
        } else if (result.mediaId) {
            const ids = Array.isArray(result.mediaId) ? result.mediaId : [result.mediaId]
            documentsStore.unlockDocuments(ids)
            const mediaArray = documentsStore.findMediaArray(result.mediaId)
            queueMessages(mediaArray, 'media')
        }

        // 3. Evidence text
        if (result.evidenceText) {
            addDelayedMessage(contactId, {
                id: `msg_evidence_${Date.now()}`,
                content: result.evidenceText,
                sender: 'contact'
            }, messageDelayCounter)
            messageDelayCounter += MESSAGE_DELAY_SECONDS
        }

        // 4. Evidence text messages
        if (result.evidenceTextMessages?.length > 0) {
            queueMessages(result.evidenceTextMessages, 'evidence')
        }

        // 5. Narrative messages
        if (result.status === 'success' && result.narrativeMessages?.length > 0) {
            queueMessages(result.narrativeMessages, 'narrative')
        }

        // 6. Narrative media
        if (result.narrativeMediaIds?.length > 0) {
            documentsStore.unlockDocuments(result.narrativeMediaIds)
            const narrativeMediaArray = documentsStore.findMediaArray(result.narrativeMediaIds)
            queueMessages(narrativeMediaArray, 'narrativeMedia')
        }

        return messageDelayCounter * 1000 // Return total delay in milliseconds
    }

    /**
     * Load contact messages in correct order when chat is opened
     */
    function loadContactMessages(contactId: string): number {
        const gameStore = useGameStore()
        const documentsStore = useDocumentsStore()
        const narrativeStore = useNarrativeStore()

        const contactData = narrativeStore.findContactFile(contactId)
        if (!contactData) return 0

        const messages = getMessages.value(contactId)
        const hasUserMessages = messages.some((msg: any) => msg.sender === 'user')
        const isNewChat = !hasUserMessages
        const currentTurn = narrativeStore.getCurrentTurnForContact(contactId)

        let delay = 0
        const DELAY_INCREMENT = isNewChat ? 4000 : 2000

        // 1. Initial message (immediately)
        const messageId = `msg_initial_${contactId}`
        const hasInitialMessage = messages.some((msg: any) => msg.id === messageId)

        if (contactData.initialMessage && !hasInitialMessage) {
            const narrativeId = `initial_${contactId}`
            if (!gameStore.isNarrativeShown(narrativeId)) {
                addMessage(contactId, {
                    id: messageId,
                    content: contactData.initialMessage,
                    sender: 'contact',
                    timestamp: Date.now()
                })
                gameStore.setNarrativeShown(narrativeId)
            }
        }

        if (contactData.initialMessage) {
            delay += DELAY_INCREMENT
        }

        // 2. Narrative messages for current turn
        const narrativeData = narrativeStore.getNarrativeMessagesForTurnStart(contactId, currentTurn)
        narrativeData.messages.forEach((message: string, index: number) => {
            const narrativeId = `narrative_initial_${currentTurn}_${index}`
            if (!gameStore.isNarrativeShown(narrativeId)) {
                setTimeout(() => {
                    addMessage(contactId, {
                        id: `msg_narrative_initial_${currentTurn}_${index}`,
                        content: message,
                        sender: 'contact',
                        timestamp: Date.now()
                    })
                    gameStore.setNarrativeShown(narrativeId)
                }, delay)
                delay += DELAY_INCREMENT
            }
        })

        // 3. Narrative media
        if (narrativeData.mediaIds.length > 0) {
            documentsStore.unlockDocuments(narrativeData.mediaIds)
            const mediaArray = documentsStore.findMediaArray(narrativeData.mediaIds)
            mediaArray.forEach((media: any, index: number) => {
                const narrativeMediaId = `narrative_media_initial_${currentTurn}_${index}`
                if (!gameStore.isNarrativeShown(narrativeMediaId)) {
                    setTimeout(() => {
                        addMessage(contactId, {
                            id: `msg_narrative_media_initial_${currentTurn}_${index}`,
                            content: '',
                            sender: 'contact',
                            media: [media],
                            timestamp: Date.now()
                        })
                        gameStore.setNarrativeShown(narrativeMediaId)
                    }, delay)
                    delay += DELAY_INCREMENT
                }
            })
        }

        // 4. Triggered narratives
        const triggeredData = narrativeStore.checkTriggeredNarratives(contactId)
        if (triggeredData.events.length > 0) {
            triggeredData.events.forEach((event: any) => {
                const messages = event.messages || []
                const mediaIds = event.mediaId || []

                if (mediaIds.length > 0) {
                    documentsStore.unlockDocuments(mediaIds)
                }

                messages.forEach((message: string, index: number) => {
                    const narrativeId = `narrative_triggered_${event.id}_${index}`
                    if (!gameStore.isNarrativeShown(narrativeId)) {
                        setTimeout(() => {
                            addMessage(contactId, {
                                id: `msg_narrative_triggered_${event.id}_${index}`,
                                content: message,
                                sender: 'contact',
                                timestamp: Date.now()
                            })
                            gameStore.setNarrativeShown(narrativeId)
                        }, delay)
                        delay += DELAY_INCREMENT
                    }
                })

                if (mediaIds.length > 0) {
                    const mediaArray = documentsStore.findMediaArray(mediaIds)
                    mediaArray.forEach((media: any, idx: number) => {
                        const narrativeMediaId = `narrative_triggered_media_${event.id}_${idx}`
                        if (!gameStore.isNarrativeShown(narrativeMediaId)) {
                            setTimeout(() => {
                                addMessage(contactId, {
                                    id: `msg_narrative_triggered_media_${event.id}_${idx}`,
                                    content: '',
                                    sender: 'contact',
                                    media: [media],
                                    timestamp: Date.now()
                                })
                                gameStore.setNarrativeShown(narrativeMediaId)
                            }, delay)
                            delay += DELAY_INCREMENT
                        }
                    })
                }
            })
        }

        // 5. Pre-question for current puzzle
        const puzzleEvent = narrativeStore.getPuzzleForTurn(contactId, currentTurn)
        const puzzleKey = `${contactId}_${currentTurn}`

        if (puzzleEvent?.preQuestion && !gameStore.isPreQuestionShown(puzzleKey)) {
            gameStore.setPreQuestionShown(puzzleKey, true)
            setTimeout(() => {
                addMessage(contactId, {
                    id: `msg_prequestion_${puzzleKey}`,
                    content: puzzleEvent.preQuestion!,
                    sender: 'contact',
                    timestamp: Date.now()
                })
            }, delay)
            delay += DELAY_INCREMENT
        }

        // Manage typing indicator
        if (delay > 0) {
            setTyping(contactId, true)
            setTimeout(() => setTyping(contactId, false), delay)
        }

        return delay
    }

    /**
     * Handle turn transition - add narratives for new turn
     */
    function handleTurnTransition(contactId: string, newTurn: number, isMessageSending: boolean): void {
        if (newTurn <= 1 || isMessageSending) return

        const gameStore = useGameStore()
        const documentsStore = useDocumentsStore()
        const narrativeStore = useNarrativeStore()

        let delay = 0
        const narrativeData = narrativeStore.getNarrativeMessagesForTurnStart(contactId, newTurn)

        // Schedule turn-start narrative messages
        narrativeData.messages.forEach((message: string, index: number) => {
            const narrativeId = `narrative_turnstart_${newTurn}_${index}`
            if (!gameStore.isNarrativeShown(narrativeId)) {
                setTimeout(() => {
                    addMessage(contactId, {
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
                        addMessage(contactId, {
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

        // Schedule triggered narratives
        const triggeredData = narrativeStore.checkTriggeredNarratives(contactId)
        if (triggeredData.messages.length > 0 && triggeredData.events.length > 0) {
            documentsStore.unlockDocuments(triggeredData.mediaIds)

            triggeredData.messages.forEach((message: string, index: number) => {
                const event = triggeredData.events[0]
                const narrativeId = `narrative_triggered_${event.id}_${index}`
                if (!gameStore.isNarrativeShown(narrativeId)) {
                    setTimeout(() => {
                        addMessage(contactId, {
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
                            addMessage(contactId, {
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
    }

    /**
     * Check and schedule triggered narratives across all contacts
     */
    function scheduleTriggeredNarratives(triggerId: string): void {
        const gameStore = useGameStore()
        const documentsStore = useDocumentsStore()
        const narrativeStore = useNarrativeStore()

        registry.forEach((contact: any) => {
            const contactId = contact.id
            const triggeredData = narrativeStore.checkTriggeredNarratives(contactId)

            if (triggeredData.events.length === 0) return

            // Filter events triggered by this specific message ID
            const relevantEvents = triggeredData.events.filter((event: any) =>
                event.triggerAfter === triggerId
            )

            if (relevantEvents.length === 0) return

            // Only add to opened contacts (with user messages)
            const contactMessages = getMessages.value(contactId)
            const hasUserMessages = contactMessages.some((msg: any) => msg.sender === 'user')
            if (!hasUserMessages) return

            // Schedule each event's messages
            relevantEvents.forEach((event: any) => {
                const eventMessages = event.messages || []
                const mediaIds = event.mediaId || []

                if (mediaIds.length > 0) {
                    documentsStore.unlockDocuments(mediaIds)
                }

                let delay = 2000
                eventMessages.forEach((message: string, index: number) => {
                    const narrativeId = `narrative_triggered_${event.id}_${index}`
                    if (!gameStore.isNarrativeShown(narrativeId)) {
                        setTimeout(() => {
                            addMessage(contactId, {
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

                // Schedule media
                if (mediaIds.length > 0) {
                    const mediaArray = documentsStore.findMediaArray(mediaIds)
                    mediaArray.forEach((media: any, idx: number) => {
                        const narrativeMediaId = `narrative_triggered_media_${event.id}_${media.id || idx}`
                        if (!gameStore.isNarrativeShown(narrativeMediaId)) {
                            setTimeout(() => {
                                addMessage(contactId, {
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
            })
        })
    }

    return {
        // State
        chatHistories,
        hasNotification,
        delayedMessages,
        typingIndicators,
        messageSending,

        // Getters
        getMessages,
        getUnreadCount,
        isTyping,
        isMessageSending,

        // Basic Actions
        addMessage,
        addDelayedMessage,
        markMessagesAsRead,
        setNotificationForContact,
        clearNotificationForContact,
        setTyping,
        setMessageSending,
        clearDelayedMessages,
        resetChatHistories,

        // Advanced Message Scheduling
        queuePuzzleResponse,
        loadContactMessages,
        handleTurnTransition,
        scheduleTriggeredNarratives
    }
}, {
    persist: {
        key: 'chat-store',
        pick: ['chatHistories', 'hasNotification'] // Only persist these, not temporary state
    }
})
