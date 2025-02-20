<template>
  <div class="h-full flex flex-col">
    <!-- 头部 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <h2 class="text-2xl font-semibold tracking-tight">{{ source.name }}</h2>
        <Badge :variant="getBadgeVariant(source.type)">
          {{ typeMap[source.type as keyof typeof typeMap] || source.type }}
        </Badge>
      </div>
      <Button
        @click="handleSubscribe"
        :variant="source.isSubscribed ? 'secondary' : 'default'"
        size="sm"
      >
        <RssIcon class="h-4 w-4 mr-2" />
        {{ source.isSubscribed ? '取消订阅' : '订阅' }}
      </Button>
    </div>

    <!-- 内容区 -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="space-y-2">
          <Skeleton class="h-5 w-2/3" />
          <Skeleton class="h-20" />
          <Skeleton class="h-4 w-24" />
        </div>
      </div>

      <div v-else-if="items.length > 0" class="space-y-8">
        <article v-for="item in items" :key="item.id" class="relative">
          <Card>
            <CardHeader>
              <h3 class="text-lg font-semibold">
                <a 
                  :href="item.link" 
                  target="_blank"
                  class="hover:underline"
                >
                  {{ item.title }}
                </a>
              </h3>
              <time class="text-sm text-muted-foreground">
                {{ formatDate(item.pubDate) }}
              </time>
            </CardHeader>
            <div class="p-6">
              <div 
                class="prose prose-sm max-w-none dark:prose-invert" 
                v-html="item.description"
              />
            </div>
          </Card>
        </article>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-12">
        <div class="text-muted-foreground">
          <FileXIcon class="h-12 w-12" />
        </div>
        <h3 class="mt-4 text-lg font-semibold">暂无内容</h3>
        <p class="text-sm text-muted-foreground">
          该 RSS 源暂时没有任何文章
        </p>
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