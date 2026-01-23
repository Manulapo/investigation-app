export interface NarrativeEvent {
    id: string
    type: 'narrative' | 'puzzle'
    turnId: number
    triggerAfter?: string | null
    messages?: string[]
    mediaId?: string[]
    triggerRandom?: boolean
    probability?: number
}

export interface PuzzleEvent extends NarrativeEvent {
    type: 'puzzle'
    preQuestion?: string
    maxAttempts?: number
    penaltySeconds?: number
    solution?: {
        keywords: string[]
        response: {
            text: string | string[]
            messageId: string
            mediaId?: string[]
            evidenceText?: string | string[]
            successMedia?: any[]
            nextTurn?: number
        }
    }
    hints?: string[]
    fallbacks?: string[]
    notification?: {
        notificationContact?: string
        notificationMessage?: string
    }
}

export interface ContactData {
    initialMessage?: string
    timeline: (NarrativeEvent | PuzzleEvent)[]
}

export interface NarrativeResult {
    messages: string[]
    mediaIds: string[]
    events: NarrativeEvent[]
}

export interface SchedulerConfig {
    isNewChat: boolean
    currentTurn: number
    contactId: string
}
