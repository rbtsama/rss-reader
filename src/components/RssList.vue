<template>
  <div class="relative">
    <Table class="border rounded-lg overflow-hidden">
      <TableHeader>
        <TableRow class="bg-muted/50">
          <TableHead>名称</TableHead>
          <TableHead>类型</TableHead>
          <TableHead>URL</TableHead>
          <TableHead class="text-right">
            <div class="flex justify-end">操作</div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow 
          v-for="source in sources" 
          :key="source.id"
          class="hover:bg-muted/30 transition-colors duration-200"
        >
          <TableCell class="font-medium">
            {{ source.name }}
          </TableCell>
          <TableCell>
            <Badge :variant="getBadgeVariant(source.type)">
              {{ typeMap[source.type as keyof typeof typeMap] || source.type }}
            </Badge>
          </TableCell>
          <TableCell class="max-w-[200px] truncate">
            {{ source.url }}
          </TableCell>
          <TableCell>
            <div class="flex justify-end gap-2 items-center">
              <Button variant="ghost" size="sm" @click="$emit('preview', source)">
                <EyeIcon class="h-4 w-4 mr-1" />
                预览
              </Button>
              <Button variant="ghost" size="sm" @click="$emit('edit', source)">
                <PencilIcon class="h-4 w-4 mr-1" />
                编辑
              </Button>
              <Button variant="ghost" size="sm" @click="$emit('delete', source)">
                <Trash2Icon class="h-4 w-4 mr-1" />
                删除
              </Button>
              <Button 
                :variant="source.isSubscribed ? 'ghost' : 'default'"
                size="sm" 
                @click="$emit('subscribe', source)"
                :class="source.isSubscribed ? 'text-muted-foreground' : 'bg-green-600 hover:bg-green-700'"
              >
                <RssIcon class="h-4 w-4 mr-1" />
                {{ source.isSubscribed ? '取消订阅' : '订阅' }}
              </Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>

<script setup lang="ts">
import { EyeIcon, PencilIcon, RssIcon, Trash2Icon } from 'lucide-vue-next'
import type { RssSource } from '../types/rss'
import { 
  Button, 
  Badge,
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui'

defineProps<{
  sources: RssSource[]
}>()

defineEmits<{
  (e: 'preview', source: RssSource): void
  (e: 'edit', source: RssSource): void
  (e: 'delete', source: RssSource): void
  (e: 'subscribe', source: RssSource): void
}>()

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

const typeMap = {
  news: '新闻',
  community: '社群',
  finance: '金融',
  tech: '科技',
  programming: '技术',
  blog: '博客'
}
</script> 