<script setup lang="ts">
import { inject, type Ref } from 'vue'

const { open } = inject('select') as { open: Ref<boolean> }
</script>

<template>
  <div
    v-if="open"
    class="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 w-full"
  >
    <div class="w-full p-1">
      <slot />
    </div>
  </div>
</template> 