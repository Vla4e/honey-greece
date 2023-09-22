import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import ProductTabs from '@/views/ProductTabs.vue'
import TabList from '@/views/TabList.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/products',
      name: 'ProductTabs',
      component: ProductTabs
    },
    {
      path: '/tabs',
      name: 'Tabs',
      component: TabList
    }
  ]
})

export default router
