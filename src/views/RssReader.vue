<template>
  <Toast ref="toastRef" />
  <div class="space-y-6">
    <!-- 头部操作区 -->
    <div class="flex items-center justify-between bg-card rounded-lg p-4 shadow-sm border border-border/40">
      <div class="flex items-center space-x-4">
        <h2 class="text-lg font-semibold tracking-tight">我的订阅</h2>
        <span class="text-sm text-[#4D4D4D]">
          {{ lastUpdateTime ? `上次更新: ${formatLastUpdateTime}` : '尚未更新' }}
        </span>
      </div>
      <div class="flex items-center space-x-4">
        <Button
          v-if="readArticles.size > 0"
          variant="outline"
          size="sm"
          class="border-red-200 hover:bg-red-50 text-red-700"
          @click="readArticles.clear(); localStorage.setItem('read_articles', '[]')"
        >
          <TrashIcon class="h-4 w-4 mr-2" />
          清除已读
        </Button>
        <Button
          variant="default"
          size="sm"
          @click="refreshAll"
          :disabled="isRefreshing"
          class="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <ArrowPathIcon v-if="isRefreshing" class="h-4 w-4 animate-spin mr-2" />
          <ArrowPathIcon v-else class="h-4 w-4 mr-2" />
          {{ isRefreshing ? '刷新中...' : '刷新全部' }}
        </Button>
      </div>
    </div>

    <!-- 订阅源列表 -->
    <div v-if="subscribedSources.length > 0" class="grid grid-cols-3 gap-6">
      <div v-for="source in subscribedSources" :key="source.id">
        <Card class="p-6 hover:shadow-lg transition-shadow duration-200 border-border/40">
          <CardHeader class="p-0 mb-4">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-semibold text-[#333333] tracking-tight">{{ source.name }}</h3>
              <Badge :class="typeMap[source.type as keyof typeof typeMap]?.color || 'bg-gray-100 text-gray-700'" class="text-xs">
                {{ typeMap[source.type as keyof typeof typeMap]?.label || source.type }}
              </Badge>
            </div>
          </CardHeader>
          <div class="space-y-3">
            <div 
              v-for="item in sourceItems[source.id]" 
              :key="item.id"
              class="text-sm cursor-pointer transition-colors duration-200 line-clamp-1 font-normal"
              :class="[
                readArticles.has(item.id) ? 'text-[#808080]' : 'text-[#4D4D4D] hover:text-primary',
              ]"
              @click="handleReadArticle(item)"
            >
              {{ item.title }}
            </div>
          </div>
        </Card>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <div class="mx-auto h-12 w-12 text-[#4D4D4D]">
        <RssIcon class="h-12 w-12" aria-hidden="true" />
      </div>
      <h3 class="mt-2 text-sm font-semibold text-[#333333]">暂无订阅</h3>
      <p class="mt-1 text-sm text-[#4D4D4D]">请前往订阅管理添加 RSS 源</p>
    </div>
  </div>

  <!-- 文章阅读模态框 -->
  <TransitionRoot appear :show="showArticle" as="template">
    <Dialog as="div" @close="showArticle = false" class="relative z-10">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-25" />
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
            <DialogPanel class="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-semibold text-[#333333]">
                  {{ currentArticle?.title }}
                </h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  @click="showArticle = false"
                >
                  <XMarkIcon class="h-5 w-5" />
                </Button>
              </div>
              <div v-if="currentArticle" class="article-content overflow-y-auto max-h-[70vh]">
                <div class="prose prose-sm max-w-none" v-html="currentArticle.description"></div>
                <div class="mt-6 flex justify-between items-center">
                  <time class="text-sm text-[#4D4D4D]">
                    {{ new Date(currentArticle.pubDate).toLocaleString('zh-CN') }}
                  </time>
                  <a
                    :href="currentArticle.link"
                    target="_blank"
                    class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    阅读原文
                    <ArrowTopRightOnSquareIcon class="ml-1 h-4 w-4" />
                  </a>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { 
  ArrowPathIcon, 
  RssIcon, 
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import type { RssSource, RssItem } from '../types/rss'
import { storage } from '../services/storage'
import Toast from '../components/Toast.vue'
import { Badge, Button } from '@/components/ui'
import { Card, CardHeader } from '@/components/ui'

const subscribedSources = ref<RssSource[]>([])
const sourceItems = ref<Record<string, RssItem[]>>({})
const loading = ref<Record<string, boolean>>({})
const showArticle = ref(false)
const currentArticle = ref<RssItem | null>(null)
const lastUpdateTime = ref<number>(Number(localStorage.getItem('last_update_time')) || 0)
const isRefreshing = ref(false)
const toastRef = ref<InstanceType<typeof Toast>>()
const readArticles = ref<Set<string>>(new Set(JSON.parse(localStorage.getItem('read_articles') || '[]')))

const typeMap = {
  news: { label: '新闻', color: 'bg-blue-100 text-blue-700' },
  community: { label: '社群', color: 'bg-green-100 text-green-700' },
  finance: { label: '金融', color: 'bg-yellow-100 text-yellow-700' },
  tech: { label: '科技', color: 'bg-purple-100 text-purple-700' },
  programming: { label: '技术', color: 'bg-red-100 text-red-700' },
  blog: { label: '博客', color: 'bg-slate-100 text-slate-700' }
}

const getTagClass = (type: string) => {
  const typeClassMap: Record<string, string> = {
    news: 'bg-blue-100 text-blue-800',
    community: 'bg-green-100 text-green-800',
    finance: 'bg-yellow-100 text-yellow-800',
    tech: 'bg-purple-100 text-purple-800',
    programming: 'bg-red-100 text-red-800',
    blog: 'bg-gray-100 text-gray-800'
  }
  return typeClassMap[type] || 'bg-gray-100 text-gray-800'
}

const formatLastUpdateTime = computed(() => {
  if (!lastUpdateTime.value) return ''
  return new Date(lastUpdateTime.value).toLocaleString('zh-CN')
})

const shouldRefresh = () => {
  const threeHours = 3 * 60 * 60 * 1000 // 3小时的毫秒数
  return !lastUpdateTime.value || (Date.now() - lastUpdateTime.value) > threeHours
}

const fetchSourceItems = async (source: RssSource) => {
  loading.value[source.id] = true
  
  // 使用代理服务
  const proxyUrls = [
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://cors.eu.org/${url}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ]

  for (const getProxyUrl of proxyUrls) {
    try {
      const proxyUrl = getProxyUrl(source.url)
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
        if (xml.getElementsByTagName('parsererror').length > 0) {
          console.warn('XML 解析错误，尝试下一个代理')
          continue
        }

        // 解析 RSS 2.0
        const rssItems = xml.getElementsByTagName('item')
        if (rssItems.length > 0) {
          sourceItems.value[source.id] = Array.from(rssItems)
            .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
            .slice(0, 10)  // 只取最新的10条
            .map(item => ({
              id: item.getElementsByTagName('guid')[0]?.textContent || Date.now().toString(),
              title: item.getElementsByTagName('title')[0]?.textContent || '无标题',
              description: cleanDescription(item.getElementsByTagName('description')[0]?.textContent || ''),
              link: item.getElementsByTagName('link')[0]?.textContent || '',
              pubDate: item.getElementsByTagName('pubDate')[0]?.textContent || 
                       item.getElementsByTagName('date')[0]?.textContent ||
                       new Date().toISOString(),
              sourceId: source.id
            }))
          break
        }

        // 解析 Atom
        const atomItems = xml.getElementsByTagName('entry')
        if (atomItems.length > 0) {
          sourceItems.value[source.id] = Array.from(atomItems)
            .sort((a, b) => {
              const dateA = new Date(a.getElementsByTagName('updated')[0]?.textContent || '').getTime()
              const dateB = new Date(b.getElementsByTagName('updated')[0]?.textContent || '').getTime()
              return dateB - dateA
            })
            .slice(0, 10)  // 只取最新的10条
            .map(item => ({
              id: item.getElementsByTagName('id')[0]?.textContent || Date.now().toString(),
              title: item.getElementsByTagName('title')[0]?.textContent || '无标题',
              description: cleanDescription(item.getElementsByTagName('content')[0]?.textContent || 
                          item.getElementsByTagName('summary')[0]?.textContent || ''),
              link: item.getElementsByTagName('link')[0]?.getAttribute('href') || '',
              pubDate: item.getElementsByTagName('updated')[0]?.textContent || 
                      item.getElementsByTagName('published')[0]?.textContent || 
                      item.getElementsByTagName('date')[0]?.textContent ||
                      new Date().toISOString(),
              sourceId: source.id
            }))
          break
        }
      }
    } catch (error) {
      console.error(`代理 ${getProxyUrl(source.url)} 访问失败:`, error)
      continue
    }
  }

  if (!sourceItems.value[source.id]) {
    toastRef.value?.toast(`获取 ${source.name} 的内容失败`, 'error')
  }
  loading.value[source.id] = false
}

const cleanDescription = (description: string): string => {
  if (!description) return ''
  // 处理 CDATA
  description = description.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
  // 清理不安全的标签和属性
  const div = document.createElement('div')
  div.innerHTML = description
  const scripts = div.getElementsByTagName('script')
  const styles = div.getElementsByTagName('style')
  const iframes = div.getElementsByTagName('iframe')
  while (scripts.length > 0) scripts[0].remove()
  while (styles.length > 0) styles[0].remove()
  while (iframes.length > 0) iframes[0].remove()
  return div.innerHTML
}

const refreshAll = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  try {
    for (const source of subscribedSources.value) {
      await fetchSourceItems(source)
    }
    lastUpdateTime.value = Date.now()
    localStorage.setItem('last_update_time', lastUpdateTime.value.toString())
    localStorage.setItem('cached_items', JSON.stringify(sourceItems.value))
    toastRef.value?.toast('刷新成功', 'success')
  } catch (error) {
    console.error('刷新失败:', error)
    toastRef.value?.toast('刷新失败', 'error')
  } finally {
    isRefreshing.value = false
  }
}

const handleUnsubscribe = (source: RssSource) => {
  source.isSubscribed = false
  storage.updateRssSource(source)
  const index = subscribedSources.value.findIndex(s => s.id === source.id)
  if (index > -1) {
    subscribedSources.value.splice(index, 1)
  }
  toastRef.value?.toast('已取消订阅', 'success')
}

const handleReadArticle = (item: RssItem) => {
  currentArticle.value = item
  showArticle.value = true
  markAsRead(item.id)
}

const markAsRead = (itemId: string) => {
  readArticles.value.add(itemId)
  localStorage.setItem('read_articles', JSON.stringify([...readArticles.value]))
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
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 