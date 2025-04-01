<script setup>
import { ref, inject, onMounted, onBeforeMount } from 'vue'
import { useGlobalStore } from '@/store/global.js'
import { testNetworkSpeedViaDownload } from '@/helpers/checkNetworkSpeed.js'

const { isMobile } = inject('screenSize')
const globalStore = useGlobalStore()

const videoReady = ref(false)
const goodNetwork = ref(false)
const videoSource = ref(null)
const fallbackLoaded = ref(false)

// Preload fallback image immediately
function preloadFallbackImage () {
  console.log("Preloading fallback image")
  const img = new Image()
  img.src = new URL('@/assets/pages/home/landing-fallback.png', import.meta.url).href
  img.onload = () => {
    fallbackLoaded.value = true
  }
}

async function determineBackgroundMedia (speed) {
  console.log("Determining BG media", speed)
  try {
    console.log("Try speed:", speed)
    if (speed >= 5) {
      if(isMobile.value){
        videoSource.value = (
          await import("@/assets/pages/home/mobile_1mbps.mp4")
        ).default;
      } else {
        videoSource.value = (
          await import("@/assets/pages/home/desktop_2mbps.mp4")
        ).default;
      }
      console.log("Video Module loaded")
      goodNetwork.value = true
      videoReady.value = true
      globalStore.showLoadingScreen = false
    }
  } catch (e) {
    return
  }
}


onBeforeMount(()=>{
  globalStore.showLoadingScreen = true
})

onMounted(async () => {
  console.log("mounted")
  preloadFallbackImage()

  try {
    // Start network test and media determination in parallel
    const [networkSpeed] = await Promise.all([
      testNetworkSpeedViaDownload(),
      preloadFallbackImage()
    ])

    await determineBackgroundMedia(networkSpeed.speed)
  } catch (error) {
    console.error('Network test failed:', error)
    goodNetwork.value = false
    videoReady.value = true
  } finally {
    // Ensure loading screen is hidden after max 3 seconds
    console.log("Promise finally")
    Promise.race([
      new Promise(resolve => setTimeout(resolve, 3000)),
      new Promise(resolve => {
        if(videoReady.value || fallbackLoaded.value) resolve()
      })
    ]).finally(() => {
      globalStore.showLoadingScreen = false
    })
  }
})
</script>

<template>
  <div class="home-container">
    <div v-if="goodNetwork && videoReady" class="video-container">
      <video
        class="background-video"
        :class="isMobile ? 'mobile' : ''"
        poster="@/assets/pages/home/landing-fallback.png"
        preload="metadata"
        autoplay
        muted
        loop
        playsinline
        disableremoteplayback
      >
        <source :src="videoSource" type="video/mp4">
      </video>
    </div>
    <div v-else class="image-container">
      <img 
        src="@/assets/pages/home/landing-fallback.png" 
        class="background-image"
        v-if="fallbackLoaded"
      >
    </div>


    <div class="texts-container">
      <div class="home-text-container">
        <h1 class="home-text">Honey <br/>Essence of <br />Nature</h1>
        <router-link
          class="route-button small-button"
          style="color: #131313"
          to="/products"
          >Start your journey</router-link
        >
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.home-container {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: flex-end;
  z-index: 3 !important;
  @media (max-width: 768px) {
    align-items: flex-start;
    justify-content: center;
  }
}
.image-container{
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden !important;
  z-index: 1;
  .background-image{
    width: 100%;
    height: 100%;
    object-fit: cover;
    overflow: hidden !important;
  }
}

.video-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden !important;
  z-index: 1;
}

.background-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 90% 90%;
  overflow: hidden !important;
  &.mobile {
    max-height: 100vh;
    width: auto !important;
    height: 100%;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-height: 100vh;
    object-fit: fill;
  }
}

.texts-container {
  position: absolute;
  right: 15%;
  top: 20%;
  display: flex;
  flex-direction: row;
  align-content: center;
  justify-content: center;
  z-index: 4;
  @media (max-width: 768px) {
    position: static;
    margin-top: 10%;
  }
  .home-text-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    // margin-top: -300px;
    @media (max-width: 768px) {
      align-items: center;
    }
    .home-text {
      display: flex;
      align-items: center;
      font-family: "DM Serif";
      font-size: 100px;
      font-weight: 600;
      color: #131313;
      line-height: 82.6%;
      text-align: left;
      margin-bottom: 15px;
      @media (max-width: 1440px) {
        font-size: 80px;
      }
      @media (max-width: 1366px) {
        font-size: 70px;
      }
      @media (max-width: 768px) {
        font-size: 60px;
        text-align: center;
      }
    }
    .route-button {
      padding-left: 2px !important;
      font-family: "DM Serif";
      @media (max-width: 768px) {
        text-align: center;
      }
    }
  }
}
</style>
