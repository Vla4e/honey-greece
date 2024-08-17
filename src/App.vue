<template>
  <div class="app-container" :class="`app-container-${route.name}`" :style="hideOverflow ? 'overflow: hidden': ''">
    <!-- <div v-if="!showContactForm && !isMobile" class="burger-icon-container">
      <BurgerMenuIcon @click="toggleSidebar" class="burger-icon"/>
    </div> -->
    <LoadingScreen></LoadingScreen>
    <NavbarComponent v-show="showNavbarComputed" id="nav"/>

    <Transition name="sidebar">
      <Sidebar v-if="showSidebar"/>
    </Transition>
    <Transition name="contact-form">
      <ContactForm v-if="showContactForm"/>
    </Transition>
    <PageTransition></PageTransition>
    <RouterView :key="routerViewKey" class="page-container"/>
    <!-- REMOVE KEY when setCanvas has been fixed,
    added to force rerender of components with same route/diff subroute -->
  </div>
</template>

<script>
import { provide, inject, ref, computed, watch, onMounted, onUnmounted, toRaw } from 'vue';

import { useNavbarStore } from '@/store/navbar.js'
import { useGlobalStore } from '@/store/global.js'
import { useSidebarStore } from '@/store/sidebar.js'
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';


import { useScreenSize } from './composables/useScreenSize'

import burgerIcon from '@/assets/images/burger-icon.svg'

export default {
  setup(){
    const { isMobile, isTablet, isDesktop } = useScreenSize()
    provide('screenSize', { isMobile, isTablet, isDesktop })
    let route = useRoute()
    // const routerViewKey = computed(() => {
    //   // Only update the key when navigating between subroutes of `/product`
    //   console.log("VIEWKEY CHANGED", route.path)
    //   if (route.path.startsWith('/product')) {
    //     return route.fullPath; // Full path includes query parameters and hash
    //   }
    //   return route.path; // Use the basic path for other routes to prevent unnecessary updates
    // });
    const routerViewKey = computed(() => {
      if (route.path.startsWith('/product')) {
        // Only include the path and query parameters, not the hash
        return route.path;
      }
      return route.name; // Use the route name for other routes
    });
    // console.log("CURRENT ROUTE => ", toRaw(route))
    let globalStore = useGlobalStore()
    let { playAnimationOnEnter } = storeToRefs(globalStore)
    let hideOverflow = ref(false)
    watch(playAnimationOnEnter, () => {
      if(playAnimationOnEnter.value){
        hideOverflow.value = true;
      } else {
        hideOverflow.value = false
      }
    })

    let navbarStore = useNavbarStore()
    let { showNavbar } = storeToRefs(navbarStore)
    let showNavbarComputed = computed(() => {
      if(isMobile.value){
        return true
      } else return showNavbar.value
    })


    let emitter = inject('emitter')
    const sidebarStore = useSidebarStore()
    let showSidebar = computed(() => sidebarStore.getSidebarStatus);
    let showContactForm = ref(false);
    
    //SIDEBAR
    // function toggleSidebar(){
    //   showSidebar.value = !showSidebar.value
    // }
    onMounted(()=>{
      emitter.on('toggleContactForm', ()=>{
        showContactForm.value = !showContactForm.value
      })
      // emitter.on('toggleSidebarRoute', ()=>{
      //   if(showSidebar.value){
      //     toggleSidebar();
      //   }
      // })
      // emitter.on('toggleSidebar', ()=>{
      //   toggleSidebar();
      // })

      
      // // console.log("ISMOBILE", isMobile.value)
      // if(isMobile.value){
      //   // console.log("setting shownav", showNavbar.value)
      //   showNavbar.value = true
      // }
    })
    onUnmounted(()=> {
      emitter.off('toggleContactForm')
      // emitter.off('toggleSidebarRoute')
      // emitter.off('toggleSidebar')
    })
    return {
      showSidebar, 
      // toggleSidebar,
      showNavbarComputed,
      showContactForm, 
      showNavbar, 
      burgerIcon, 
      isMobile, 
      hideOverflow,
      route,
      routerViewKey
    }
  }
}
</script>
<style lang="scss" scoped>
.app-container{
  // overflow: hidden;
  min-height: 100vh;
  @media(min-width: 1024px){
    height: 100vh;
  }
  @media(max-width: 768px){
    
    &-Tabs{
      height: 100vh;
    }
  }
  width: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  position: relative;
  /* background: url('@/assets/pages/home/background.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center; */
}
.page-container{
  max-width: 90%;
  margin: auto;
  flex-grow: 1;
  z-index: 3;
  @media(max-width: 767px){
    max-width: 100%;
    margin: 0;
  }
}
#nav, #footer{
  z-index: 10;
}
.burger-icon-container{
  display: flex;
  justify-content: flex-start;
  align-items: center;
  z-index: 20;
  :hover{
    // transform: scale(1.1);
    // transition: scale ease 0.3s;
  }
  .burger-icon{
    position: absolute;
    top: 2%;
    left: 2%;
    // width: 50px;
    // height: 50px;
    cursor: pointer;
  }
}

.burger-icon-contact-form{
  position: absolute;
  top: 5%;
  right: 5%;
  // width: 50px;
  // height: 50px;
  cursor: pointer;
}

.contact-form-enter-active, .contact-form-leave-active{
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.contact-form-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.contact-form-enter-to, .contact-form-leave-from {
  transform: translateX(0%);
  opacity: 1;
}

.contact-form-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.sidebar-enter-active, .sidebar-leave-active{
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.sidebar-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.sidebar-enter-to, .sidebar-leave-from {
  transform: translateX(0%);
  opacity: 1;
}

.sidebar-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
