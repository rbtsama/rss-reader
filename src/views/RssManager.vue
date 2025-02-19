<template>
  <div class="rss-manager">
    <n-card title="添加RSS源">
      <RssForm @submit="handleAddRss" />
    </n-card>
    
    <n-card title="RSS源列表" class="mt-4">
      <RssList 
        :sources="rssSources"
        @preview="handlePreview"
        @edit="handleEdit"
        @delete="handleDelete"
        @subscribe="handleSubscribe"
      />
    </n-card>

    <n-drawer v-model:show="showPreview" :width="480">
      <RssPreview v-if="currentSource" :source="currentSource" />
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RssSource } from '../types/rss'
import RssForm from '../components/RssForm.vue'
import RssList from '../components/RssList.vue'
import RssPreview from '../components/RssPreview.vue'

const rssSources = ref<RssSource[]>([])
const showPreview = ref(false)
const currentSource = ref<RssSource | null>(null)

// 实现相关方法...
</script>

<style scoped>
.rss-manager {
  max-width: 1200px;
  margin: 0 auto;
}

.mt-4 {
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .n-drawer {
    width: 100% !important;
  }
}
</style> 