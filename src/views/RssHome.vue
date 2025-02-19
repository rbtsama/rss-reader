<template>
  <div class="rss-home">
    <n-tabs
      v-model:value="activeTab"
      type="segment"
      animated
      style="margin-bottom: 16px"
    >
      <n-tab-pane name="reader" tab="我的订阅">
        <RssReader />
      </n-tab-pane>
      <n-tab-pane name="manager" tab="订阅管理">
        <RssManager />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NTabs, NTabPane } from 'naive-ui'
import RssReader from './RssReader.vue'
import RssManager from './RssManager.vue'

const activeTab = ref('reader')
</script>

<style scoped>
.rss-home {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

@media (max-width: 640px) {
  .rss-home {
    padding: 12px;
  }
}
</style> 