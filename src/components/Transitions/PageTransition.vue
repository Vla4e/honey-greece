<template>
    <Transition class="slide-transition" name="slide-1">
      <div v-show="showSlide" class="transition-slide transition-slide-1">
        <span class="transition-text" style="color: black;">Hellenic Premium Honey</span>
      </div>
    </Transition>
    
    <Transition class="slide-transition" name="slide-2">
      <div v-show="showSlide2" class="transition-slide transition-slide-2">
        <span class="transition-text" style="color: white;">Hellenic Premium Honey</span>
      </div>
    </Transition>
  <!-- </div> -->
</template>

<script>
import { ref, watch, toRaw } from 'vue';
import { useGlobalStore } from '@/store/global.js'
import { storeToRefs } from 'pinia';

import { useRoute } from 'vue-router'

export default {
  name: 'PageTransition',
  setup(){
    let showSlide = ref(false);
    let showSlide2 = ref(false)
    let globalStore = useGlobalStore()
    let { playAnimationOnEnter } = storeToRefs(globalStore)

    let route = useRoute()
    let lastRoutePath = ref(null)
    let transitionIterator;
    let firstSlideTransitionStatus = ref(false);
    let secondSlideTransitionStatus = ref(false);

    function* handleTransition() {
      // Trigger enter animation
      requestAnimationFrame(() => {
        adjustPosition();
        showSlide.value = true;
        setTimeout(() => {
          showSlide2.value = true;
        }, 300);
        setTimeout(() => { // 300ms delay + 500ms duration = finished after 800ms
          firstSlideTransitionStatus.value = true
        }, 800)
      });

      yield;

      // Trigger exit animation
      requestAnimationFrame(() => {
        showSlide2.value = false;
        setTimeout(() => {
          showSlide.value = false;
        }, 300);
        setTimeout(() => {
          secondSlideTransitionStatus.value = true
        }, 800)
        setTimeout(() => {
          globalStore.changeAnimationFlag(false);
        }, 850);
      })
    }

    function startTransition() {
      // console.log("Beginning transition")
      // Initialize and start the generator
      transitionIterator = handleTransition();
      transitionIterator.next(); // Start the generator
    }

    watch(route, (newVal) => {
      if(newVal.path !== lastRoutePath.value){
        lastRoutePath.value = newVal.path
        if (transitionIterator) {
          let interval = setInterval(() => { //Check whether firstSlide animation is finished.
            if(firstSlideTransitionStatus.value){
              transitionIterator.next();
              clearInterval(interval)
            }
          }, 50)
        }
      }
    }, {
      immediate: true
    })


    //ROUTER TRANSITION
    watch(playAnimationOnEnter, (newVal) => {
      if (newVal) {
        firstSlideTransitionStatus.value = false;
        startTransition()
      }
    });

    

    function adjustPosition () {
      const currentScrollY = window.scrollY + 'px';
      document.querySelector('.transition-slide-1').style.top = currentScrollY;
      document.querySelector('.transition-slide-2').style.top = currentScrollY;
    };
    
    return { showSlide, showSlide2 }
  }
}
</script>
<style lang="scss" scoped>
.transition-container{
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10000;
}

.slide-transition{
  overflow: hidden;
  will-change: transform;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10001;
}
.transition-slide{
  position: absolute;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10002;
  &-1{
    z-index: 10003;
    background-color: white;
  }
  &-2{
    z-index: 10004;
    background-color: #131313;
  }
}
.transition-text{
  font-family: 'DM Serif';
  font-size: 100px;
  font-weight: 600;
  color: white;
  // z-index: 10050;
  @media(max-width: 767px){
    font-size: 50px;
    // white-space: nowrap;
  }
}

// Slide animations - consider transition duration in setTimeouts above
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
</style>
