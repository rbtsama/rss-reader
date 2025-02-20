<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <Toast ref="toastRef" />
    
    <!-- 名称输入 -->
    <div class="space-y-2">
      <Label for="name">名称</Label>
      <Input
        id="name"
        v-model="formValue.name"
        type="text"
        required
      />
    </div>

    <!-- 类型选择 -->
    <div class="space-y-2">
      <Label for="type">类型</Label>
      <Select
        id="type"
        v-model="formValue.type"
        required
      >
        <option value="">请选择类型</option>
        <option v-for="(label, value) in typeOptions" :key="value" :value="value">
          {{ label }}
        </option>
      </Select>
    </div>

    <!-- URL 输入 -->
    <div class="space-y-2">
      <Label for="url">URL</Label>
      <Input
        id="url"
        v-model="formValue.url"
        type="url"
        required
        :disabled="loading"
      />
    </div>

    <!-- 按钮组 -->
    <div class="flex justify-end space-x-4">
      <Button
        type="button"
        variant="ghost"
        @click="handleCancel"
      >
        取消
      </Button>
      <Button
        type="submit"
        :disabled="loading"
      >
        {{ loading ? '验证中...' : '确定' }}
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import type { RssSource } from '../types/rss'
import { Button, Input, Label, Select } from '@/components/ui'
import Toast from './Toast.vue'

const props = defineProps<{
  initialData?: RssSource | null
  isEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', data: Omit<RssSource, 'id' | 'isSubscribed'>): void
  (e: 'cancel'): void
}>()

const loading = ref(false)
const formValue = ref({
  name: '',
  type: '',
  url: ''
})

const toastRef = ref<InstanceType<typeof Toast>>()

const typeOptions = {
  news: '新闻',
  community: '社群',
  finance: '金融',
  tech: '科技',
  programming: '技术',
  blog: '博客'
}

onMounted(() => {
  if (props.initialData) {
    formValue.value = {
      name: props.initialData.name,
      type: props.initialData.type,
      url: props.initialData.url
    }
  }
})

const validateRss = async (url: string) => {
  if (!url) return false

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    toastRef.value?.toast('请输入有效的URL', 'error')
    return false
  }

  loading.value = true
  
  // 定义多个代理服务，按顺序尝试
  const proxyUrls = [
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://cors.eu.org/${url}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ]

  for (const getProxyUrl of proxyUrls) {
    try {
      const proxyUrl = getProxyUrl(url)
      const response = await axios.get(proxyUrl, {
        timeout: 10000, // 10秒超时
        headers: {
          'Accept': 'application/xml, text/xml, application/rss+xml, application/atom+xml'
        }
      })
      
      if (typeof response.data === 'string') {
        const parser = new DOMParser()
        const xml = parser.parseFromString(response.data, 'text/xml')
        
        // 检查是否为有效的 XML
        if (xml.getElementsByTagName('parsererror').length > 0) {
          console.warn('XML 解析错误，尝试下一个代理')
          continue
        }

        // 检查 RSS 2.0
        const rssItems = xml.getElementsByTagName('item')
        if (rssItems.length > 0) {
          toastRef.value?.toast('RSS 源验证成功', 'success')
          return true
        }

        // 检查 Atom
        const atomItems = xml.getElementsByTagName('entry')
        if (atomItems.length > 0) {
          toastRef.value?.toast('Atom 源验证成功', 'success')
          return true
        }

        // 检查 RSS 1.0
        const rdfItems = xml.getElementsByTagName('rdf:item')
        if (rdfItems.length > 0) {
          toastRef.value?.toast('RSS 1.0 源验证成功', 'success')
          return true
        }

        // 如果没有找到任何文章，尝试下一个代理
        console.warn('未找到文章，尝试下一个代理')
        continue
      }
    } catch (error) {
      console.error('代理访问失败:', error)
      continue // 尝试下一个代理
    }
  }

  toastRef.value?.toast('无法验证 RSS 源，请检查 URL 是否正确', 'error')
  loading.value = false
  return false
}

const handleSubmit = async (e: Event) => {
  e.preventDefault()
  
  // 验证表单
  if (!formValue.value.name.trim()) {
    toastRef.value?.toast('请输入名称', 'error')
    return
  }
  if (!formValue.value.type) {
    toastRef.value?.toast('请选择类型', 'error')
    return
  }
  if (!formValue.value.url.trim()) {
    toastRef.value?.toast('请输入URL', 'error')
    return
  }

  if (!props.isEdit) {
    if (!(await validateRss(formValue.value.url))) {
      return
    }
  }

  emit('submit', {
    name: formValue.value.name.trim(),
    type: formValue.value.type,
    url: formValue.value.url.trim()
  })
}

const handleCancel = () => {
  emit('cancel')
}
</script> 