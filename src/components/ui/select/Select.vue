<script setup lang="ts">
import { provide, ref } from 'vue'
import type { Ref } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const open = ref(false)
const selectedValue = ref(props.modelValue)

provide('select', {
  open,
  selectedValue,
  updateValue: (value: string) => {
    selectedValue.value = value
    emit('update:modelValue', value)
    open.value = false
  }
})
</script>

<template>
  <div class="relative">
    <slot />
  </div>
</template> 