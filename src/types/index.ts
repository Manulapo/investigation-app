import { ComputedRef, Ref } from "vue"

// Message Types
export type Media = {
  type: 'image' | 'pdf' | 'audio'
  src: string
  alt?: string
}

export type Document = {
  id: string
  type: 'image' | 'pdf' | 'audio'
  src: string
  alt?: string
  initial: boolean
  triggerMessageId?: string
  contactId?: string
}

export type Message = {
  id: string
  content: string
  sender: 'user' | 'contact'
  timestamp: number
  media?: Media[]
  isRead?: boolean
}

export type ContactHistory = Message[]

// Helper type used when scheduling/creating messages before timestamp is assigned
export type MessageData = Omit<Message, 'timestamp'>

// Puzzle Types
export type PuzzleStatus = {
  failedAttempts: number
  lockedUntil: number | null
  preQuestionShown: boolean
}

// Notification Types
export type Toast = {
  id: number
  text: string
  contactId?: string
  createdAt: number
  ttl: number
}

// Contact Types
export interface Contact {
  id: string
  file: string
  name: string
  avatar: string
  description: string
  phoneNumber?: string
  visibleAtTurn: number
}

// Game State Types
export interface GameState {
  currentGlobalTurn: number
  chatHistories: Record<string, ContactHistory>
  puzzleStatus: Record<string, PuzzleStatus>
  phoneUnlockedContacts: string[]
  totalHintsUsed: number
  usedHintsPerPuzzle: Record<string, number>
}


export interface MessageQueueDependencies {
  contactId: ComputedRef<string>
  addMessage: (contactId: string, message: any) => void
  addDelayedMessage: (contactId: string, messageData: MessageData, delaySeconds: number) => void
  unlockDocuments: (ids: string[]) => void
  findMediaArray: (mediaIds: string | string[]) => any[]
  show: (message: string, contact?: string) => void
  getPuzzleForTurn: (contactId: string, turn: number) => any
  isPreQuestionShown: (key: string) => boolean
  setPreQuestionShown: (key: string, shown: boolean) => void
  currentTurn: ComputedRef<number>
}

export interface ContactLoaderDependencies {
  contactId: ComputedRef<string>
  contact: ComputedRef<any>
  messages: ComputedRef<any[]>
  state: any
  addMessage: (contactId: string, message: any) => void
  addDelayedMessage: (contactId: string, messageData: MessageData, delaySeconds: number) => void
  unlockDocuments: (ids: string[]) => void
  findMediaArray: (mediaIds: string | string[]) => any[]
  getNarrativeMessagesForTurnStart: (contactId: string, turn: number) => any
  getPuzzleForTurn: (contactId: string, turn: number) => any
  isNarrativeShown: (key: string) => boolean
  setNarrativeShown: (key: string) => void
  isPreQuestionShown: (key: string) => boolean
  setPreQuestionShown: (key: string, shown: boolean) => void
  getCurrentTurnForContact: (contactId: string) => number
  isTyping: Ref<boolean>
}