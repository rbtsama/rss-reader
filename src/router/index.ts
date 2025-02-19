import { createRouter, createWebHistory } from 'vue-router'
import RssManager from '../views/RssManager.vue'
import RssReader from '../views/RssReader.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/manager'
    },
    {
      path: '/manager',
      component: RssManager
    },
    {
      path: '/reader',
      component: RssReader
    }
  ]
})

export default router 