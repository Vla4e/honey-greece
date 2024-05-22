import { createRouter, createWebHistory } from 'vue-router';
import { useNavbarStore } from '@/store/navbar.js';
import { useGlobalStore } from '@/store/global.js';
import Home from '@/views/Home.vue';
import Tabs from '@/views/Tabs.vue';
import ProductPage from '@/views/ProductPage.vue';

const transitionDelay = 500; // Page transition delay to ensure animations plays out before transitioning.
const allowedSelectedBrands = ['Okto', 'HAA', 'Melculum']
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
      redirect: '/product/Okto'
    },
    {
      path: '/product/:selectedBrand',
      name: 'Product',
      component: ProductPage,
      meta: {
        hasNavbar: true, 
        playAnimationOnEnter: true
      },
      props: (route) => ({
        selectedBrand: route.params.selectedBrand,
        selectedLine: route.query.line // You can also derive this value dynamically if needed
      })
    },
  ]
})

function processRouteTransition(to, next) {
  console.log("PARAMS", to.params, to.query)
  if (to.matched.length === 0) {
    next({ name: 'Home' });
  } else if (to.name === 'Product' && to.params.selectedBrand) {
    if (!allowedSelectedBrands.includes(to.params.selectedBrand)) {
      next({ name: 'Product', params: { selectedBrand: 'Okto' } });
    } else {
      next();
    }
  } else {
    next();
  }
}

router.beforeEach((to, from, next) => {
  const navbarStore = useNavbarStore();
  const globalStore = useGlobalStore();

  if (to.meta.hasNavbar) {
    navbarStore.changeNavbarStatus(true);
  } else {
    navbarStore.changeNavbarStatus(false);
  }

  if (to.meta.playAnimationOnEnter) {
    globalStore.changeAnimationFlag(true);
    setTimeout(() => {
      processRouteTransition(to, next);
    }, transitionDelay);
  } else {
    globalStore.changeAnimationFlag(false);
    processRouteTransition(to, next);
  }
});

export default router
