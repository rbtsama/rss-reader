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
          <TableCell class="font-medium text-[#4D4D4D]">
            {{ source.name }}
          </TableCell>
          <TableCell>
            <Badge :class="typeMap[source.type as keyof typeof typeMap]?.color || 'bg-gray-100 text-gray-700'">
              {{ typeMap[source.type as keyof typeof typeMap]?.label || source.type }}
            </Badge>
          </TableCell>
          <TableCell class="max-w-[200px] truncate text-[#4D4D4D]">
            {{ source.url }}
          </TableCell>
          <TableCell>
            <div class="flex justify-end gap-2 items-center text-[#4D4D4D]">
              <Button variant="ghost" size="sm" @click="$emit('preview', source)">
                <EyeIcon class="h-4 w-4 mr-1" />
                预览
              </Button>
              <Button variant="ghost" size="sm" @click="$emit('edit', source)">
                <PencilIcon class="h-4 w-4 mr-1" />
                编辑
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2Icon class="h-4 w-4 mr-1" />
                    删除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除</AlertDialogTitle>
                    <AlertDialogDescription>
                      确认删除吗？
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction @click="$emit('delete', source)">
                      确认
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
  TableRow,
} from '@/components/ui'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

defineProps<{
  sources: RssSource[]
}>()

defineEmits<{
  (e: 'preview', source: RssSource): void
  (e: 'edit', source: RssSource): void
  (e: 'delete', source: RssSource): void
  (e: 'subscribe', source: RssSource): void
}>()

const typeMap = {
  news: { label: '新闻', color: 'bg-blue-100 text-blue-700' },
  community: { label: '社群', color: 'bg-green-100 text-green-700' },
  finance: { label: '金融', color: 'bg-yellow-100 text-yellow-700' },
  tech: { label: '科技', color: 'bg-purple-100 text-purple-700' },
  programming: { label: '技术', color: 'bg-red-100 text-red-700' },
  blog: { label: '博客', color: 'bg-slate-100 text-slate-700' }
}
</script> 