<script setup lang="ts">
import { inject } from 'vue'
import Button from '@/components/ui/button.vue'

const { setOpen } = inject('alert-dialog') as { setOpen: (value: boolean) => void }
</script>

<template>
  <Button variant="outline" @click="setOpen(false)">
    <slot />
  </Button>
</template> 