import { createRouter, createWebHistory } from 'vue-router';
import { useNavbarStore } from '@/store/navbar.js';
import { useGlobalStore } from '@/store/global.js';
import { useSidebarStore } from '@/store/sidebar.js';
import brandConfigs from '@/assets/brand-information/index.js'
import emitter from '@/helpers/emitter.js';

const transitionDelay = 500;
const allowedSelectedBrands = ['Okto', 'HAA']
// const allowedLines = {
//   'Okto' : [
//     'Monoflorals',
//     'Multiflorals'
//   ],
//   'HAA': [
//     'Monoflorals',
//     'Blends'
//   ]
// }
const allowedLines = ['Blends', 'Monoflorals', 'Multiflorals']

// lazy load views
const lazyLoad = (view) => () => import(`@/views/${view}.vue`)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: lazyLoad('Home'),
      meta: { 
        hasNavbar: true, 
        playAnimationOnEnter: false,
        navbarColor: {
          mobile: 'black',
          desktop: 'black',
        }
      }
    },
    {
      path: '/history',
      name: 'History',
      component: lazyLoad('History'),
      meta: { 
        hasNavbar: true, 
        navbarFloating: true, 
        playAnimationOnEnter: true,
        navbarColor: {
          mobile: 'white',
          desktop: 'white',
        } 
      }
    },
    {
      path: '/products',
      name: 'Tabs',
      component: lazyLoad('Tabs'),
      meta: { 
        hasNavbar: false, 
        playAnimationOnEnter: true 
      }
    },
    {
      path: '/product',
      redirect: '/product/Okto?line="Monoflorals"'
    },
    {
      path: '/product/:selectedBrand',
      name: 'Product',
      component: lazyLoad('ProductPage'),
      meta: { 
        hasNavbar: true, 
        playAnimationOnEnter: true,
        navbarColor: {
          mobile: 'black',
          desktop: 'black',
        }
      },
      props: (route) => ({
        selectedBrand: route.params.selectedBrand,
        selectedLine: route.query.line
      })
    },
    {
      path: '/all-products',
      name: 'AllProducts',
      component: lazyLoad('AllProducts'),
      meta: { 
        hasNavbar: true, 
        playAnimationOnEnter: true,
        navbarColor: {
          mobile: 'black',
          desktop: 'black',
        }
      }
    },
    {
      path: '/about-us',
      name: 'About',
      component: lazyLoad('About'),
      meta: { 
        hasNavbar: true, 
        playAnimationOnEnter: true,
        navbarColor: {
          mobile: 'black',
          desktop: 'black',
        } 
      }
    },
    // {
    //   path: '/test',
    //   name: 'Test',
    //   component: lazyLoad('Test'),
    //   meta: { 
    //     hasNavbar: false, 
    //     playAnimationOnEnter: true,
    //     navbarColor: {
    //       mobile: 'black',
    //       desktop: 'black',
    //     }
    //   }
    // },
  ]
})

function processRouteTransition(to, next) {
  // console.log("Going to ROUTER", to.name, to.params, to.query);

  // Set default query if not already set
  if (!to.query.line) {
    to.query.line = 'Monoflorals';
  }

  // Check if the line query is allowed
  if (!allowedLines.includes(to.query.line)) {
    next({ name: to.name, params: to.params, query: { ...to.query, line: 'Monoflorals' } });
    return;
  }

  // Check for unregistered routes
  if (to.matched.length === 0) {
    next({ name: 'Home' });
  } else if (to.name === 'Product' && to.params.selectedBrand) {
    // Ensure selectedBrand is allowed
    if (!allowedSelectedBrands.includes(to.params.selectedBrand)) {
      next({ name: 'Product', params: { selectedBrand: 'Okto' }, query: to.query });
    } else {
      next();
    }
  } else {
    next();
  }
}

router.beforeEach((to, from, next) => {
  emitter.emit('toggleSidebarRoute') //for burger menu icon

  // console.log("Routing to: ", to)
  const navbarStore = useNavbarStore();
  const globalStore = useGlobalStore();
  const sidebarStore = useSidebarStore();

  if (to.meta.hasNavbar) {
    navbarStore.changeNavbarStatus(true);
    if (to.meta.navbarFloating){ // enable floating navbar
      navbarStore.changeNavbarFloating(true)
    } else {
      navbarStore.changeNavbarFloating(false)
    }
    navbarStore.setNavbarColor(to.meta.navbarColor) //set navbar color for route
  } else {
    navbarStore.changeNavbarStatus(false);
  }

  sidebarStore.setSidebarStatus(false)

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
