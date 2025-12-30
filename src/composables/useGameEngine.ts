import c1Data from '../data/contacts/c1_informant.json'
import c2Data from '../data/contacts/c2_informant.json'
import c3Data from '../data/contacts/c3_risolutore.json'
import penaltyResponses from '../data/penaltyResponses.json'
import { useSaveManager } from './useSaveManager'

const REGEX = /^T(\d+):\s*(.+)$/i

export function useGameEngine() {
  const { incrementFailed, resetFailed, setLockUntil, isLocked, getLockedUntil, advanceTurn, isPreQuestionShown, setPreQuestionShown } = useSaveManager()

  function findContactFile(id: string) {
    if (id === 'c1') return c1Data as any
    if (id === 'c2') return c2Data as any
    if (id === 'c3') return c3Data as any
    return null
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
    if (puzzleEvent.preQuestion && !isPreQuestionShown(key)) {
      setPreQuestionShown(key, true)
      return { status: 'prequestion', text: puzzleEvent.preQuestion }
    }

    // CHECK 1: Is the System Locked?
    if (isLocked(key)) {
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
      advanceTurn(response.nextTurn || (turnId + 1))
      resetFailed(key)
      
      // Check if notification is properly configured
      const hasValidNotification = puzzleEvent.notification?.notificationContact && puzzleEvent.notification?.notificationMessage
      
      // Find triggered narratives
      const narrativeData = findTriggeredNarratives(contact, response.messageId)
      
      return { 
        status: 'success', 
        text: response.text, 
        mediaId: response.mediaId, 
        evidenceText: response.evidenceText, 
        messageId: response.messageId, 
        successMedia: response.successMedia, 
        showNotification: hasValidNotification, 
        notificationContact: puzzleEvent.notification?.notificationContact, 
        notificationMessage: puzzleEvent.notification?.notificationMessage,
        narrativeMessages: narrativeData.messages,
        narrativeMediaIds: narrativeData.mediaIds
      }
    }

    // CHECK 3: Specific Hint Match
    const hint = (puzzleEvent.hints || []).find((h: any) => {
      const hk = (h.keywords || []).map((k: string) => k.toLowerCase())
      return hk.some((k: string) => words.includes(k))
    })
    if (hint) {
      return { status: 'hint', text: hint.response }
    }

    // CHECK 4: General Failure (Randomized)
    const attempts = incrementFailed(key)
    const fallbackText = randomItem(puzzleEvent.fallbacks || ['Wrong.'])
    
    if (attempts >= (puzzleEvent.maxAttempts || 3)) {
      const until = Date.now() + (puzzleEvent.penaltySeconds || 10) * 1000
      setLockUntil(key, until)
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

  // Get narrative messages for turn start
  function getNarrativeMessagesForTurnStart(contactId: string, turnId: number) {
    const contact = findContactFile(contactId)
    if (!contact) return { messages: [], mediaIds: [] }
    
    const timeline = contact.timeline || []
    const narrativeEvents = timeline.filter((event: any) => 
      event.type === 'narrative' && 
      event.turnId === turnId && 
      event.triggerAfter === null
    )
    
    return {
      messages: narrativeEvents.flatMap((event: any) => event.messages || []),
      mediaIds: narrativeEvents.flatMap((event: any) => event.mediaId || [])
    }
  }

  // Get random narrative messages (for ambient flavor)
  function getRandomNarrativeMessages(contactId: string, turnId: number): string[] {
    const contact = findContactFile(contactId)
    if (!contact) return []
    
    const timeline = contact.timeline || []
    const narrativeEvents = timeline.filter((event: any) => 
      event.type === 'narrative' &&
      event.turnId === turnId && 
      event.triggerRandom && 
      Math.random() < (event.probability || 0.5)
    )
    
    return narrativeEvents.flatMap((event: any) => event.messages || [])
  }

  // Get puzzle event for a specific turn
  function getPuzzleForTurn(contactId: string, turnId: number) {
    const contact = findContactFile(contactId)
    if (!contact) return null
    
    const timeline = contact.timeline || []
    return timeline.find((event: any) => 
      event.type === 'puzzle' && event.turnId === turnId
    )
  }

  return { 
    parseInput,
    getNarrativeMessagesForTurnStart,
    getRandomNarrativeMessages,
    getPuzzleForTurn
  }
}