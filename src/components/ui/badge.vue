<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { BadgeVariants } from './badge'

interface Props {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const badgeClasses = computed(() => {
  return cn(BadgeVariants({ variant: props.variant }), props.class)
})
</script>

<template>
  <div :class="badgeClasses">
    <slot />
  </div>
</template> 