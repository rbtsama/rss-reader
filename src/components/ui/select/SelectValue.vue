<script setup lang="ts">
import { inject, type Ref } from 'vue'

defineProps<{
  placeholder?: string
}>()

const { selectedValue } = inject('select') as { selectedValue: Ref<string> }
</script>

<template>
  <span class="block truncate">
    {{ selectedValue || placeholder }}
  </span>
</template> 