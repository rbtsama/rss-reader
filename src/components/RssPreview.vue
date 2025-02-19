<template>
  <n-drawer-content>
    <template #header>
      <div class="flex items-center justify-between">
        <span>{{ source.name }}</span>
        <n-space>
          <n-tag :type="getTagType(source.type)" :bordered="false">
            {{ typeMap[source.type as keyof typeof typeMap] || source.type }}
          </n-tag>
          <n-button 
            size="tiny"
            :type="source.isSubscribed ? 'default' : 'primary'"
            @click="handleSubscribe"
          >
            {{ source.isSubscribed ? '取消订阅' : '订阅' }}
          </n-button>
        </n-space>
      </div>
    </template>
    
    <div class="preview-content">
      <n-spin :show="loading">
        <template v-if="items.length">
          <n-list>
            <n-list-item v-for="item in items" :key="item.id">
              <n-thing :title="item.title">
                <template #description>
                  <p class="text-gray-500 text-sm">{{ formatDate(item.pubDate) }}</p>
                </template>
                <div class="line-clamp-6" v-html="item.description"></div>
              </n-thing>
            </n-list-item>
          </n-list>
        </template>
        <n-empty v-else description="暂无数据" />
      </n-spin>
    </div>
  </n-drawer-content>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { 
  NDrawerContent, 
  NTag, 
  NSpin, 
  NList, 
  NListItem, 
  NThing, 
  NButton, 
  NEmpty,
  NSpace,
  NText,
  useMessage
} from 'naive-ui'
import type { RssSource, RssItem } from '../types/rss'

const props = defineProps<{
  source: RssSource
}>()

const loading = ref(true)
const items = ref<RssItem[]>([])

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const emit = defineEmits<{
  (e: 'subscribe', source: RssSource): void
}>()

const handleSubscribe = () => {
  props.source.isSubscribed = !props.source.isSubscribed
  emit('subscribe', props.source)
}

const message = useMessage()

const typeMap = {
  news: '新闻',
  community: '社群',
  finance: '金融',
  tech: '科技',
  programming: '技术',
  blog: '博客'
}

const getTagType = (type: string) => {
  const typeColorMap: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    news: 'info',
    community: 'success',
    finance: 'warning',
    tech: 'info',
    programming: 'error',
    blog: 'default'
  }
  return typeColorMap[type] || 'default'
}

const parseRssContent = (content: string): RssItem[] => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/xml')
  
  // 处理 RSS 2.0
  let items = Array.from(doc.querySelectorAll('item')).map(item => ({
    id: item.querySelector('guid')?.textContent || 
        item.querySelector('link')?.textContent || 
        Date.now().toString(),
    title: item.querySelector('title')?.textContent || '无标题',
    link: item.querySelector('link')?.textContent || '',
    description: item.querySelector('description')?.textContent || '',
    pubDate: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
    sourceId: props.source.id
  }))

  // 如果没有找到 RSS 2.0 的 items，尝试解析 Atom
  if (items.length === 0) {
    items = Array.from(doc.querySelectorAll('entry')).map(entry => ({
      id: entry.querySelector('id')?.textContent || 
          entry.querySelector('link')?.getAttribute('href') || 
          Date.now().toString(),
      title: entry.querySelector('title')?.textContent || '无标题',
      link: entry.querySelector('link')?.getAttribute('href') || '',
      description: entry.querySelector('content')?.textContent || 
                  entry.querySelector('summary')?.textContent || '',
      pubDate: entry.querySelector('published')?.textContent || 
               entry.querySelector('updated')?.textContent || 
               new Date().toISOString(),
      sourceId: props.source.id
    }))
  }

  return items.map(item => ({
    ...item,
    description: cleanDescription(item.description || '')
  }))
}

const cleanDescription = (description: string): string => {
  // 移除可能的 CDATA 包装
  description = description.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
  
  // 如果内容是 HTML，保留基本格式但移除不安全的标签和属性
  const div = document.createElement('div')
  div.innerHTML = description
  
  // 移除脚本和样式标签
  const scripts = div.getElementsByTagName('script')
  const styles = div.getElementsByTagName('style')
  while (scripts.length > 0) scripts[0].remove()
  while (styles.length > 0) styles[0].remove()
  
  return div.innerHTML
}

const proxyUrls = [
  (url: string) => `https://cors.eu.org/${url}`,  // 添加一个更快的代理
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
]

onMounted(async () => {
  loading.value = true

  const fetchWithProxy = async (proxyUrl: string, timeout: number = 5000) => {
    try {
      const response = await axios.get(proxyUrl, {
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout
      })
      
      if (typeof response.data === 'string') {
        const parsedItems = parseRssContent(response.data)
        if (parsedItems.length > 0) {
          return parsedItems
        }
      }
      return null
    } catch (error) {
      console.error('代理获取失败:', error)
      return null
    }
  }

  // 首先尝试快速代理
  try {
    const fastProxyUrl = `https://cors.eu.org/${props.source.url}`
    const items = await fetchWithProxy(fastProxyUrl, 5000)
    if (items) {
      items.value = items.slice(0, 10)
      loading.value = false
      return
    }
  } catch (error) {
    console.error('快速代理失败:', error)
  }

  // 如果快速代理失败，尝试其他代理
  const fallbackProxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(props.source.url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(props.source.url)}`
  ]

  for (const proxyUrl of fallbackProxies) {
    try {
      const fetchedItems = await fetchWithProxy(proxyUrl, 10000)
      if (fetchedItems) {
        items.value = fetchedItems.slice(0, 10)
        break
      }
    } catch (error) {
      console.error(`备用代理失败:`, error)
      continue
    }
  }

  if (!items.value.length) {
    message.error('获取RSS内容失败')
  }
  loading.value = false
})
</script>

<style scoped>
.preview-content {
  padding: 16px 0;
}

.line-clamp-6 {
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 