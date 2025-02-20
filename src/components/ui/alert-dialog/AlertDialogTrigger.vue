<script setup lang="ts">
import { inject } from 'vue'

const props = defineProps<{
  asChild?: boolean
}>()

const { setOpen } = inject('alert-dialog') as { setOpen: (value: boolean) => void }
</script>

<template>
  <div @click="setOpen(true)">
    <slot />
  </div>
</template> 