
<template>
  <div :class="`current-tab-${currentTabId}`" class="history-page-container">
    <div class="tab-container">
        <keep-alive>
          <Transition name="slide-1" mode="out-in"> 
            <!-- History slide-->
            <component class="tab" :is="currentTabComponent" :key="currentTabId" :currentPhase="currentPhase"></component>
          </Transition>
        </keep-alive>
    </div>
    <div class="cycle-container">
      <button class="cycle" @click="cycleForward()">
        <img v-if="currentTabId === 1 || (currentTabId === 2 && currentPhase === 2)" :src="chevronRight"/>
        <img v-else :src="chevronRightWhite"/>
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
// const carouselItems = [
//   { id: 1, slotName: 'item1', content: 'First Item: Welcome to the Carousel!' },
//   { id: 2, slotName: 'item2', content: 'Second Item: Enjoy your ride.' },
//   { id: 3, slotName: 'item3', content: "Third Item: Don't forget to check all our features." },
//   { id: 4, slotName: 'item4', content: 'Fourth Item: Last one, hope you had fun!' }
// ];

let emitter = inject('emitter')

let currentPhase = ref(0)
let currentTabId = ref(0)
let currentTabComponent = computed(() => Tabs[currentTabId.value])

function cycleForward() {
  // Check if there are more phases in the current tab
  console.log("CurrentTabComponent", currentTabComponent.value)
  if (currentPhase.value < currentTabComponent.value.phases) {
    currentPhase.value++;
  } else {
    // If not, move to the next tab and reset the phase
    if (currentTabId.value < Tabs.length - 1) {
      currentTabId.value++;
    } else {
      currentTabId.value = 0; // Loop back to the first tab if on the last tab
    }
    currentPhase.value = 0; // Reset the phase for the new tab
  }

  if(currentTabId.value === 0 ){
    emitter.emit('switchTextColor', 'white')
  } else if(currentTabId.value === 1 ){
    emitter.emit('switchTextColor', 'black')
  } else if(currentTabId.value === 2 ){
    if(currentPhase.value > 1){
      emitter.emit('switchTextColor', 'black')
    } else {
      emitter.emit('switchTextColor', 'white')
    }
  }
}
const nextTab = () => {
  console.log("Current Tab", currentTabId.value)
  if (currentTabId.value < Tabs.length - 1) currentTabId.value++;
  else currentTabId.value = 0;
  currentPhase.value = 0; // Reset phase for new tab
};

const previousTab = () => {
  if (currentTabId.value > 0) currentTabId.value--;
  else currentTabId.value = Tabs.length - 1;
  currentPhase.value = 0; // Reset phase for new tab
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
}

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
  position: absolute;
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
}
</style>
