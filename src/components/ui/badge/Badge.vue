<script setup lang="ts">
  import { computed } from 'vue'
  import type { BadgeProps } from './Badge'
  
  const props = withDefaults(defineProps<BadgeProps>(), {
    variant: 'default',
    className: ''
  })
  
  const badgeClass = computed(() => {
    // 如果传入的是完整的 Tailwind 类名
    if (props.variant.includes('bg-')) {
      return props.variant
    }

    // 否则使用预设的样式
    const variantMap: Record<string, string> = {
      news: 'bg-blue-100 text-blue-700',
      community: 'bg-green-100 text-green-700',
      finance: 'bg-yellow-100 text-yellow-700',
      tech: 'bg-purple-100 text-purple-700',
      programming: 'bg-red-100 text-red-700',
      blog: 'bg-slate-100 text-slate-700',
      default: 'bg-gray-100 text-gray-700'
    }
    return variantMap[props.variant] || variantMap.default
  })
</script>

<template>
  <div
    :class="[
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      badgeClass,
      className
    ]"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template> 