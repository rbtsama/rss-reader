<script setup lang="ts">
import { DialogTitle } from '@headlessui/vue'
</script>

<template>
  <DialogTitle as="h3" class="text-lg font-semibold">
    <slot />
  </DialogTitle>
</template> 