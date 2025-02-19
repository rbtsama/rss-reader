<template>
  <n-config-provider>
    <n-message-provider>
      <n-layout>
        <n-layout-content>
          <router-view />
        </n-layout-content>
      </n-layout>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { 
  NConfigProvider, 
  NMessageProvider, 
  NLayout, 
  NLayoutContent 
} from 'naive-ui'
</script>

<style>
body {
  margin: 0;
  padding: 0;
}

#app {
  min-height: 100vh;
}
</style> 