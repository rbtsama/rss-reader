<template>
  <Toast ref="toastRef" />
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <h3 class="text-2xl font-semibold leading-none tracking-tight">订阅列表</h3>
        <Button @click="handleAdd">
          <PlusIcon class="mr-2 h-4 w-4" />
          新增订阅
        </Button>
      </div>
    </CardHeader>
    <div class="p-6">
      <RssList 
        :sources="rssSources"
        @preview="handlePreview"
        @edit="handleEdit"
        @delete="handleDelete"
        @subscribe="handleSubscribe"
      />
    </div>
  </Card>

  <!-- 预览抽屉 -->
  <Transition
    enter-active-class="transition ease-in-out duration-300 transform"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition ease-in-out duration-300 transform"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <div v-if="showPreview" class="fixed inset-0 overflow-hidden z-50">
      <div class="absolute inset-0 overflow-hidden">
        <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div class="pointer-events-auto w-screen max-w-2xl">
            <Card class="h-full flex flex-col">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold">预览</h2>
                  <Button variant="ghost" size="icon" @click="showPreview = false">
                    <XIcon class="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <div class="flex-1 overflow-y-auto p-6">
                <RssPreview v-if="currentSource" :source="currentSource" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 表单模态框 -->
  <TransitionRoot appear :show="showForm" as="template">
    <Dialog as="div" @close="handleCancel" class="relative z-50">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-md">
              <Card>
                <CardHeader>
                  <DialogTitle as="h3" class="text-lg font-semibold">
                    {{ isEditing ? '编辑订阅' : '新增订阅' }}
                  </DialogTitle>
                </CardHeader>
                <div class="p-6">
                  <RssForm 
                    :initial-data="editingSource" 
                    :is-edit="isEditing"
                    @submit="handleSubmit"
                    @cancel="handleCancel"
                  />
                </div>
              </Card>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { PlusIcon, XIcon } from 'lucide-vue-next'
import type { RssSource } from '../types/rss'
import { storage } from '../services/storage'
import { Button, Card, CardHeader } from '@/components/ui'
import RssForm from '../components/RssForm.vue'
import RssList from '../components/RssList.vue'
import RssPreview from '../components/RssPreview.vue'
import Toast from '../components/Toast.vue'

const rssSources = ref<RssSource[]>([])
const showPreview = ref(false)
const showForm = ref(false)
const currentSource = ref<RssSource | null>(null)
const editingSource = ref<RssSource | null>(null)
const toastRef = ref()

const isEditing = computed(() => !!editingSource.value)

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
      toastRef.value?.toast('修改成功', 'success')
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
    toastRef.value?.toast('添加成功', 'success')
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

const handleDelete = async (source: RssSource) => {
  // 第一次确认
  const firstConfirm = window.confirm(`确定要删除 "${source.name}" 吗？`)
  if (!firstConfirm) return

  // 第二次确认
  const secondConfirm = window.confirm(`再次确认是否删除 "${source.name}"？此操作不可恢复。`)
  if (!secondConfirm) return

  const index = rssSources.value.findIndex(s => s.id === source.id)
  if (index > -1) {
    rssSources.value.splice(index, 1)
    storage.deleteRssSource(source.id)
    toastRef.value?.toast('删除成功', 'success')
  }
}

const handleSubscribe = (source: RssSource) => {
  source.isSubscribed = !source.isSubscribed
  storage.updateRssSource(source)
  toastRef.value?.toast(source.isSubscribed ? '订阅成功' : '已取消订阅', 'success')
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