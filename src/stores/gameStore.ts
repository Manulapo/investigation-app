import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PuzzleStatus } from '../types'

export const useGameStore = defineStore('game', () => {
    // State
    const currentGlobalTurn = ref(1)
    const puzzleStatus = ref<Record<string, PuzzleStatus>>({})
    const phoneUnlockedContacts = ref<string[]>([])
    const totalHintsUsed = ref(0)
    const usedHintsPerPuzzle = ref<Record<string, number>>({})
    const shownNarratives = ref<Record<string, boolean>>({})

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
    }

    return {
        // State
        currentGlobalTurn,
        puzzleStatus,
        phoneUnlockedContacts,
        totalHintsUsed,
        usedHintsPerPuzzle,
        shownNarratives,

        // Getters
        getPuzzleStatus,
        isLocked,
        getLockedUntil,
        isPreQuestionShown,
        isContactUnlockedByPhone,
        getUsedHintsForPuzzle,
        isNarrativeShown,

        // Actions
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
        resetAll
    }
}, {
    persist: {
        key: 'game-store'
    }
})
