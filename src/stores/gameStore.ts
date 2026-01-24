import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PuzzleStatus, Contact } from '../types'
import { contactDataMap } from '../data/contactDataMap'
import penaltyResponsesData from '../data/penaltyResponses.json'
import registry from '../data/registry.json'

const REGEX = /^T(\d+):\s*(.+)$/i
const penaltyResponses: string[] = penaltyResponsesData

export const useGameStore = defineStore('game', () => {
    // State
    const currentGlobalTurn = ref(1)
    const puzzleStatus = ref<Record<string, PuzzleStatus>>({})
    const phoneUnlockedContacts = ref<string[]>([])
    const totalHintsUsed = ref(0)
    const usedHintsPerPuzzle = ref<Record<string, number>>({})
    const shownNarratives = ref<Record<string, boolean>>({})

    // Phone call state
    const callStatus = ref<'idle' | 'dialing' | 'accepted' | 'rejected' | 'not-found'>('idle')
    const dialedNumber = ref('')
    const contactName = ref('')
    const acceptedContactId = ref<string | null>(null)

    // Getters
    const getPuzzleStatus = computed(() => (key: string): PuzzleStatus => {
        if (!puzzleStatus.value[key]) {
            puzzleStatus.value[key] = { failedAttempts: 0, lockedUntil: null, preQuestionShown: false }
        }
        return puzzleStatus.value[key]
    })

    const isLocked = computed(() => (key: string): boolean => {
        const lockedUntil = getPuzzleStatus.value(key).lockedUntil
        return lockedUntil ? Date.now() < lockedUntil : false
    })

    const getLockedUntil = computed(() => (key: string): number | null => {
        return getPuzzleStatus.value(key).lockedUntil
    })

    const isPreQuestionShown = computed(() => (key: string): boolean => {
        return getPuzzleStatus.value(key).preQuestionShown
    })

    const isContactUnlockedByPhone = computed(() => (contactId: string): boolean => {
        return phoneUnlockedContacts.value.includes(contactId)
    })

    const getUsedHintsForPuzzle = computed(() => (puzzleKey: string): number => {
        return usedHintsPerPuzzle.value[puzzleKey] || 0
    })

    const isNarrativeShown = computed(() => (narrativeId: string): boolean => {
        return shownNarratives.value[narrativeId] === true
    })

    // Actions
    function incrementFailed(key: string): number {
        const status = getPuzzleStatus.value(key)
        status.failedAttempts++
        return status.failedAttempts
    }

    function resetFailed(key: string) {
        const status = getPuzzleStatus.value(key)
        status.failedAttempts = 0
    }

    function setLockUntil(key: string, untilTs: number) {
        const status = getPuzzleStatus.value(key)
        status.lockedUntil = untilTs
        status.failedAttempts = 0
    }

    function setPreQuestionShown(key: string, shown: boolean = true) {
        getPuzzleStatus.value(key).preQuestionShown = shown
    }

    function advanceTurn(next: number) {
        if (next > currentGlobalTurn.value) {
            currentGlobalTurn.value = next
        } else {
            currentGlobalTurn.value--
        }
    }

    function setLevel(level: number) {
        currentGlobalTurn.value = level
    }

    function unlockContactByPhone(contactId: string) {
        if (!phoneUnlockedContacts.value.includes(contactId)) {
            phoneUnlockedContacts.value.push(contactId)
        }
    }

    function useHint(puzzleKey: string) {
        usedHintsPerPuzzle.value[puzzleKey] = (usedHintsPerPuzzle.value[puzzleKey] || 0) + 1
        totalHintsUsed.value++
    }

    function setNarrativeShown(narrativeId: string, shown: boolean = true) {
        shownNarratives.value[narrativeId] = shown
    }

    function resetPuzzles() {
        puzzleStatus.value = {}
    }

    function resetAll() {
        currentGlobalTurn.value = 1
        puzzleStatus.value = {}
        phoneUnlockedContacts.value = []
        totalHintsUsed.value = 0
        usedHintsPerPuzzle.value = {}
        shownNarratives.value = {}
        resetCall()
    }

    // ============================================
    // PUZZLE VALIDATION & GAME ENGINE
    // ============================================

    function findContactFile(id: string) {
        const contact = registry.find((c: any) => c.id === id)
        if (!contact) return null
        return contactDataMap[contact.file] || null
    }

    function randomItem(arr: string[]): string {
        return arr[Math.floor(Math.random() * arr.length)]
    }

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

    function validateAnswer(contactId: string, input: string) {
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
        if (puzzleEvent.preQuestion && !isPreQuestionShown.value(key)) {
            setPreQuestionShown(key, true)
            return { status: 'prequestion', text: puzzleEvent.preQuestion }
        }

        // CHECK 1: Is the System Locked?
        if (isLocked.value(key)) {
            const penaltyText = randomItem(penaltyResponses)
            return { status: 'locked', text: penaltyText }
        }

        // Tokenize
        const words = msg.toLowerCase().split(/\W+/).filter(Boolean)

        // CHECK 2: Exact Solution Match
        const solKeys = (puzzleEvent.solution.keywords || []).map((s: string) => s.toLowerCase())
        const solved = solKeys.every((k: string) => words.includes(k))

        if (solved) {
            const response = puzzleEvent.solution.response
            advanceTurn(response.nextTurn || (turnId + 1))
            resetFailed(key)

            const hasValidNotification = puzzleEvent.notification?.notificationContact &&
                puzzleEvent.notification?.notificationMessage

            const narrativeData = findTriggeredNarratives(contact, response.messageId)

            // Normalize text and evidenceText to arrays
            const textArray = Array.isArray(response.text) ? response.text : [response.text]
            const evidenceTextArray = response.evidenceText
                ? (Array.isArray(response.evidenceText) ? response.evidenceText : [response.evidenceText])
                : []

            return {
                status: 'success',
                text: textArray[0],
                textMessages: textArray.slice(1),
                mediaId: response.mediaId,
                evidenceText: evidenceTextArray[0],
                evidenceTextMessages: evidenceTextArray.slice(1),
                messageId: response.messageId,
                successMedia: response.successMedia,
                showNotification: hasValidNotification,
                notificationContact: puzzleEvent.notification?.notificationContact,
                notificationMessage: puzzleEvent.notification?.notificationMessage,
                narrativeMessages: narrativeData.messages,
                narrativeMediaIds: narrativeData.mediaIds
            }
        }

        // CHECK 3: General Failure
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

    // ============================================
    // PHONE CALL SYSTEM
    // ============================================

    function findContactByPhone(number: string): Contact | undefined {
        return registry.find((contact: Contact) => contact.phoneNumber === number)
    }

    async function makePhoneCall(number: string) {
        dialedNumber.value = number
        callStatus.value = 'dialing'

        // Simulate dialing for 4 seconds
        await new Promise(resolve => setTimeout(resolve, 4000))

        const contact = findContactByPhone(number)

        if (!contact) {
            callStatus.value = 'not-found'
            return
        }

        // Check if contact is available
        if (currentGlobalTurn.value >= contact.visibleAtTurn) {
            contactName.value = contact.name
            acceptedContactId.value = contact.id
            callStatus.value = 'accepted'
            unlockContactByPhone(contact.id)
        } else {
            contactName.value = contact.name
            callStatus.value = 'rejected'
        }
    }

    function resetCall() {
        callStatus.value = 'idle'
        dialedNumber.value = ''
        contactName.value = ''
        acceptedContactId.value = null
    }

    return {
        // State
        currentGlobalTurn,
        puzzleStatus,
        phoneUnlockedContacts,
        totalHintsUsed,
        usedHintsPerPuzzle,
        shownNarratives,
        callStatus,
        dialedNumber,
        contactName,
        acceptedContactId,

        // Getters
        getPuzzleStatus,
        isLocked,
        getLockedUntil,
        isPreQuestionShown,
        isContactUnlockedByPhone,
        getUsedHintsForPuzzle,
        isNarrativeShown,

        // Basic Actions
        incrementFailed,
        resetFailed,
        setLockUntil,
        setPreQuestionShown,
        advanceTurn,
        setLevel,
        unlockContactByPhone,
        useHint,
        setNarrativeShown,
        resetPuzzles,
        resetAll,

        // Game Engine
        validateAnswer,

        // Phone System
        makePhoneCall,
        resetCall,
        findContactByPhone
    }
}, {
    persist: {
        key: 'game-store'
    }
})
