<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { ButtonVariants } from './button'

interface Props {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  class?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  disabled: false
})

const buttonClasses = computed(() => {
  return cn(ButtonVariants({ variant: props.variant, size: props.size }), props.class)
})
</script>

<template>
  <button
    :disabled="disabled"
    :class="buttonClasses"
  >
    <slot />
  </button>
</template> 