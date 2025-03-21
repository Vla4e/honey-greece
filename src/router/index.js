import { createRouter, createWebHistory } from 'vue-router';
import { useNavbarStore } from '@/store/navbar.js';
import { useGlobalStore } from '@/store/global.js';
import { useSidebarStore } from '@/store/sidebar.js';
import emitter from '@/helpers/emitter.js';

import brandConfigs from '../assets/brand-information';
import { isHoneyAllowed } from '@/helpers/dataOperations.js'


const allowedSelectedBrands = ['Okto', 'HAA']
const allowedLines = {
  'Okto': [
    'Monoflorals',
    // 'Multiflorals' not produced atm
  ],
  'HAA' : [
    'Blends',
    // 'Monoflorals' not produced atm
  ]
}

const transitionDelay = 500;

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
    {
      path: '/test',
      name: 'Test',
      component: lazyLoad('Test'),
      meta: { 
        hasNavbar: false, 
        playAnimationOnEnter: true,
        navbarColor: {
          mobile: 'black',
          desktop: 'black',
        }
      }
    },
    {
      path: '/JarTest',
      name: 'JarTest',
      component: lazyLoad('JarTestView'),
      meta: { 
        hasNavbar: false, 
        playAnimationOnEnter: true,
        navbarColor: {
          mobile: 'black',
          desktop: 'black',
        }
      }
    },
  ]
})

async function processRouteTransition(to, next) {
  console.log("Processing Route transition", to.name, to.params, to.query);
  try{
    if (!to.matched.length) {
      return next({ name: 'Home' });
    }
    
    if (to.name === 'Product') {
      let selectedBrand = to.params.selectedBrand
      if (selectedBrand && !allowedSelectedBrands.includes(selectedBrand)) {
        return next({
          name: 'Product',
          params: { selectedBrand: 'Okto' },
          query: allowedLines['Okto'][0],
        });
      }
  
      if (!to.query.line) {
        to.query.line = allowedLines[selectedBrand][0];
      }
  
      // 2. Validate the "line" query
      if (allowedLines[selectedBrand].includes(to.query.line)) {
        if (to.query.honey) {
          // Check if honey is valid for the selectedBrand + line
          const validHoney = await isHoneyAllowed(selectedBrand, to.query.line, to.query.honey);
          if (validHoney) {
            return next();
          } else {
            // If honey not valid, redirect to default line + default honey
            let defaultHoney = brandConfigs[selectedBrand].lineFlavorsArrays[to.query.line][0]
            return next({
              name: to.name,
              params: to.params,
              query: { 
                ...to.query,
                line: to.query.line,
                honey: defaultHoney // default to honey
              },
            });
          }
        } else {
          // If honey not valid, redirect to default line + default honey
          let defaultHoney = brandConfigs[selectedBrand].lineFlavorsArrays[to.query.line][0]
          return next({
            name: to.name,
            params: to.params,
            query: { 
              ...to.query,
              line: to.query.line,
              honey: defaultHoney // default to honey
            },
          });
        }
      } else {
        return next({
          name: 'Home'
        })
      }
    }
    next();
  } catch (error){
    next({name: 'Home'});
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
    setTimeout(async () => {
      processRouteTransition(to, next);
    }, transitionDelay);
  } else {
    globalStore.changeAnimationFlag(false);
    processRouteTransition(to, next);
  }
});

export default router
