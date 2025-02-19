<template>
  <div class="rss-manager">
    <n-card title="订阅列表">
      <template #header-extra>
        <n-button type="primary" @click="handleAdd">
          新增订阅
        </n-button>
      </template>
      
      <RssList 
        :sources="rssSources"
        @preview="handlePreview"
        @edit="handleEdit"
        @delete="handleDelete"
        @subscribe="handleSubscribe"
      />
    </n-card>

    <n-drawer v-model:show="showPreview" :width="700">
      <RssPreview v-if="currentSource" :source="currentSource" />
    </n-drawer>

    <n-modal
      v-model:show="showForm"
      :title="isEditing ? '编辑订阅' : '新增订阅'"
      preset="card"
      style="width: 600px"
      :bordered="false"
    >
      <RssForm 
        :initial-data="editingSource" 
        :is-edit="isEditing"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NCard, NDrawer, NModal, NButton, useMessage } from 'naive-ui'
import type { RssSource } from '../types/rss'
import { storage } from '../services/storage'
import RssForm from '../components/RssForm.vue'
import RssList from '../components/RssList.vue'
import RssPreview from '../components/RssPreview.vue'

const message = useMessage()
const rssSources = ref<RssSource[]>([])
const showPreview = ref(false)
const showForm = ref(false)
const currentSource = ref<RssSource | null>(null)
const editingSource = ref<RssSource | null>(null)

const isEditing = computed(() => !!editingSource.value)

// 初始化时加载数据
onMounted(() => {
  rssSources.value = storage.getRssSources()
})

const handleAdd = () => {
  editingSource.value = null
  showForm.value = true
}

const handleSubmit = (data: Omit<RssSource, 'id' | 'isSubscribed'>) => {
  if (isEditing.value && editingSource.value) {
    // 编辑现有源
    const updatedSource = {
      ...editingSource.value,
      ...data
    }
    const index = rssSources.value.findIndex(s => s.id === editingSource.value!.id)
    if (index > -1) {
      rssSources.value[index] = updatedSource
      storage.updateRssSource(updatedSource)
      message.success('修改成功')
    }
  } else {
    // 添加新源
    const newSource: RssSource = {
      ...data,
      id: Date.now().toString(),
      isSubscribed: false
    }
    rssSources.value.push(newSource)
    storage.addRssSource(newSource)
    message.success('添加成功')
  }
  showForm.value = false
  editingSource.value = null
}

const handlePreview = (source: RssSource) => {
  currentSource.value = source
  showPreview.value = true
}

const handleEdit = (source: RssSource) => {
  editingSource.value = { ...source }
  showForm.value = true
}

const handleCancel = () => {
  showForm.value = false
  editingSource.value = null
}

const handleDelete = (source: RssSource) => {
  const index = rssSources.value.findIndex(s => s.id === source.id)
  if (index > -1) {
    rssSources.value.splice(index, 1)
    storage.deleteRssSource(source.id)
    message.success('删除成功')
  }
}

const handleSubscribe = (source: RssSource) => {
  source.isSubscribed = !source.isSubscribed
  storage.updateRssSource(source)
  message.success(source.isSubscribed ? '订阅成功' : '已取消订阅')
}
</script>

<style scoped>
.rss-manager {
  width: 100%;
}

@media (max-width: 768px) {
  :deep(.n-modal) {
    width: 90% !important;
  }
  
  :deep(.n-drawer) {
    width: 100% !important;
  }
}
</style> 