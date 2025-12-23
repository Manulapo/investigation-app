import { ref } from 'vue';
export const toasts = ref([]);
let nextId = 1;
export function useNotification() {
    function show(text, contactId, ttl = 4000) {
        setTimeout(() => {
            const id = nextId++;
            const createdAt = Date.now();
            toasts.value.push({ id, text, contactId, createdAt, ttl });
            setTimeout(() => {
                toasts.value = toasts.value.filter(t => t.id !== id);
            }, ttl);
        }, 1000);
    }
    function getToasts() {
        return toasts;
    }
    function removeToast(id) {
        toasts.value = toasts.value.filter(t => t.id !== id);
    }
    return { show, getToasts, removeToast };
}
//# sourceMappingURL=useNotification.js.map