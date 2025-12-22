import { reactive, ref, watch } from 'vue'

type Message = {
  id: string
  content: string
  sender: 'user'|'contact'
  timestamp: number
}

type ContactHistory = Message[]

const STORAGE_KEY = 'project_detective_save_v1'

const defaultState = {
  currentGlobalTurn: 1,
  chatHistories: {} as Record<string, ContactHistory>,
  failedAttempts: {} as Record<string, number>,
  cooldowns: {} as Record<string, number>
}

const state = reactive(load())

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return defaultState
}

watch(state, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

export function useSaveManager() {
  function addMessage(contactId: string, msg: Message) {
    if (!state.chatHistories[contactId]) state.chatHistories[contactId] = []
    state.chatHistories[contactId].push(msg)
  }

  function getMessages(contactId: string) {
    return state.chatHistories[contactId] || []
  }

  function incrementFailed(contactTurnKey: string) {
    state.failedAttempts[contactTurnKey] = (state.failedAttempts[contactTurnKey] || 0) + 1
    return state.failedAttempts[contactTurnKey]
  }

  function resetFailed(contactTurnKey: string) {
    state.failedAttempts[contactTurnKey] = 0
  }

  function setCooldown(contactTurnKey: string, untilTs: number) {
    state.cooldowns[contactTurnKey] = untilTs
  }

  function getCooldown(contactTurnKey: string) {
    return state.cooldowns[contactTurnKey] || 0
  }

  function advanceTurn(next: number) {
    if (next > state.currentGlobalTurn) state.currentGlobalTurn = next
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
    incrementFailed,
    resetFailed,
    setCooldown,
    getCooldown,
    advanceTurn,
    resetAll
  }
}

export type { Message }
