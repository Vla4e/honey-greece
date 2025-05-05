<template>
  <Transition name="slide">
    <div v-show="showSlideTimed" class="loading-slide">
      <span class="transition-text" :style="textFillStyle">Hellenic Premium Honey</span>
    </div>
  </Transition>
</template>

<script>
import { computed, onMounted, watch, ref } from 'vue';
import { useGlobalStore } from "@/store/global.js";
import { useRoute } from 'vue-router'

export default {
  name: 'LoadingScreen',
  setup() {
    let route = useRoute()
    
    const globalStore = useGlobalStore();
    const showSlide = computed(() => globalStore.showLoadingScreen);
    const textFillPercentage = computed(() => globalStore.loadingProgress);
    let showSlideTimed = ref(false);
    
    watch(() => globalStore.loadingProgress, (newProgress) => {
      if (newProgress >= 100) {
        setTimeout(() => {
          showSlideTimed.value = false;
          globalStore.loadingProgress = 0; // Reset progress here after hiding the slide
        }, 50); // Optional delay to ensure users see the completion
      }
    });

    watch(() => showSlide.value, (val) => {
      showSlideTimed.value = val;
      if(val){
        beginProgressTracking()
      }
    });

    
    watch(() =>  route, (newRoute) => {
      if(newRoute.name !== 'Home'){
        showSlideTimed.value = false
      }
    }, {
      immediate: true
    })

    const textFillStyle = computed(() => ({
      background: `linear-gradient(to right, white ${textFillPercentage.value}%, gray ${textFillPercentage.value}%) 0/100% no-repeat, gray`,
      "-webkit-background-clip": "text",
      "color": "transparent"
    }));

    function beginProgressTracking(){
      let interval = setInterval(() => {
        if (globalStore.loadingProgress < 100) {
          globalStore.loadingProgress++;
        } else {
          globalStore.loadingProgress = 0;
          clearInterval(interval); // Ensure we clear interval only when necessary
        }
      }, 20)
    }


    return { showSlide, textFillStyle, showSlideTimed };
  }
}
</script>

<style lang="scss" scoped>
.loading-slide {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #131313;
  z-index: 10000;
  transition: opacity 0.5s ease-out;
}

.transition-text {
  font-family: 'DM Serif', serif;
  font-size: 100px;
  font-weight: 600;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  @media(max-width: 1024px){
    font-size: 50px;
  }
}


.slide-leave-active, .slide-enter-active {
  transition: transform 0.5s ease-in-out;
}

.slide-enter, .slide-enter-to {
  transform: translateX(0);
}

.slide-leave-to {
  transform: translateX(-100%);
}
</style>
