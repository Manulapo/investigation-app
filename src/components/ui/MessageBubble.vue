<template>
  <div class="message-row" :class="{ 'is-user': sender === 'user', 'is-contact': sender === 'contact' }">
    <div class="bubble">
      <p class="text">{{ content }}</p>
      <span class="timestamp">{{ formattedTime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'

const props = defineProps<{
  content: string
  sender: 'user' | 'contact'
  timestamp: number
}>()

const formattedTime = computed(() => {
  const date = new Date(props.timestamp)
  return format(date, 'HH:mm')
})
</script>

<style scoped lang="scss">
.message-row {
  display: flex;
  margin-bottom: 0.5rem;
  animation: slideIn 0.3s ease;

  &.is-user {
    justify-content: flex-end;
  }

  &.is-contact {
    justify-content: flex-start;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bubble {
  max-width: 85%;
  padding: 0.6rem 0.9rem;
  border-radius: 12px;
  word-wrap: break-word;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  .is-user & {
    background: #dcf8c6;
    color: #000;
    border-bottom-right-radius: 2px;
  }

  .is-contact & {
    background: #fff;
    color: #000;
    border-bottom-left-radius: 2px;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  }
}

.text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.3;
}

.timestamp {
  font-size: 0.7rem;
  opacity: 0.6;
  align-self: flex-end;
}
</style>
