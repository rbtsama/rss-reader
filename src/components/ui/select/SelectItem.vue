<script setup lang="ts">
import { inject } from 'vue'

const props = defineProps<{
  value: string
}>()

const { updateValue } = inject('select') as { updateValue: (value: string) => void }
</script>

<template>
  <button
    type="button"
    class="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground"
    @click="updateValue(props.value)"
  >
    <slot />
  </button>
</template> 