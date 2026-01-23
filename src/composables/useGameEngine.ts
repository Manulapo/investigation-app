import { contactDataMap } from '../data/contactDataMap'
import penaltyResponsesData from '../data/penaltyResponses.json'
import registry from '../data/registry.json'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'

const REGEX = /^T(\d+):\s*(.+)$/i
const penaltyResponses: string[] = penaltyResponsesData

export function useGameEngine() {
  const gameStore = useGameStore()
  const narrativeStore = useNarrativeStore()

  function findContactFile(id: string) {
    // Use the centralized contactDataMap
    const contact = registry.find((c: any) => c.id === id)
    if (!contact) return null
    return contactDataMap[contact.file] || null
  }

  function randomItem(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  function parseInput(contactId: string, input: string) {
    const m = input.match(REGEX)
    if (!m) return { status: 'invalid', text: 'Formato errato. Usa T{n}: {parola chiave}' }

    const turnId = Number(m[1])
    const msg = m[2].trim()

    const contact = findContactFile(contactId)
    if (!contact) return { status: 'error', text: 'Contatto non trovato' }

    // Find puzzle event in timeline
    const timeline = contact.timeline || []
    const puzzleEvent = timeline.find((event: any) =>
      event.type === 'puzzle' && event.turnId === turnId
    )

    if (!puzzleEvent) return { status: 'error', text: 'Nessun enigma per questo turno' }

    const key = `${contactId}_${turnId}`

    // CHECK 0: Show preQuestion if it exists and hasn't been shown yet
    if (puzzleEvent.preQuestion && !gameStore.isPreQuestionShown(key)) {
      gameStore.setPreQuestionShown(key, true)
      return { status: 'prequestion', text: puzzleEvent.preQuestion }
    }

    // CHECK 1: Is the System Locked?
    if (gameStore.isLocked(key)) {
      const penaltyText = randomItem(penaltyResponses)
      return { status: 'locked', text: penaltyText }
    }

    // tokenize
    const words = msg.toLowerCase().split(/\W+/).filter(Boolean)

    // CHECK 2: Exact Solution Match
    const solKeys = (puzzleEvent.solution.keywords || []).map((s: string) => s.toLowerCase())
    const solved = solKeys.every((k: string) => words.includes(k))
    if (solved) {
      const response = puzzleEvent.solution.response
      gameStore.advanceTurn(response.nextTurn || (turnId + 1))
      gameStore.resetFailed(key)

      // Check if notification is properly configured
      const hasValidNotification = puzzleEvent.notification?.notificationContact && puzzleEvent.notification?.notificationMessage

      // Use narrativeStore to find triggered narratives
      const narrativeData = findTriggeredNarratives(contact, response.messageId)

      // Normalize text and evidenceText to arrays
      const textArray = Array.isArray(response.text) ? response.text : [response.text]
      const evidenceTextArray = response.evidenceText
        ? (Array.isArray(response.evidenceText) ? response.evidenceText : [response.evidenceText])
        : []

      return {
        status: 'success',
        text: textArray[0], // First message as main response
        textMessages: textArray.slice(1), // Additional messages
        mediaId: response.mediaId,
        evidenceText: evidenceTextArray[0], // First evidence as main
        evidenceTextMessages: evidenceTextArray.slice(1), // Additional evidence
        messageId: response.messageId,
        successMedia: response.successMedia,
        showNotification: hasValidNotification,
        notificationContact: puzzleEvent.notification?.notificationContact,
        notificationMessage: puzzleEvent.notification?.notificationMessage,
        narrativeMessages: narrativeData.messages,
        narrativeMediaIds: narrativeData.mediaIds
      }
    }

    // CHECK 3: General Failure (Randomized)
    const attempts = gameStore.incrementFailed(key)
    const fallbackText = randomItem(puzzleEvent.fallbacks || ['Wrong.'])

    if (attempts >= (puzzleEvent.maxAttempts || 3)) {
      const until = Date.now() + (puzzleEvent.penaltySeconds || 10) * 1000
      gameStore.setLockUntil(key, until)
      const lockMsg = randomItem(penaltyResponses)
      return { status: 'locked', text: lockMsg }
    }

    return { status: 'fail', text: fallbackText }
  }

  // Find narrative messages triggered by a specific event
  function findTriggeredNarratives(contact: any, triggerMessageId: string) {
    const timeline = contact.timeline || []
    const narrativeEvents = timeline.filter((event: any) =>
      event.type === 'narrative' && event.triggerAfter === triggerMessageId
    )
    return {
      messages: narrativeEvents.flatMap((event: any) => event.messages || []),
      mediaIds: narrativeEvents.flatMap((event: any) => event.mediaId || [])
    }
  }

  return {
    parseInput,
    // Re-export store methods for convenience
    getNarrativeMessagesForTurnStart: narrativeStore.getNarrativeMessagesForTurnStart,
    getPuzzleForTurn: narrativeStore.getPuzzleForTurn
  }
}