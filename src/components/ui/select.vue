<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  class?: string
  disabled?: boolean
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  modelValue: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <select
    :disabled="disabled"
    :value="modelValue"
    @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    :class="cn(
      'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      props.class
    )"
  >
    <slot />
  </select>
</template> 