import { contactDataMap } from '../data/contactDataMap'
import type { ContactLoaderDependencies } from '../types'



export function useContactLoader(deps: ContactLoaderDependencies) {
    let messageDelayCounter = 0

    const checkTriggeredNarratives = (contactData: any) => {
        if (!contactData) return { messages: [], mediaIds: [], events: [] }

        const timeline = contactData.timeline || []
        const triggeredNarratives: any[] = []

        timeline.forEach((event: any) => {
            if (event.type === 'narrative' && event.triggerAfter) {
                const triggerExists = Object.keys(deps.state.chatHistories).some(cId => {
                    const contactMessages = deps.state.chatHistories[cId] || []
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
    }

    const loadContactData = () => {
        try {
            const contactFile = deps.contact.value?.file
            if (!contactFile) return null

            // Get contact data from direct JSON imports
            const contactData = contactDataMap[contactFile]

            // Add initial message if chat is empty
            if (deps.messages.value.length === 0) {
                messageDelayCounter = 0
                if (contactData.initialMessage) {
                    deps.addDelayedMessage(deps.contactId.value, {
                        id: `msg_initial_${deps.contactId.value}`,
                        content: contactData.initialMessage,
                        sender: 'contact'
                    }, 0)
                    messageDelayCounter++
                }
            }

            // Determine current turn and show narrative messages for turn start
            const currentTurn = deps.getCurrentTurnForContact(deps.contactId.value)
            const narrativeData = deps.getNarrativeMessagesForTurnStart(deps.contactId.value, currentTurn)

            // Check for triggered narratives (from other contacts' success messages)
            const triggeredData = checkTriggeredNarratives(contactData)

            // Show typing indicator if there are narrative messages to display
            if ((narrativeData.messages.length > 0 && narrativeData.messages.some((_: any, index: number) => !deps.isNarrativeShown(`narrative_initial_${currentTurn}_${index}`))) ||
                (triggeredData.messages.length > 0 && triggeredData.events && triggeredData.events.some((event: any) => !deps.isNarrativeShown(`narrative_triggered_${event.id}`)))) {
                deps.isTyping.value = true
            }

            let narrativeDelay = 0
            narrativeData.messages.forEach((message: string, index: number) => {
                const narrativeId = `narrative_initial_${currentTurn}_${index}`
                if (!deps.isNarrativeShown(narrativeId)) {
                    const delay = deps.messages.value.length === 0 ? messageDelayCounter * 2 : narrativeDelay
                    deps.addDelayedMessage(deps.contactId.value, {
                        id: `msg_narrative_initial_${currentTurn}_${index}`,
                        content: message,
                        sender: 'contact'
                    }, delay)
                    deps.setNarrativeShown(narrativeId)
                    if (deps.messages.value.length === 0) {
                        messageDelayCounter++
                    } else {
                        narrativeDelay += 2
                    }
                }
            })

            // Add triggered narrative messages
            triggeredData.messages.forEach((message: string, index: number) => {
                const event = triggeredData.events && triggeredData.events[0]
                if (!event) return
                const narrativeId = `narrative_triggered_${event.id}_${index}`
                if (!deps.isNarrativeShown(narrativeId)) {
                    const delay = deps.messages.value.length === 0 ? messageDelayCounter * 2 : narrativeDelay
                    deps.addDelayedMessage(deps.contactId.value, {
                        id: `msg_narrative_triggered_${event.id}_${index}`,
                        content: message,
                        sender: 'contact'
                    }, delay)
                    deps.setNarrativeShown(narrativeId)
                    if (deps.messages.value.length === 0) {
                        messageDelayCounter++
                    } else {
                        narrativeDelay += 2
                    }
                }
            })

            // Add narrative media if any
            if (narrativeData.mediaIds.length > 0) {
                deps.unlockDocuments(narrativeData.mediaIds)
                const mediaArray = deps.findMediaArray(narrativeData.mediaIds)
                mediaArray.forEach((media: any, mediaIndex: number) => {
                    const narrativeMediaId = `narrative_media_initial_${currentTurn}_${media.id || mediaIndex}`
                    if (!deps.isNarrativeShown(narrativeMediaId)) {
                        const delay = deps.messages.value.length === 0 ? messageDelayCounter * 2 : narrativeDelay
                        deps.addDelayedMessage(deps.contactId.value, {
                            id: `msg_narrative_media_initial_${currentTurn}_${media.id || mediaIndex}`,
                            content: '',
                            sender: 'contact',
                            media: [media]
                        }, delay)
                        deps.setNarrativeShown(narrativeMediaId)
                        if (deps.messages.value.length === 0) {
                            messageDelayCounter++
                        } else {
                            narrativeDelay += 2
                        }
                    }
                })
            }

            // Add triggered narrative media if any
            if (triggeredData.mediaIds.length > 0 && triggeredData.events && triggeredData.events.length > 0) {
                deps.unlockDocuments(triggeredData.mediaIds)
                const triggeredMediaArray = deps.findMediaArray(triggeredData.mediaIds)
                triggeredMediaArray.forEach((media: any, mediaIndex: number) => {
                    const event = triggeredData.events![0]
                    const narrativeMediaId = `narrative_triggered_media_${event.id}_${media.id || mediaIndex}`
                    if (!deps.isNarrativeShown(narrativeMediaId)) {
                        const delay = deps.messages.value.length === 0 ? messageDelayCounter * 2 : narrativeDelay
                        deps.addDelayedMessage(deps.contactId.value, {
                            id: `msg_narrative_triggered_media_${event.id}_${media.id || mediaIndex}`,
                            content: '',
                            sender: 'contact',
                            media: [media]
                        }, delay)
                        deps.setNarrativeShown(narrativeMediaId)
                        if (deps.messages.value.length === 0) {
                            messageDelayCounter++
                        } else {
                            narrativeDelay += 2
                        }
                    }
                })
            }

            // Turn off typing indicator after all narrative messages are sent
            const totalNarrativeDelay = deps.messages.value.length === 0
                ? (messageDelayCounter * 2 * 1000)
                : (narrativeDelay * 1000)
            if (totalNarrativeDelay > 0) {
                setTimeout(() => {
                    deps.isTyping.value = false
                }, totalNarrativeDelay)
            }

            // Show puzzle preQuestion (schedule after any narrative/triggered messages)
            const puzzleEvent = deps.getPuzzleForTurn(deps.contactId.value, currentTurn)

            if (puzzleEvent?.preQuestion && !deps.isPreQuestionShown(`${deps.contactId.value}_${currentTurn}`)) {
                const preQuestionDelay = Math.max(messageDelayCounter * 2, narrativeDelay)
                deps.addDelayedMessage(deps.contactId.value, {
                    id: `msg_prequestion_${deps.contactId.value}_${currentTurn}`,
                    content: puzzleEvent.preQuestion,
                    sender: 'contact'
                }, preQuestionDelay)
                if (deps.messages.value.length === 0) messageDelayCounter++
                deps.setPreQuestionShown(`${deps.contactId.value}_${currentTurn}`, true)
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
