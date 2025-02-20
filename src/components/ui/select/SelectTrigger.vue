<script setup lang="ts">
import { inject, type Ref } from 'vue'

const { open } = inject('select') as { open: Ref<boolean> }
</script>

<template>
  <button
    type="button"
    @click="open = !open"
    class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <slot />
  </button>
</template> 