<template>
  <div class="app-container" :style="hideOverflow ? 'overflow: hidden': ''">
    <div v-if="!isMobile && !showContactForm" class="burger-icon-container">
      <BurgerMenuIcon @click="toggleSidebar" class="burger-icon"/>
    </div>
    <NavbarComponent v-show="showNavbar" id="nav"/>

    <Transition name="sidebar">
      <Sidebar v-if="showSidebar"/>
    </Transition>
    <Transition name="contact-form">
      <ContactForm v-if="showContactForm"/>
    </Transition>

    <PageTransition></PageTransition>
    <RouterView class="page-container"/>
  </div>
</template>

<script>
import { inject, ref, watch, onMounted, onUnmounted } from 'vue';
import { useNavbarStore } from '@/store/navbar.js'
import { useGlobalStore } from '@/store/global.js'
import { storeToRefs } from 'pinia';
import burgerIcon from '@/assets/images/burger-icon.svg'
export default {
  setup(){
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

    let emitter = inject('emitter')
    let showSidebar = ref(false);
    let showContactForm = ref(false);
    let isMobile = ref(false)
    if(screen.width < 768){
      isMobile = true
    }
    
    //SIDEBAR
    function toggleSidebar(){
      showSidebar.value = !showSidebar.value
    }
    onMounted(()=>{
      emitter.on('toggleContactForm', ()=>{
        showContactForm.value = !showContactForm.value
      })
    })
    onUnmounted(()=> {
      emitter.off('toggleContactForm')
    })
    return {
      showSidebar, 
      toggleSidebar,
      showContactForm, 
      showNavbar, 
      burgerIcon, 
      isMobile, 
      hideOverflow
    }
  }
}
</script>
<style lang="scss" scoped>
.app-container{
  // overflow: hidden;
  height: 100%;
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
