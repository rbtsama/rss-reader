<template>
  <div
    v-if="show"
    class="fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg"
    :class="typeClasses[type]"
  >
    <span class="text-sm font-medium">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const typeClasses = {
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800'
}

const show = ref(false)
const message = ref('')
const type = ref<keyof typeof typeClasses>('info')

const toast = (msg: string, t: keyof typeof typeClasses = 'info') => {
  message.value = msg
  type.value = t
  show.value = true
  setTimeout(() => {
    show.value = false
  }, 3000)
}

defineExpose({ toast })
</script> 