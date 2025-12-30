<template>
  <div class="keypad">
    <button v-for="num in 9" :key="num" class="key-btn" @click="$emit('digit', num)">
      <span v-if="num" class="key-content">
        <span class="num">{{ num }}</span>
      </span>
      <span v-else>{{ num }}</span>
    </button>
    <button class="key-btn clear-btn" @click="$emit('clear')">
      <i class="fas fa-backspace"></i>
    </button>
    <button class="key-btn" @click="$emit('digit', 0)">
      <span class="num">0</span>
    </button>
    <button class="key-btn" :class="actionButtonClass" @click="$emit('action')" :disabled="actionDisabled">
      <i :class="actionIcon"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  actionIcon?: string
  actionButtonClass?: string
  actionDisabled?: boolean
}>()

defineEmits<{
  digit: [value: number]
  clear: []
  action: []
}>()

</script>

<style scoped lang="scss">
.keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.75rem;
  margin-bottom: 1rem;

  .key-btn {
    width: 60px;
    height: 60px;
    border: none;
    border-radius: 50%;
    background: #f5f5f5;
    font-size: 1.5rem;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    color: #333;
    line-height: 1;

    &:active {
      transform: scale(0.95);
    }

    .key-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .letters {
        font-size: 0.65rem;
        margin-top: 2px;
        opacity: 0.6;
        letter-spacing: 1px;
        font-weight: 400;
      }
    }

    i {
      font-size: 1.2rem;
    }

    &.clear-btn {
      background: #e53935;
      color: white;

      &:hover {
        background: #d32f2f;
      }
    }

    &.enter-btn {
      background: #4caf50;
      color: white;

      &:hover {
        background: #45a049;
      }
    }

    &.call-btn {
      background: #4caf50;
      color: white;

      &:hover:not(:disabled) {
        background: #45a049;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: #cccccc;
      }
    }
  }
}
</style>
