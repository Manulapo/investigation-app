import { reactive, watch } from 'vue';
const STORAGE_KEY = 'project_detective_save_v1';
const defaultState = {
    currentGlobalTurn: 1,
    chatHistories: {},
    puzzleStatus: {}
};
const state = reactive(load());
function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const loaded = JSON.parse(raw);
            // Ensure puzzleStatus exists for backwards compatibility
            if (!loaded.puzzleStatus) {
                loaded.puzzleStatus = {};
            }
            return loaded;
        }
    }
    catch (e) { }
    return { ...defaultState };
}
watch(state, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
}, { deep: true });
export function useSaveManager() {
    function addMessage(contactId, msg) {
        if (!state.chatHistories[contactId])
            state.chatHistories[contactId] = [];
        state.chatHistories[contactId].push(msg);
    }
    function getMessages(contactId) {
        return state.chatHistories[contactId] || [];
    }
    function getPuzzleStatus(key) {
        if (!state.puzzleStatus[key]) {
            state.puzzleStatus[key] = { failedAttempts: 0, lockedUntil: null, preQuestionShown: false };
        }
        return state.puzzleStatus[key];
    }
    function incrementFailed(key) {
        const status = getPuzzleStatus(key);
        status.failedAttempts++;
        return status.failedAttempts;
    }
    function resetFailed(key) {
        const status = getPuzzleStatus(key);
        status.failedAttempts = 0;
    }
    function setLockUntil(key, untilTs) {
        const status = getPuzzleStatus(key);
        status.lockedUntil = untilTs;
        status.failedAttempts = 0;
    }
    function isPreQuestionShown(key) {
        const status = getPuzzleStatus(key);
        return status.preQuestionShown;
    }
    function setPreQuestionShown(key, shown = true) {
        const status = getPuzzleStatus(key);
        status.preQuestionShown = shown;
    }
    function isLocked(key) {
        const status = getPuzzleStatus(key);
        if (!status.lockedUntil)
            return false;
        return Date.now() < status.lockedUntil;
    }
    function getLockedUntil(key) {
        const status = getPuzzleStatus(key);
        return status.lockedUntil;
    }
    function advanceTurn(next) {
        if (next > state.currentGlobalTurn)
            state.currentGlobalTurn = next;
    }
    function resetAll() {
        Object.keys(state).forEach(k => delete state[k]);
        const fresh = JSON.parse(JSON.stringify(defaultState));
        Object.assign(state, fresh);
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
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
        resetAll
    };
}
//# sourceMappingURL=useSaveManager.js.map