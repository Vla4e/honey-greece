
<template>
  <div :class="`current-tab-${currentTabId}`" class="history-page-container">
    <div class="tab-container">
        <keep-alive>
          <Transition name="slide-1">
            <component class="tab" :is="currentTabComponent" :key="currentTabId" :currentPhase="currentPhase"></component>
          </Transition>
        </keep-alive>
    </div>
    <div class="change-tabs">
      <button class="slide-changer" @click="previousTab()" > &lt; prev tab</button>
      <button class="slide-changer" @click="nextTab()">next tab > </button>
    </div>
    <div class="change-phases">
      <button class="slide-changer" @click="previousPhase()" > &lt; prev phase</button>
      <button class="slide-changer" @click="nextPhase()" >next phase > </button>
    </div>
  </div>
</template>

<script>
import Tabs from "@/components/History/index.js"
export default {
  name: 'History',
}
</script>

<script setup>
import { ref, computed, toRaw } from 'vue';
// const carouselItems = [
//   { id: 1, slotName: 'item1', content: 'First Item: Welcome to the Carousel!' },
//   { id: 2, slotName: 'item2', content: 'Second Item: Enjoy your ride.' },
//   { id: 3, slotName: 'item3', content: "Third Item: Don't forget to check all our features." },
//   { id: 4, slotName: 'item4', content: 'Fourth Item: Last one, hope you had fun!' }
// ];

let currentPhase = ref(0)
let currentTabId = ref(0)
let currentTabComponent = computed(() => Tabs[currentTabId.value])
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
  .tab-container{
    width: 100%;
    height: 100%;
    .tab{
      display: flex;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    &.current-tab-1{
      background-image: none;
      background-color: white;
    }
  }
}

.slide-1-enter-active, .slide-1-leave-active{
  transition: transform 0.5s ease-out;
}
.slide-2-enter-active, .slide-2-leave-active {
  transition: transform 0.5s ease-out;
}

.slide-1-enter-from {
  transform: translateX(100%);
  // opacity: 0;
}
.slide-2-enter-from {
  transform: translateX(100%);
  // opacity: 0;
}

.slide-1-enter-to, .slide-1-leave-from {
  transform: translateX(0%);
  // opacity: 1;
}
.slide-2-enter-to, .slide-2-leave-from {
  transform: translateX(0%);
  // opacity: 1;
}

.slide-1-leave-to {
  transform: translateX(-100%);
  // opacity: 0;
}
 .slide-2-leave-to {
  transform: translateX(-100%);
  // opacity: 0;
}


.change-tabs{
  position: absolute;
  bottom: 0%;
  left: 60%;
  transform: translateX(-50%);
}
.change-phases{
  position: absolute;
  bottom: 0%;
  left: 40%;
  transform: translateX(-50%);
}
</style>
