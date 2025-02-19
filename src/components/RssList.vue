<template>
  <n-data-table
    :columns="columns"
    :data="sources"
    :pagination="pagination"
    :bordered="false"
    striped
  />
</template>

<script setup lang="ts">
import { h } from 'vue'
import { 
  NButton, 
  NSpace, 
  NPopconfirm, 
  NDataTable,
  DataTableColumns,
  useMessage 
} from 'naive-ui/lib/components'
import type { RssSource } from '../types/rss'
import { DEFAULT_RSS_CONFIG } from '../types/rss'

const props = defineProps<{
  sources: RssSource[]
}>()

const emit = defineEmits<{
  (e: 'preview', source: RssSource): void
  (e: 'edit', source: RssSource): void
  (e: 'delete', source: RssSource): void
  (e: 'subscribe', source: RssSource): void
}>()

const message = useMessage()

const typeMap = {
  news: '新闻',
  community: '社群',
  finance: '金融',
  tech: '科技',
  programming: '技术',
  blog: '博客'
}

const columns: DataTableColumns<RssSource> = [
  {
    title: '名称',
    key: 'name',
    width: 200
  },
  {
    title: '类型',
    key: 'type',
    width: 100,
    render(row: RssSource) {
      return typeMap[row.type as keyof typeof typeMap] || row.type
    }
  },
  {
    title: 'URL',
    key: 'url',
    width: 300
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(NSpace, null, {
        default: () => [
          h(
            NButton,
            {
              size: 'small',
              onClick: () => emit('preview', row)
            },
            { default: () => '预览' }
          ),
          h(
            NButton,
            {
              size: 'small', 
              onClick: () => emit('edit', row)
            },
            { default: () => '编辑' }
          ),
          h(
            NPopconfirm,
            {
              onPositiveClick: () => emit('delete', row)
            },
            {
              default: () => '确认删除?',
              trigger: () => h(
                NButton,
                {
                  size: 'small',
                  type: 'error'
                },
                { default: () => '删除' }
              )
            }
          )
        ]
      })
    }
  },
  {
    title: '订阅',
    key: 'subscribe',
    width: 100,
    render(row) {
      return h(
        NButton,
        {
          size: 'small',
          type: row.isSubscribed ? 'default' : 'primary',
          onClick: () => emit('subscribe', row)
        },
        { default: () => row.isSubscribed ? '取消订阅' : '订阅' }
      )
    }
  }
]

const pagination = {
  pageSize: 10
}

async function fetchRss(url: string): Promise<Document> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_RSS_CONFIG.timeout);

  try {
    // 处理知乎 RSS URL
    const finalUrl = url.startsWith('@') 
      ? url.substring(1) // 移除 @ 符号
      : url;

    const response = await fetch(finalUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'Mozilla/5.0 (compatible; RSSReader/1.0)'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    if (text.length > DEFAULT_RSS_CONFIG.maxContentLength) {
      throw new Error('RSS content too large');
    }

    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    
    if (xml.getElementsByTagName('parsererror').length > 0) {
      throw new Error('Invalid RSS format');
    }

    return xml;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('请求超时,请稍后重试');
    }
    throw error;
  }
}
</script>

<style scoped>
.n-data-table {
  max-width: 100%;
  overflow-x: auto;
}
</style> 