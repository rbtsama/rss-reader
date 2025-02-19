<template>
  <n-form
    ref="formRef"
    :model="formValue"
    :rules="rules"
    label-placement="left"
    label-width="80"
    require-mark-placement="right-hanging"
  >
    <n-form-item label="名称" path="name">
      <n-input v-model:value="formValue.name" placeholder="请输入名称" />
    </n-form-item>
    
    <n-form-item label="类型" path="type">
      <n-select
        v-model:value="formValue.type"
        :options="typeOptions"
        placeholder="请选择类型"
      />
    </n-form-item>
    
    <n-form-item label="URL" path="url">
      <n-input v-model:value="formValue.url" placeholder="请输入RSS地址" />
    </n-form-item>
    
    <div class="flex justify-end gap-4 mt-6">
      <n-button @click="handleCancel">取消</n-button>
      <n-button type="primary" :loading="loading" @click="handleSubmit">
        确认
      </n-button>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import axios from 'axios'
import { 
  NForm, 
  NFormItem, 
  NInput, 
  NSelect, 
  NButton, 
  FormInst, 
  FormRules,
  useMessage
} from 'naive-ui'
import type { RssSource } from '../types/rss'

const props = defineProps<{
  initialData?: RssSource
  isEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', data: Omit<RssSource, 'id' | 'isSubscribed'>): void
  (e: 'cancel'): void
}>()

const message = useMessage()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)

const formValue = reactive({
  name: props.initialData?.name ?? '',
  type: props.initialData?.type ?? '',
  url: props.initialData?.url ?? ''
})

const typeOptions = [
  { label: '新闻', value: 'news' },
  { label: '社群', value: 'community' },
  { label: '金融', value: 'finance' },
  { label: '科技', value: 'tech' },
  { label: '技术', value: 'programming' },
  { label: '博客', value: 'blog' }
]

const validateUrl = async (url: string) => {
  if (!url) {
    return false
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    message.error('请输入有效的URL')
    return false
  }

  loading.value = true
  try {
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    const response = await axios.get(proxyUrl)
    
    if (typeof response.data === 'string') {
      const parser = new DOMParser()
      const xml = parser.parseFromString(response.data, 'text/xml')
      
      if (xml.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Invalid RSS format')
      }
      return true
    }
    throw new Error('Invalid response format')
  } catch (error) {
    console.error('RSS验证失败:', error)
    message.error('RSS验证失败，请检查URL是否正确')
    return false
  } finally {
    loading.value = false
  }
}

const rules = {
  name: {
    required: true,
    message: '请输入名称',
    trigger: 'blur'
  },
  type: {
    required: true, 
    message: '请选择类型',
    trigger: 'change'
  },
  url: {
    required: true,
    message: '请输入URL',
    trigger: 'blur'
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    
    // 只在新增时验证 URL
    if (!props.isEdit) {
      if (!(await validateUrl(formValue.url))) {
        return
      }
    }

    emit('submit', {
      ...formValue
    })

    if (!props.isEdit) {
      formValue.name = ''
      formValue.type = ''
      formValue.url = ''
      formRef.value?.restoreValidation()
    }
  } catch (error) {
    // 表单验证失败
  }
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.n-form {
  padding: 8px;
}

.form-actions {
  margin-top: 24px;
}

:deep(.n-form-item) {
  margin-bottom: 18px;
}

:deep(.n-input),
:deep(.n-select) {
  width: 100%;
}
</style> 