<template>
  <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex flex-col space-y-8">
      <div class="flex items-center justify-between">
        <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          日拱一卒
          <span class="text-2xl font-medium text-muted-foreground ml-3 tracking-wide">
            Grains Make Mountains
          </span>
        </h1>
      </div>

      <div class="border-b border-border">
        <div class="flex h-12 items-center space-x-6 text-muted-foreground">
          <Button 
            v-for="tab in tabs" 
            :key="tab.name"
            variant="ghost"
            :class="[
              activeTab === tab.name 
                ? 'text-foreground border-b-2 border-primary' 
                : 'hover:text-foreground',
              'relative h-12 rounded-none px-6 text-base font-medium transition-colors'
            ]"
            @click="activeTab = tab.name"
          >
            {{ tab.label }}
          </Button>
        </div>
      </div>

      <div>
        <component :is="activeTab === 'reader' ? RssReader : RssManager" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RssReader from './RssReader.vue'
import RssManager from './RssManager.vue'
import { Button } from '@/components/ui'

const activeTab = ref('reader')
const tabs = [
  { name: 'reader', label: '我的订阅' },
  { name: 'manager', label: '订阅管理' }
]
</script> 