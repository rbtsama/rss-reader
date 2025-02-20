<template>
  <div class="h-full flex flex-col">
    <!-- 头部 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <h2 class="text-2xl font-semibold tracking-tight text-[#333333]">{{ source.name }}</h2>
        <Badge :variant="source.type">
          {{ typeMap[source.type as keyof typeof typeMap] || source.type }}
        </Badge>
      </div>
      <Button
        @click="handleSubscribe"
        :variant="source.isSubscribed ? 'ghost' : 'outline'"
        :class="source.isSubscribed ? 'text-muted-foreground' : 'border-blue-200 hover:bg-blue-50 text-blue-700'"
        size="sm"
      >
        <RssIcon class="h-4 w-4 mr-2" />
        {{ source.isSubscribed ? '取消订阅' : '订阅' }}
      </Button>
    </div>

    <!-- 内容区 -->
    <div class="flex-1 overflow-y-auto">
      <div class="space-y-6">
        <div v-if="loading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <div v-else-if="items.length" class="space-y-6">
          <article v-for="item in items" :key="item.id" class="relative">
            <div class="group">
              <h4 class="text-base font-semibold text-[#333333] group-hover:text-blue-600">
                <a :href="item.link" target="_blank" class="focus:outline-none">
                  <span class="absolute inset-0" aria-hidden="true" />
                  {{ item.title }}
                </a>
              </h4>
              <p class="mt-2 text-sm text-[#4D4D4D] line-clamp-2" v-html="item.description"></p>
              <div class="mt-2">
                <time class="text-xs text-[#4D4D4D]">
                  {{ new Date(item.pubDate).toLocaleString('zh-CN') }}
                </time>
              </div>
            </div>
          </article>
        </div>
        <div v-else class="text-center py-8">
          <p class="text-[#4D4D4D]">暂无内容</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { RssIcon, FileXIcon } from 'lucide-vue-next'
import type { RssSource, RssItem } from '../types/rss'
import { Button, Badge, Card, CardHeader, Skeleton } from '@/components/ui'
import Toast from './Toast.vue'

const props = defineProps<{
  source: RssSource
}>()

const loading = ref(true)
const items = ref<RssItem[]>([])
const toastRef = ref<InstanceType<typeof Toast>>()

const typeMap = {
  news: '新闻',
  community: '社群',
  finance: '金融',
  tech: '科技',
  programming: '技术',
  blog: '博客'
}

const emit = defineEmits<{
  (e: 'subscribe', source: RssSource): void
}>()

const handleSubscribe = () => {
  props.source.isSubscribed = !props.source.isSubscribed
  emit('subscribe', props.source)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const getBadgeVariant = (type: string) => {
  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    news: 'default',
    community: 'secondary',
    finance: 'outline',
    tech: 'default',
    programming: 'destructive',
    blog: 'secondary'
  }
  return variantMap[type] || 'default'
}

onMounted(async () => {
  try {
    loading.value = true
    
    // 使用代理服务
    const proxyUrls = [
      (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      (url: string) => `https://cors.eu.org/${url}`,
      (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ]

    for (const getProxyUrl of proxyUrls) {
      try {
        const proxyUrl = getProxyUrl(props.source.url)
        const response = await axios.get(proxyUrl, {
          timeout: 10000,
          headers: {
            'Accept': 'application/xml, text/xml, application/rss+xml, application/atom+xml'
          }
        })
        
        if (typeof response.data === 'string') {
          const parser = new DOMParser()
          const xml = parser.parseFromString(response.data, 'text/xml')
          
          // 检查是否为有效的 XML
          if (xml.getElementsByTagName('parsererror').length > 0) continue

          // 解析 RSS 2.0
          const rssItems = xml.getElementsByTagName('item')
          if (rssItems.length > 0) {
            items.value = Array.from(rssItems).map(item => ({
              id: item.getElementsByTagName('guid')[0]?.textContent || '',
              title: item.getElementsByTagName('title')[0]?.textContent || '',
              description: item.getElementsByTagName('description')[0]?.textContent || '',
              link: item.getElementsByTagName('link')[0]?.textContent || '',
              pubDate: item.getElementsByTagName('pubDate')[0]?.textContent || ''
            }))
            break
          }

          // 解析 Atom
          const atomItems = xml.getElementsByTagName('entry')
          if (atomItems.length > 0) {
            items.value = Array.from(atomItems).map(item => ({
              id: item.getElementsByTagName('id')[0]?.textContent || '',
              title: item.getElementsByTagName('title')[0]?.textContent || '',
              description: item.getElementsByTagName('content')[0]?.textContent || '',
              link: item.getElementsByTagName('link')[0]?.getAttribute('href') || '',
              pubDate: item.getElementsByTagName('updated')[0]?.textContent || ''
            }))
            break
          }
        }
      } catch (error) {
        console.error('代理访问失败:', error)
        continue
      }
    }
  } catch (error) {
    console.error('获取 RSS 内容失败:', error)
    toastRef.value?.toast('获取内容失败', 'error')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 