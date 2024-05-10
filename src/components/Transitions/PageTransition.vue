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
import { ref, watch } from 'vue';
import { useGlobalStore } from '@/store/global.js'
import { storeToRefs } from 'pinia';
export default {
  name: 'PageTransition',
  setup(){
    let showSlide = ref(false);
    let showSlide2 = ref(false)
    let globalStore = useGlobalStore()
    let { playAnimationOnEnter } = storeToRefs(globalStore)
    //ROUTER TRANSITION
    watch(playAnimationOnEnter, () => {
      if(playAnimationOnEnter.value){
          showSlide.value = true
          setTimeout(()=> {
            showSlide2.value = true
          }, 600)
          setTimeout(()=>{
            showSlide.value = false
          }, 2600)
          setTimeout(()=>{
            showSlide2.value = false
          }, 2000)
          setTimeout(()=>{
            globalStore.changeAnimationFlag(false)
          }, 3500)
      }
    })
    return { showSlide, showSlide2 }
  }
}
</script>
<style lang="scss" scoped>
.transition-container{
  position: fixed;
  width: 100vw;
  height: 100vw;
  z-index: 10000;
}

.slide-transition{
  overflow: hidden;
}
.transition-slide{
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  &-1{
    z-index: 10000;
    background-color: white;
  }
  &-2{
    z-index: 10001;
    background-color: #131313;
  }
}
.transition-text{
  font-family: 'DM Serif';
  font-size: 100px;
  font-weight: 600;
  color: white;
}
.slide-1-enter-active,
.slide-1-leave-active {
  transition: all 0.5s ease-out;
}

.slide-1-enter-to {
  position: absolute;
  right: 0;
}

.slide-1-enter-from {
  position: absolute;
  right: -100%;
}

.slide-1-leave-to {
  position: absolute;
  left: -100%;
}

.slide-1-leave-from {
  position: absolute;
  left: 0%;
}
.slide-2-enter-active,
.slide-2-leave-active {
  transition: all 0.5s ease-out;
}

.slide-2-enter-to {
  position: absolute;
  right: 0;
}

.slide-2-enter-from {
  position: absolute;
  right: -100%;
}

.slide-2-leave-to {
  position: absolute;
  left: -100%;
}

.slide-2-leave-from {
  position: absolute;
  left: 0%;
}
</style>
