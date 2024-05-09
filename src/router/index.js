import { createRouter, createWebHistory } from 'vue-router';
import { useNavbarStore } from '@/store/navbar.js';
import { useGlobalStore } from '@/store/global.js';
import Home from '@/views/Home.vue';
import Tabs from '@/views/Tabs.vue';
import ProductPage from '@/views/ProductPage.vue';

const transitionDelay = 500; // Page transition delay to ensure animations plays out before transitioning.
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
      meta: {
        hasNavbar: true, 
        playAnimationOnEnter: false
      }
    },
    {
      path: '/products',
      name: 'Tabs',
      component: Tabs,
      meta: {
        hasNavbar: false, 
        playAnimationOnEnter: true
      }
    },
    {
      path: '/product',
      name: 'Product',
      component: ProductPage,
      meta: {
        hasNavbar: true, 
        playAnimationOnEnter: false
      }
    },
  ]
})


router.beforeEach((to, from, next) => {
  console.log('trying to go to', to)
  try{
    const navbarStore = useNavbarStore()
    const globalStore = useGlobalStore()
    // console.log('to', to)
    // console.log("from", from);
    if (to.matched.length === 0) next ({'name': 'Home'})
    if(to.meta.hasNavbar){
      navbarStore.changeNavbarStatus(true)
    } else {
      navbarStore.changeNavbarStatus(false)
    }
    if(to.meta.playAnimationOnEnter){
      globalStore.changeAnimationFlag(true)
      setTimeout(()=>{
        next()
      }, transitionDelay)
    } else {
      globalStore.changeAnimationFlag(false)
      next()
    }
  } catch (e) {
    console.error(e)
    next()
  }
})
export default router
