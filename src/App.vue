<template>
  <div class="app-container">
    <div v-if="!showSidebar" class="burger-icon-container">
      <img :src="burgerIcon" @click="toggleSidebar" class="burger-icon"/>
    </div>
    <Sidebar v-if="showSidebar"/>
    <NavbarComponent v-show="!showSidebar && showNavbar" id="nav"/>
    <Transition :name="computedTransition">
      <RouterView v-show="!showSidebar" class="page-container"/>
    </Transition>
    <!-- <Footer id="footer"/> -->
  </div>
</template>

<script>
import { inject, ref, watch } from 'vue';
import { useNavbarStore } from '@/store/navbar.js'
import { useGlobalStore } from '@/store/global.js'
import { storeToRefs } from 'pinia';
import burgerIcon from '@/assets/images/burger-icon.svg'
export default {
  setup(){
    let globalStore = useGlobalStore()
    let { playAnimationOnEnter } = storeToRefs(globalStore)

    let navbarStore = useNavbarStore()
    let { showNavbar } = storeToRefs(navbarStore)

    let emitter = inject('emitter')
    let showSidebar = ref(false);
    let computedTransition = ref('')

    //ROUTER TRANSITION
    watch(playAnimationOnEnter, () => {
      if(playAnimationOnEnter.value){
        computedTransition.value = 'slide'
      } else computedTransition.value = ''
    })
    
    //SIDEBAR
    function toggleSidebar(){
      emitter.emit('toggleSidebar')
    }
    emitter.on('toggleSidebar', (e) => {
      showSidebar.value = !showSidebar.value
    })

    return { showSidebar, toggleSidebar, showNavbar, burgerIcon, computedTransition }
  }
}
</script>
<style lang="scss" scoped>
.app-container{
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  /* background: url('@/assets/pages/home/background.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center; */
}
.page-container{
  max-width: 1280px;
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
  z-index: 11;
  :hover{
    transform: scale(1.1);
    transition: all ease-in-out 0.3s;
  }
  .burger-icon{
    position: absolute;
    top: 2%;
    left: 2%;
    width: 50px;
    height: 50px;
  }
}
.slide-enter-active,
.slide-leave-active {
  transition: all 2s ease-out;
}

.slide-enter-to {
  position: absolute;
  right: 0;
}

.slide-enter-from {
  position: absolute;
  right: -100%;
}

.slide-leave-to {
  position: absolute;
  left: -100%;
}

.slide-leave-from {
  position: absolute;
  left: 0;
}
</style>
