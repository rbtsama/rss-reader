import { createRouter, createWebHistory } from 'vue-router'
import RssHome from '../views/RssHome.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: RssHome
    }
  ]
})

export default router 