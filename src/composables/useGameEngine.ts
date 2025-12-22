import registry from '../data/registry.json'
import c1Data from '../data/contacts/c1_informant.json'
import c2Data from '../data/contacts/c2_informant.json'
import c3Data from '../data/contacts/c3_risolutore.json'
import { useSaveManager } from './useSaveManager'
import { useNotification } from './useNotification'
import { format } from 'date-fns'

const REGEX = /^T(\d+):\s*(.+)$/i

export function useGameEngine() {
  const { state, incrementFailed, resetFailed, setLockUntil, isLocked, getLockedUntil, advanceTurn, isPreQuestionShown, setPreQuestionShown } = useSaveManager()
  const { show } = useNotification()

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

    const puzzle = (contact.puzzles || []).find((p: any) => p.turnId === turnId)
    if (!puzzle) return { status: 'error', text: 'Nessun enigma per questo turno' }

    const key = `${contactId}_${turnId}`

    // CHECK 0: Show preQuestion if it exists and hasn't been shown yet
    if (puzzle.preQuestion && !isPreQuestionShown(key)) {
      setPreQuestionShown(key, true)
      return { status: 'prequestion', text: puzzle.preQuestion }
    }

    // CHECK 1: Is the System Locked?
    if (isLocked(key)) {
      const penaltyText = randomItem(puzzle.penaltyResponses || ['Sistema Bloccato. Raffreddamento in corso...'])
      return { status: 'locked', text: penaltyText }
    }

    // tokenize
    const words = msg.toLowerCase().split(/\W+/).filter(Boolean)

    // CHECK 2: Exact Solution Match
    const solKeys = (puzzle.solution.keywords || []).map((s: string) => s.toLowerCase())
    const solved = solKeys.every((k: string) => words.includes(k))
    if (solved) {
      const response = puzzle.solution.response
      advanceTurn(response.nextTurn || (turnId + 1))
      resetFailed(key)
      
      // Validate notification requirements
      if (puzzle.notification?.showNotification && (!puzzle.notification?.notificationContact || !puzzle.notification?.notificationMessage)) {
        console.error(`Puzzle ${turnId} has showNotification: true but missing notificationContact or notificationMessage`)
        return { status: 'error', text: 'Configurazione notifica incompleta' }
      }
      
      return { status: 'success', text: response.text, mediaId: response.mediaId, evidenceText: response.evidenceText, messageId: response.messageId, showNotification: puzzle.notification?.showNotification || false, notificationContact: puzzle.notification?.notificationContact, notificationMessage: puzzle.notification?.notificationMessage }
    }

    // CHECK 3: Specific Hint Match
    const hint = (puzzle.hints || []).find((h: any) => {
      const hk = (h.keywords || []).map((k: string) => k.toLowerCase())
      return hk.some((k: string) => words.includes(k))
    })
    if (hint) {
      return { status: 'hint', text: hint.response }
    }

    // CHECK 4: General Failure (Randomized)
    const attempts = incrementFailed(key)
    const fallbackText = randomItem(puzzle.fallbacks || ['Wrong.'])
    
    if (attempts >= (puzzle.maxAttempts || 3)) {
      const until = Date.now() + (puzzle.penaltySeconds || 10) * 1000
      setLockUntil(key, until)
      const lockMsg = randomItem(puzzle.penaltyResponses || ['Sistema Bloccato.'])
      return { status: 'locked', text: lockMsg }
    }

    return { status: 'fail', text: fallbackText }
  }

  return { parseInput }
}