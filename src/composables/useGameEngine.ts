import registry from '../data/registry.json'
import contactData from '../data/contacts/c1_informant.json'
import { useSaveManager } from './useSaveManager'
import { useNotification } from './useNotification'
import { format } from 'date-fns'

const REGEX = /^T(\d+):\s*(.+)$/i

export function useGameEngine() {
  const { state, addMessage, incrementFailed, resetFailed, setCooldown, getCooldown, advanceTurn } = useSaveManager()
  const { show } = useNotification()

  function findContactFile(id: string) {
    // For this demo we only have one contact; in full app we'd map registry -> file
    if (id === 'c1') return contactData as any
    return null
  }

  function nowText() {
    return Date.now()
  }

  function parseInput(contactId: string, input: string) {
    const m = input.match(REGEX)
    if (!m) return { status: 'invalid', text: 'Bad format. Use T{n}: {keyword}' }

    const turnId = Number(m[1])
    const msg = m[2].trim()

    const contact = findContactFile(contactId)
    if (!contact) return { status: 'error', text: 'Contact not found' }

    const puzzle = (contact.puzzles || []).find((p: any) => p.turnId === turnId)
    if (!puzzle) return { status: 'error', text: 'No puzzle for that turn' }

    const key = `${contactId}_${turnId}`
    const now = Date.now()
    const cooldownUntil = getCooldown(key)
    if (cooldownUntil && now < cooldownUntil) {
      return { status: 'locked', text: 'System Locked. Cooling down...' }
    }

    // tokenize
    const words = msg.toLowerCase().split(/\W+/).filter(Boolean)

    // check solution
    const solKeys = (puzzle.solution.keywords || []).map((s: string) => s.toLowerCase())
    const solved = solKeys.every((k: string) => words.includes(k))
    if (solved) {
      // success
      const response = puzzle.solution.response
      const ts = Date.now()
      const messageId = response.messageId || `msg_${contactId}_turn${turnId}_success`
      addMessage(contactId, { id: messageId, content: response.text, sender: 'contact', timestamp: ts })
      advanceTurn(response.nextTurn || (turnId + 1))
      resetFailed(key)
      show(`Solved: ${contact.name || contactId}`)
      return { status: 'success', text: response.text, mediaId: response.mediaId }
    }

    // partial hints
    const hint = (puzzle.hints || []).find((h: any) => {
      const hk = (h.keywords || []).map((k: string) => k.toLowerCase())
      return hk.some((k: string) => words.includes(k))
    })
    if (hint) {
      addMessage(contactId, { id: `msg_hint_${Date.now()}`, content: hint.response, sender: 'contact', timestamp: Date.now() })
      return { status: 'hint', text: hint.response }
    }

    // failure
    const attempts = incrementFailed(key)
    addMessage(contactId, { id: `msg_fail_${Date.now()}`, content: (puzzle.fallbacks || [])[Math.floor(Math.random() * ((puzzle.fallbacks||[]).length))] || 'Nope', sender: 'contact', timestamp: Date.now() })
    if (attempts >= (puzzle.maxAttempts || 3)) {
      const until = Date.now() + (puzzle.penaltySeconds || 10) * 1000
      setCooldown(key, until)
      return { status: 'locked', text: (puzzle.penaltyResponses || ['System Locked.'])[0] }
    }

    return { status: 'fail', text: 'Incorrect.' }
  }

  return { parseInput }
}
