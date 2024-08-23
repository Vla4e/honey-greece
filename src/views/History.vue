
<template>
  <div :class="`current-tab-${currentTabId}`" class="history-page-container">
    <div class="tab-container" ref="mobileScrollTarget">
        <keep-alive>
          <Transition name="slide-1" mode="out-in"> 
            <!-- History slide-->
            <component class="tab" :is="currentTabComponent" :key="currentTabId" :currentPhase="currentPhase"></component>
          </Transition>
        </keep-alive>
        
        <component v-if="isMobile" class="tab" :is="mobileTabComponent" :key="4" :currentPhase="0"> </component>
    </div>
    <div v-if="!isAtFinalPhase && (!isMobile || (isMobile && currentTabId === 0))" class="cycle-container">
      <button class="cycle" @click="cycleForward()">
        <img :src="getCycleButtonImage()" alt="Cycle forward" />
      </button>
    </div>
    <!-- <div class="change-tabs">
      <button class="slide-changer" @click="previousTab()" > &lt; prev tab</button>
      <button class="slide-changer" @click="nextTab()">next tab >  
        {{ currentTabId }}</button>
    </div>
    <div class="change-phases">
      <button class="slide-changer" @click="previousPhase()" > &lt; prev phase</button>
      <button class="slide-changer" @click="nextPhase()" >next phase > </button>
    </div> -->
  </div>
</template>

<script>
import Tabs from "@/components/History/index.js"
export default {
  name: 'History',
}
</script>

<script setup>
import { ref, computed, toRaw, inject, onMounted } from 'vue';
import chevronRightWhite from '@/assets/images/arrow-white.svg';
import chevronRight from '@/assets/images/arrow.svg';

import { useNavbarStore } from '@/store/navbar.js'
const navbarStore = useNavbarStore();

let emitter = inject('emitter')
const { isMobile } = inject('screenSize')

let currentPhase = ref(0)
let currentTabId = ref(0)
let isAtFinalPhase = ref(false)
// let currentTabComponent = computed(() => Tabs[currentTabId.value])
let currentTabComponent = computed(() => isMobile.value && currentTabId.value === 3 ? Tabs[3] : Tabs[currentTabId.value]);
let mobileTabComponent = Tabs[3]
const mobileScrollTarget = ref();

function cycleForward() {
  if (isMobile.value) {
    console.log("TC", mobileScrollTarget.value)
    // reset phase for new tab
    if(mobileScrollTarget.value){
      let targets = mobileScrollTarget.value.getElementsByClassName('tab-mobile-column')
      console.log('scroll into view', targets)
      targets[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } else {
    // Desktop
    console.log("cphase ctcomp ctabId before IFS", currentPhase.value, currentTabComponent.value.phases, currentTabId.value)
    if (currentPhase.value < currentTabComponent.value.phases) {
      currentPhase.value++;
    } else {
      if (currentTabId.value < 2) { // cycle up to Tab2
        currentTabId.value++;
        currentPhase.value = 0;
      } else {
        console.log("IS at final phase !")
        isAtFinalPhase.value = true;
        return
      }
    }
    if(currentPhase.value === 2 && currentTabId.value === 2){
      isAtFinalPhase.value = true;
    }
    if(currentTabId.value === 1){
      console.log("Should set navColor")
      navbarStore.setNavbarColor({desktop: 'black', mobile: 'white'})
    } else if(currentTabId.value === 2){
      navbarStore.setNavbarColor({desktop: 'white', mobile: 'white'})
    }
    console.log("cphase ctcomp ctabId AFTER IFS", currentPhase.value, currentTabComponent.value.phases, currentTabId.value)
  }

  // update based on current tab and phase
  updateTextColor();
}

function updateTextColor() {
  if (currentTabId.value === 0) {
    emitter.emit('switchTextColor', 'white');
  } else if (currentTabId.value === 1) {
    emitter.emit('switchTextColor', 'black');
  } else if (currentTabId.value === 2) {
    if (currentPhase.value > 1) {
      emitter.emit('switchTextColor', 'black');
    } else {
      emitter.emit('switchTextColor', 'white');
    }
  } else if (currentTabId.value === 3) { // TabMobile
    emitter.emit('switchTextColor', 'white'); // Adjust this as needed for TabMobile
  }
}

function getCycleButtonImage() {
  if (isMobile.value) {
    return currentTabId.value === 0 ? chevronRightWhite : chevronRight;
  } else {
    return (currentTabId.value === 1 || (currentTabId.value === 2 && currentPhase.value === 2)) 
      ? chevronRight 
      : chevronRightWhite;
  }
}

const nextTab = () => {
  if (isMobile.value) {
    currentTabId.value = currentTabId.value === 0 ? 3 : 0;
  } else {
    if (currentTabId.value < 2) currentTabId.value++;
    else currentTabId.value = 0;
  }
  currentPhase.value = 0; // Reset phase for new tab
  updateTextColor();
};

const previousTab = () => {
  if (isMobile.value) {
    currentTabId.value = currentTabId.value === 3 ? 0 : 3;
  } else {
    if (currentTabId.value > 0) currentTabId.value--;
    else currentTabId.value = 2;
  }
  currentPhase.value = 0; // Reset phase for new tab
  updateTextColor();
};

const nextPhase = () => {
  if(currentPhase.value === currentTabComponent.value.phases) return 
  currentPhase.value++;
};

const previousPhase = () => {
  if (currentPhase.value > 0) currentPhase.value--;
};

onMounted(() => {
  emitter.emit('switchTextColor', 'white')
})
</script>

<style lang="scss" scoped>
.history-page-container{
  width: 100%;
  height: 100%;
  max-width: 100% !important;
  display: flex;
  flex-direction: column;
  flex-grow: 0;
  margin: 0;
  overflow: hidden;
  .tab-container{
    width: 100%;
    height: 100%;
    .tab{
      display: flex;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
  }
  &.current-tab-1{
    background-image: none;
    background-color: white;
  }
  &.current-tab-2{
    .tab-container{
      display: flex;
      justify-content: center;
    }
  }
  @media(max-width: 767px){
    overflow: visible;
    .tab-container{
      flex-grow: 1;
      .tab{
        overflow: visible;
      }
    }
  }
}


//Transition animation
.slide-1-enter-active, .slide-1-leave-active{
  transition: transform 0.5s ease-out;
}

.slide-1-enter-from {
  transform: translateX(100%);
}

.slide-1-enter-to{
  transform: translateX(0%);
}

.slide-1-leave-from {
  transform: translateX(0%);
}
.slide-1-leave-to {
  transform: translateX(-100%);
}
@media (max-width: 767px) {
  .slide-1-enter-from {
    transform: translateY(100%);
  }

  .slide-1-enter-to {
    transform: translateY(0%);
  }

  .slide-1-leave-from {
    transform: translateY(0%);
  }

  .slide-1-leave-to {
    transform: translateY(-100%);
  }
}


.change-tabs{
  position: absolute;
  bottom: 0%;
  left: 60%;
  transform: translateX(-50%);
  z-index: 3;
}
.change-phases{
  position: absolute;
  bottom: 0%;
  left: 40%;
  transform: translateX(-50%);
  z-index: 3;
}
.cycle-container{
  position: fixed;
  // width: ;
  height: 60px;
  right: 0;
  top: 50%;
  z-index: 10000;
  .cycle{
    height: 100%;
    background: transparent;
    width: 100%;
    transform: scale(1);
    transition: transform 0.5s ease-in-out;
    img{
      height: 100%;
      &:focus, &:hover{
        transform: scale(1.05);
      }
    }
  }
  @media(max-width: 767px){
    position: absolute;
    right: 50%;
    top: 90vh;
    // top: auto;
    transform: translateX(50%) rotate(90deg);
  }
}
</style>
