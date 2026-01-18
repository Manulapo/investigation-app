<template>
    <div class="input-section">
        <div class="input-area">
            <input v-model="inputValue" :disabled="isCooldown" class="input-field" placeholder="rispondi"
                @keyup.enter="handleSend" />
            <button :disabled="!inputValue || isCooldown" class="send-btn" @click="handleSend"><i
                    class="fas fa-paper-plane"></i></button>
        </div>
        <p v-if="isCooldown" class="cooldown-msg">⏱️ Cooldown: {{ cooldownCountdown }}s</p>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
    isCooldown: boolean
    cooldownCountdown: number
}>()

const emit = defineEmits<{
    send: [message: string]
}>()

const inputValue = ref('')

const handleSend = () => {
    if (!inputValue.value.trim() || props.isCooldown) return

    const message = inputValue.value.trim()
    inputValue.value = ''
    emit('send', message)
}
</script>

<style scoped lang="scss">
.input-section {
    flex-shrink: 0;
    background: #fff;
    border-top: 1px solid #e0e0e0;
    position: relative;
    z-index: 100;
}

.input-area {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem;
    align-items: flex-end;
}

.input-field {
    flex: 1;
    padding: 0.65rem 1rem;
    border: 1px solid #ddd;
    border-radius: 20px;
    font-size: 0.95rem;
    outline: none;
    background: #f5f5f5;
    transition: border-color 0.2s;
    resize: none;
    max-height: 100px;

    &:focus {
        border-color: #075e54;
        background: #fff;
    }

    &:disabled {
        background: #f0f0f0;
        cursor: not-allowed;
    }
}

.send-btn {
    width: 36px;
    height: 36px;
    padding: 0;
    background: #075e54;
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    flex-shrink: 0;

    &:hover:not(:disabled) {
        background: #064e47;
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }

    &:disabled {
        background: #ccc;
        cursor: not-allowed;
    }
}

.cooldown-msg {
    text-align: center;
    color: #e53935;
    font-size: 0.8rem;
    margin: 0;
    padding: 0.5rem 0.75rem;
    background: #ffebee;
}
</style>
