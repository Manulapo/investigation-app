import { useChatStore } from '../stores/chatStore'
import { useGameStore } from '../stores/gameStore'

const OLD_STORAGE_KEY = 'project_detective_save_v1'

export function migrateFromLegacyStorage() {
    try {
        const raw = localStorage.getItem(OLD_STORAGE_KEY)
        if (!raw) return // No legacy data to migrate

        const legacyData = JSON.parse(raw)

        // Check if new stores already have data
        const chatStore = useChatStore()
        const gameStore = useGameStore()

        // Migrate chat data if chatStore is empty
        if (Object.keys(chatStore.chatHistories).length === 0 && legacyData.chatHistories) {
            chatStore.chatHistories = legacyData.chatHistories
        }

        // Migrate notifications
        if (Object.keys(chatStore.hasNotification).length === 0 && legacyData.hasNotification) {
            chatStore.hasNotification = legacyData.hasNotification
        }

        // Migrate game state
        if (gameStore.currentGlobalTurn === 1 && legacyData.currentGlobalTurn) {
            gameStore.currentGlobalTurn = legacyData.currentGlobalTurn
        }

        if (Object.keys(gameStore.puzzleStatus).length === 0 && legacyData.puzzleStatus) {
            gameStore.puzzleStatus = legacyData.puzzleStatus
        }

        if (gameStore.phoneUnlockedContacts.length === 0 && legacyData.phoneUnlockedContacts) {
            gameStore.phoneUnlockedContacts = legacyData.phoneUnlockedContacts
        }

        if (gameStore.totalHintsUsed === 0 && legacyData.totalHintsUsed) {
            gameStore.totalHintsUsed = legacyData.totalHintsUsed
        }

        if (Object.keys(gameStore.usedHintsPerPuzzle).length === 0 && legacyData.usedHintsPerPuzzle) {
            gameStore.usedHintsPerPuzzle = legacyData.usedHintsPerPuzzle
        }

        // Keep legacy storage for now (don't delete) in case rollback is needed
        // localStorage.removeItem(OLD_STORAGE_KEY)

    } catch (e) {
        console.error('[Migration] Error migrating from legacy storage:', e)
    }
}
