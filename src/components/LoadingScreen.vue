<template>
  <Transition name="slide">
    <div v-show="showSlide" class="loading-slide">
      <span class="transition-text" :style="textFillStyle">Hellenic Premium Honey</span>
    </div>
  </Transition>
</template>

<script>
import { computed, onMounted } from 'vue';
import { useGlobalStore } from "@/store/global.js"

export default {
  name: 'LoadingScreen',
  setup() {
    const globalStore = useGlobalStore();
    const showSlide = computed(() => globalStore.showLoadingScreen);
    const textFillPercentage = computed(() => globalStore.loadingProgress);

    const textFillStyle = computed(() => ({
      background: `linear-gradient(to right, white ${textFillPercentage.value}%, gray ${textFillPercentage.value}%) 0/100% no-repeat, gray`,
      "-webkit-background-clip": "text",
      "color": "transparent"
    }));

    onMounted(() => {
      setInterval(() => {
        globalStore.loadingProgress++;
        if (globalStore.loadingProgress >= 100) {
          globalStore.loadingProgress = 0;
          // clearInterval(interval);
        }
      }, 20);
    });

    return { showSlide, textFillStyle };
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
  @media(max-width: 767px){
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
