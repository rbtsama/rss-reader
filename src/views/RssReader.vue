<template>
  <div class="reader-container">
    <div class="flex justify-between items-center mb-6">
      <span class="text-gray-500 text-sm">
        {{ lastUpdateTime ? `上次更新: ${formatLastUpdateTime}` : '暂无更新' }}
      </span>
      <n-button 
        size="small"
        type="primary"
        :loading="isRefreshing"
        @click="refreshAll"
      >
        <template #icon>
          <n-icon><refresh /></n-icon>
        </template>
        刷新订阅
      </n-button>
    </div>
    <n-grid :x-gap="12" :y-gap="8" cols="1 s:2 m:3" responsive="screen">
      <n-grid-item v-for="source in subscribedSources" :key="source.id">
        <n-card :title="source.name" size="small" class="h-full">
          <template #header-extra>
            <n-tag :type="getTagType(source.type)">
              {{ typeMap[source.type as keyof typeof typeMap] || source.type }}
            </n-tag>
          </template>
          <n-scrollbar style="max-height: 300px">
            <n-spin :show="loading[source.id]">
              <n-list>
                <n-list-item v-for="item in sourceItems[source.id]" :key="item.id">
                  <n-ellipsis :line-clamp="2">
                    <n-button 
                      text 
                      @click="handleReadArticle(item)"
                    >
                      {{ item.title }}
                    </n-button>
                  </n-ellipsis>
                </n-list-item>
              </n-list>
              <n-empty v-if="!sourceItems[source.id]?.length" description="暂无数据" />
            </n-spin>
          </n-scrollbar>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-modal v-model:show="showArticle" preset="card" style="width: 600px">
      <template #header>
        <div class="text-lg font-bold">{{ currentArticle?.title }}</div>
      </template>
      <n-scrollbar style="max-height: 70vh">
        <div v-html="currentArticle?.description"></div>
      </n-scrollbar>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showArticle = false">关闭</n-button>
          <n-button 
            type="primary" 
            tag="a" 
            :href="currentArticle?.link" 
            target="_blank"
          >
            阅读原文
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { 
  NGrid, 
  NGridItem, 
  NCard, 
  NList, 
  NListItem, 
  NButton, 
  NEllipsis,
  NModal,
  NScrollbar,
  NSpin,
  NSpace,
  NEmpty,
  NIcon,
  useMessage
} from 'naive-ui'
import type { RssSource, RssItem } from '../types/rss'
import { storage } from '../services/storage'
import { Refresh } from '@vicons/ionicons5'

const message = useMessage()
const subscribedSources = ref<RssSource[]>([])
const sourceItems = ref<Record<string, RssItem[]>>({})
const loading = ref<Record<string, boolean>>({})
const showArticle = ref(false)
const currentArticle = ref<RssItem | null>(null)
const lastUpdateTime = ref<number>(Number(localStorage.getItem('last_update_time')) || 0)
const isRefreshing = ref(false)

// 添加类型映射
const typeMap = {
  news: '新闻',
  community: '社群',
  finance: '金融',
  tech: '科技',
  programming: '技术',
  blog: '博客'
}

// 添加标签类型映射
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

const formatLastUpdateTime = computed(() => {
  if (!lastUpdateTime.value) return ''
  return new Date(lastUpdateTime.value).toLocaleString('zh-CN')
})

const shouldRefresh = () => {
  const threeHours = 3 * 60 * 60 * 1000 // 3小时的毫秒数
  return !lastUpdateTime.value || (Date.now() - lastUpdateTime.value) > threeHours
}

const refreshAll = async () => {
  isRefreshing.value = true
  try {
    for (const source of subscribedSources.value) {
      await fetchSourceItems(source)
    }
    lastUpdateTime.value = Date.now()
    localStorage.setItem('last_update_time', lastUpdateTime.value.toString())
    message.success('刷新成功')
  } catch (error) {
    console.error('刷新失败:', error)
    message.error('部分订阅刷新失败')
  } finally {
    isRefreshing.value = false
  }
}

const parseRssContent = (content: string): RssItem[] => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/xml')
  
  // 处理 RSS 2.0
  const items = Array.from(doc.querySelectorAll('item')).map(item => ({
    id: item.querySelector('guid')?.textContent || '',
    title: item.querySelector('title')?.textContent || '无标题',
    link: item.querySelector('link')?.textContent || '',
    description: item.querySelector('description')?.textContent || '',
    pubDate: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
    sourceId: ''
  }))

  // 如果没有找到 RSS 2.0 的 items，尝试解析 Atom
  if (items.length === 0) {
    return Array.from(doc.querySelectorAll('entry')).map(entry => ({
      id: entry.querySelector('id')?.textContent || '',
      title: entry.querySelector('title')?.textContent || '无标题',
      link: entry.querySelector('link')?.getAttribute('href') || '',
      description: entry.querySelector('content')?.textContent || 
                  entry.querySelector('summary')?.textContent || '',
      pubDate: entry.querySelector('published')?.textContent || 
               entry.querySelector('updated')?.textContent || 
               new Date().toISOString(),
      sourceId: ''
    }))
  }

  return items
}

const fetchSourceItems = async (source: RssSource) => {
  // 只有在实际刷新时才设置 loading 状态
  if (isRefreshing.value) {
    loading.value[source.id] = true
  }
  
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
        const items = parseRssContent(response.data)
        if (items.length > 0) {
          return items
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
    const fastProxyUrl = `https://cors.eu.org/${source.url}`
    const items = await fetchWithProxy(fastProxyUrl, 5000)
    if (items) {
      sourceItems.value[source.id] = items.map(item => ({
        ...item,
        sourceId: source.id
      })).slice(0, 10)
      localStorage.setItem('cached_items', JSON.stringify(sourceItems.value))
      loading.value[source.id] = false
      return
    }
  } catch (error) {
    console.error('快速代理失败:', error)
  }

  // 如果快速代理失败，尝试其他代理
  const fallbackProxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(source.url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(source.url)}`
  ]

  for (const proxyUrl of fallbackProxies) {
    try {
      const items = await fetchWithProxy(proxyUrl, 10000)
      if (items) {
        sourceItems.value[source.id] = items.map(item => ({
          ...item,
          sourceId: source.id
        })).slice(0, 10)
        localStorage.setItem('cached_items', JSON.stringify(sourceItems.value))
        break
      }
    } catch (error) {
      console.error(`备用代理失败:`, error)
      continue
    }
  }

  if (!sourceItems.value[source.id]) {
    message.error(`获取 ${source.name} 的内容失败`)
  }
  loading.value[source.id] = false
}

const handleUnsubscribe = (source: RssSource) => {
  source.isSubscribed = false
  storage.updateRssSource(source)
  const index = subscribedSources.value.findIndex(s => s.id === source.id)
  if (index > -1) {
    subscribedSources.value.splice(index, 1)
  }
  message.success('已取消订阅')
}

const handleReadArticle = (item: RssItem) => {
  currentArticle.value = item
  showArticle.value = true
}

onMounted(async () => {
  subscribedSources.value = storage.getRssSources().filter(s => s.isSubscribed)
  
  // 从本地存储加载缓存的数据
  const cachedItems = localStorage.getItem('cached_items')
  if (cachedItems) {
    sourceItems.value = JSON.parse(cachedItems)
    // 不显示 loading 状态
    subscribedSources.value.forEach(source => {
      loading.value[source.id] = false
    })
  }
  
  // 只在需要时刷新
  if (shouldRefresh()) {
    await refreshAll()
  }
})
</script>

<style scoped>
.reader-container {
  width: 100%;
  position: relative;
}

.h-full {
  height: 100%;
}

:deep(.n-list-item) {
  padding: 8px 0;
}

:deep(.n-button) {
  text-align: left;
  padding: 0;
}

@media (max-width: 640px) {
  .reader-container {
    padding: 0 8px;
  }
}
</style> 