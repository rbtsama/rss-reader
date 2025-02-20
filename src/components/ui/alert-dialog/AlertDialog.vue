<script setup lang="ts">
import { provide, ref } from 'vue'

const open = ref(false)

provide('alert-dialog', {
  open,
  setOpen: (value: boolean) => open.value = value
})
</script>

<template>
  <slot />
</template> 