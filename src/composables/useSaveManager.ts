import { reactive, ref, watch } from 'vue'

type Message = {
  id: string
  content: string
  sender: 'user'|'contact'
  timestamp: number
  media?: {
    type: 'image' | 'video'
    src: string
    alt?: string
  }
  isRead?: boolean
}

type ContactHistory = Message[]

const STORAGE_KEY = 'project_detective_save_v1'

type PuzzleStatus = {
  failedAttempts: number
  lockedUntil: number | null
  preQuestionShown: boolean
}

const defaultState = {
  currentGlobalTurn: 1,
  chatHistories: {} as Record<string, ContactHistory>,
  puzzleStatus: {} as Record<string, PuzzleStatus>
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
      return loaded
    }
  } catch (e) {}
  return { ...defaultState }
}

watch(state, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

export function useSaveManager() {
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
    const status = getPuzzleStatus(key)
    return status.preQuestionShown
  }

  function setPreQuestionShown(key: string, shown: boolean = true) {
    const status = getPuzzleStatus(key)
    status.preQuestionShown = shown
  }

  function isLocked(key: string): boolean {
    const status = getPuzzleStatus(key)
    if (!status.lockedUntil) return false
    return Date.now() < status.lockedUntil
  }

  function getLockedUntil(key: string): number | null {
    const status = getPuzzleStatus(key)
    return status.lockedUntil
  }

  function advanceTurn(next: number) {
    if (next > state.currentGlobalTurn) state.currentGlobalTurn = next
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
    if (!state.hasNotification) {
      state.hasNotification = {}
    }
    const count = state.hasNotification[contactId] ? 1 : 0
    console.log('Getting unread count for', contactId, ':', count)
    return count
  }

  function setNotificationForContact(contactId: string) {
    if (!state.hasNotification) {
      state.hasNotification = {}
    }
    console.log('Setting notification flag for contact:', contactId)
    state.hasNotification[contactId] = true
  }

  function resetAll() {
    Object.keys(state).forEach(k => delete (state as any)[k])
    const fresh = JSON.parse(JSON.stringify(defaultState))
    Object.assign(state, fresh)
    localStorage.removeItem(STORAGE_KEY)
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
    markMessagesAsRead,
    resetAll
  }
}

export type { Message }
