// Message Types
export type Media = {
  type: 'image' | 'pdf'
  src: string
  alt?: string
}

export type Message = {
  id: string
  content: string
  sender: 'user' | 'contact'
  timestamp: number
  media?: Media
  isRead?: boolean
}

export type ContactHistory = Message[]

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
  visibleAtTurn: number
}

// Game State Types
export interface GameState {
  currentGlobalTurn: number
  chatHistories: Record<string, ContactHistory>
  puzzleStatus: Record<string, PuzzleStatus>
}
