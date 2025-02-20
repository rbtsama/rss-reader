<script setup lang="ts">
import Button from '@/components/ui/button.vue'

const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <Button variant="destructive" @click="emit('click')">
    <slot />
  </Button>
</template> 