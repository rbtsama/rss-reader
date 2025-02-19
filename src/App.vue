<template>
  <n-config-provider :theme="theme">
    <n-message-provider>
      <n-layout>
        <n-layout-header bordered>
          <n-menu mode="horizontal" :value="activeKey" @update:value="handleMenuUpdate">
            <n-menu-item key="manager">订阅管理</n-menu-item>
            <n-menu-item key="reader">阅读器</n-menu-item>
          </n-menu>
        </n-layout-header>
        <n-layout-content>
          <router-view />
        </n-layout-content>
      </n-layout>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { darkTheme, NConfigProvider, NMessageProvider, NLayout, NLayoutHeader, 
         NLayoutContent, NMenu, NMenuItem } from 'naive-ui'

const router = useRouter()
const activeKey = ref('manager')

const handleMenuUpdate = (key: string) => {
  activeKey.value = key
  router.push(`/${key}`)
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
}

#app {
  min-height: 100vh;
}

.n-layout-content {
  padding: 24px;
}

@media (max-width: 768px) {
  .n-layout-content {
    padding: 12px;
  }
}
</style> 