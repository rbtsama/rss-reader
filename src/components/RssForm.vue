<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <Toast ref="toastRef" />
    
    <!-- 名称输入 -->
    <div class="space-y-2">
      <Label for="name" class="text-[#4D4D4D]">名称</Label>
      <div class="relative">
        <Input
          id="name"
          v-model="formValue.name"
          placeholder="请输入订阅源名称"
          class="text-[#4D4D4D]"
          required
          :disabled="loading"
        />
        <span v-if="showValidation && !formValue.name.trim()" class="absolute -bottom-5 left-0 text-xs text-red-500">
          请输入名称
        </span>
      </div>
    </div>

    <!-- 类型选择 -->
    <div class="space-y-2">
      <Label for="type" class="text-[#4D4D4D]">类型</Label>
      <div class="relative">
        <Select 
          v-model="formValue.type"
          required
          :disabled="loading"
        >
          <SelectTrigger class="w-full">
            <SelectValue placeholder="请选择订阅源类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem
                v-for="(label, value) in typeOptions"
                :key="value"
                :value="value"
                :class="label.color"
              >
                {{ label.label }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <span v-if="showValidation && !formValue.type" class="absolute -bottom-5 left-0 text-xs text-red-500">
          请选择类型
        </span>
      </div>
    </div>

    <!-- URL 输入 -->
    <div class="space-y-2">
      <Label for="url" class="text-[#4D4D4D]">URL</Label>
      <div class="relative">
        <Input
          id="url"
          v-model="formValue.url"
          placeholder="请输入订阅源地址"
          class="text-[#4D4D4D]"
          required
          :disabled="loading"
          type="url"
        />
        <span v-if="showValidation && !formValue.url.trim()" class="absolute -bottom-5 left-0 text-xs text-red-500">
          请输入有效的URL
        </span>
      </div>
    </div>

    <!-- 按钮组 -->
    <div class="flex justify-end gap-4 mt-6">
      <Button
        type="button"
        variant="ghost"
        :disabled="loading"
        @click="handleCancel"
      >
        取消
      </Button>
      <Button
        type="submit"
        variant="outline"
        :disabled="loading"
        class="border-blue-200 hover:bg-blue-50 text-blue-700"
      >
        <template v-if="loading">
          <div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          验证中...
        </template>
        <template v-else>
          {{ isEdit ? '保存' : '添加' }}
        </template>
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import type { RssSource } from '../types/rss'
import { Button, Input, Label } from '@/components/ui'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
const showValidation = ref(false)
const formValue = ref({
  name: '',
  type: '',
  url: ''
})

const toastRef = ref<InstanceType<typeof Toast>>()

const typeOptions = {
  news: { label: '新闻', color: 'bg-blue-100 text-blue-700' },
  community: { label: '社群', color: 'bg-green-100 text-green-700' },
  finance: { label: '金融', color: 'bg-yellow-100 text-yellow-700' },
  tech: { label: '科技', color: 'bg-purple-100 text-purple-700' },
  programming: { label: '技术', color: 'bg-red-100 text-red-700' },
  blog: { label: '博客', color: 'bg-slate-100 text-slate-700' }
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
  showValidation.value = true
  
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