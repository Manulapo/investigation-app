import { reactive, watch } from 'vue'
import type { Message, ContactHistory, PuzzleStatus, GameState } from '../types'
import { useDocuments } from './useDocuments'

const STORAGE_KEY = 'project_detective_save_v1'

const defaultState = {
  currentGlobalTurn: 1,
  chatHistories: {} as Record<string, ContactHistory>,
  puzzleStatus: {} as Record<string, PuzzleStatus>,
  phoneUnlockedContacts: [] as string[],
  totalHintsUsed: 0,
  usedHintsPerPuzzle: {} as Record<string, number>,
  shownNarratives: {} as Record<string, boolean>
}

const state = reactive(load())

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const loaded = JSON.parse(raw)
      // Ensure puzzleStatus exists for backwards compatibility
      if (!loaded.puzzleStatus) {
        loaded.puzzleStatus = {}
      }
      // Ensure phoneUnlockedContacts exists for backwards compatibility
      if (!loaded.phoneUnlockedContacts) {
        loaded.phoneUnlockedContacts = []
      }
      // Ensure hint tracking exists for backwards compatibility
      if (loaded.totalHintsUsed === undefined) {
        loaded.totalHintsUsed = 0
      }
      if (!loaded.usedHintsPerPuzzle) {
        loaded.usedHintsPerPuzzle = {}
      }
      // Ensure narrative tracking exists for backwards compatibility
      if (!loaded.shownNarratives) {
        loaded.shownNarratives = {}
      }
      return loaded
    }
  } catch (e) { }
  return { ...defaultState }
}

watch(state, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

// Helper to create boolean flag getter/setter pairs
function createBooleanFlag(record: Record<string, boolean>) {
  return {
    get: (key: string) => record[key] === true,
    set: (key: string, value: boolean = true) => { record[key] = value }
  }
}

export function useSaveManager() {
  // Ensure hasNotification exists
  if (!state.hasNotification) {
    state.hasNotification = {}
  }

  function addMessage(contactId: string, msg: Message) {
    if (!state.chatHistories[contactId]) state.chatHistories[contactId] = []
    // User messages are always read
    const messageWithReadStatus = {
      ...msg,
      isRead: msg.sender === 'user' ? true : (msg.isRead ?? true)
    }
    state.chatHistories[contactId].push(messageWithReadStatus)
  }

  function getMessages(contactId: string) {
    return state.chatHistories[contactId] || []
  }

  function getPuzzleStatus(key: string): PuzzleStatus {
    if (!state.puzzleStatus[key]) {
      state.puzzleStatus[key] = { failedAttempts: 0, lockedUntil: null, preQuestionShown: false }
    }
    return state.puzzleStatus[key]
  }

  function incrementFailed(key: string) {
    const status = getPuzzleStatus(key)
    status.failedAttempts++
    return status.failedAttempts
  }

  function resetFailed(key: string) {
    const status = getPuzzleStatus(key)
    status.failedAttempts = 0
  }

  function setLockUntil(key: string, untilTs: number) {
    const status = getPuzzleStatus(key)
    status.lockedUntil = untilTs
    status.failedAttempts = 0
  }

  function isPreQuestionShown(key: string): boolean {
    return getPuzzleStatus(key).preQuestionShown
  }

  function setPreQuestionShown(key: string, shown: boolean = true) {
    getPuzzleStatus(key).preQuestionShown = shown
  }

  function isLocked(key: string): boolean {
    const lockedUntil = getPuzzleStatus(key).lockedUntil
    return lockedUntil ? Date.now() < lockedUntil : false
  }

  function getLockedUntil(key: string): number | null {
    return getPuzzleStatus(key).lockedUntil
  }

  function advanceTurn(next: number) {
    if (next > state.currentGlobalTurn) {
      state.currentGlobalTurn = next
    } else {
      state.currentGlobalTurn--
    }
  }

  function setLevel(level: number) {
    state.currentGlobalTurn = level
  }

  function markMessagesAsRead(contactId: string) {
    const messages = getMessages(contactId)
    messages.forEach((msg: Message) => {
      if (msg.sender === 'contact' && !msg.isRead) {
        msg.isRead = true
      }
    })
  }

  function getUnreadCount(contactId: string): number {
    return state.hasNotification[contactId] ? 1 : 0
  }

  function setNotificationForContact(contactId: string) {
    state.hasNotification[contactId] = true
  }

  function unlockContactByPhone(contactId: string) {
    if (!state.phoneUnlockedContacts.includes(contactId)) {
      state.phoneUnlockedContacts.push(contactId)
    }
  }

  function isContactUnlockedByPhone(contactId: string): boolean {
    return state.phoneUnlockedContacts.includes(contactId)
  }

  function getUsedHintsForPuzzle(puzzleKey: string): number {
    return state.usedHintsPerPuzzle[puzzleKey] || 0
  }

  function useHint(puzzleKey: string) {
    state.usedHintsPerPuzzle[puzzleKey] = (state.usedHintsPerPuzzle[puzzleKey] || 0) + 1
    state.totalHintsUsed++
  }

  const narrativeFlags = createBooleanFlag(state.shownNarratives)

  function isNarrativeShown(narrativeId: string): boolean {
    return narrativeFlags.get(narrativeId)
  }

  function setNarrativeShown(narrativeId: string, shown: boolean = true) {
    narrativeFlags.set(narrativeId, shown)
  }

  function resetChatHistories() {
    state.chatHistories = {}
    state.puzzleStatus = {}
  }

  function resetAll() {
    Object.keys(state).forEach(k => delete (state as any)[k])
    const fresh = JSON.parse(JSON.stringify(defaultState))
    Object.assign(state, fresh)
    localStorage.removeItem(STORAGE_KEY)

    // Reset documents to initial state
    const { resetDocuments } = useDocuments()
    resetDocuments()

    location.reload()
  }

  return {
    state,
    addMessage,
    getMessages,
    getPuzzleStatus,
    incrementFailed,
    resetFailed,
    setLockUntil,
    isLocked,
    getLockedUntil,
    isPreQuestionShown,
    setPreQuestionShown,
    advanceTurn,
    setLevel,
    markMessagesAsRead,
    unlockContactByPhone,
    isContactUnlockedByPhone,
    getUsedHintsForPuzzle,
    useHint,
    isNarrativeShown,
    setNarrativeShown,
    resetChatHistories,
    resetAll
  }
}
