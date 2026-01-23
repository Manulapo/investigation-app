import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message, ContactHistory, MessageData } from '../types'

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

        // Actions
        addMessage,
        addDelayedMessage,
        markMessagesAsRead,
        setNotificationForContact,
        clearNotificationForContact,
        setTyping,
        setMessageSending,
        clearDelayedMessages,
        resetChatHistories
    }
}, {
    persist: {
        key: 'chat-store',
        pick: ['chatHistories', 'hasNotification'] // Only persist these, not temporary state
    }
})
