<template>
  <div class="home-container">
    <div v-if="goodNetwork" class="video-container">
      <video
        v-if="videoReady"
        class="background-video"
        :class="isMobile ? 'mobile' : ''"
        autoplay
        muted
        loop
        playsinline
        disableremoteplayback
      >
        <source :src="videoSource" type="video/webm" />
      </video>
      <p v-else>Loading video...</p>
    </div>
    <div v-else class="image-container">
      <img src="@/assets/pages/home/bg-new.png" class="background-image"/>
    </div>


    <div class="texts-container">
      <div class="home-text-container">
        <span class="home-text">Essence of <br />Nature</span>
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

<script>
import { ref, inject, onMounted, onBeforeMount } from "vue";
import { getNetworkSpeed } from "@/helpers/checkNetworkSpeed.js";
import { useGlobalStore } from "@/store/global.js";

import bgNew from "@/assets/pages/home/bg-new.png";
import WebGL from "three/addons/capabilities/WebGL.js";

export default {
  name: "Home",
  setup() {
    const { isMobile } = inject("screenSize");

    const globalStore = useGlobalStore();

    let showVideo = ref(true);
    let videoReady = ref(false);
    let videoSource = ref(null);

    function switchBackground() {
      showVideo.value = !showVideo.value;
    }

    // use .default to access the default export of the module = src
    let goodNetwork =  ref(false)
    async function determineBackgroundMedia(networkSpeed){
      globalStore.showLoadingScreen = true;
      globalStore.loadingProgress = 0;
      if(networkSpeed > 10){
        videoSource.value = (
          await import("@/assets/pages/home/mobile_3mbps.mp4")
        ).default;
        goodNetwork.value = true
        videoReady.value = true;
      } else {
        goodNetwork.value = false
      }
      globalStore.showLoadingScreen = false;
    }

    async function loadVideo(speed) {
      globalStore.showLoadingScreen = true;
      globalStore.loadingProgress = 0;
      if (isMobile.value) {
        console.log("Will load mobile vid");
        if (speed >= 9) {
          videoSource.value = (
            await import("@/assets/pages/home/mobile_3mbps.mp4")
          ).default;
        } else if (speed >= 6) {
          videoSource.value = (
            await import("@/assets/pages/home/mobile_2mbps.mp4")
          ).default;
        } else {
          videoSource.value = (
            await import("@/assets/pages/home/mobile_1mbps.mp4")
          ).default;
        }
      } else {
        // if (speed >= 25) {
        //   videoSource.value = (await import('@/assets/pages/home/desktop_10mbps.mp4')).default;
        // } else if (speed >=10) {
        //   videoSource.value = (await import('@/assets/pages/home/desktop_5mbps.mp4')).default;
        // } else if (speed >= 6) {
        //   videoSource.value = (await import('@/assets/pages/home/desktop_2mbps.mp4')).default;
        // } else {
        //   videoSource.value = (await import('@/assets/pages/home/desktop_1mbps.mp4')).default;
        // }
        let vid = await import("@/assets/pages/home/landing-compressed.webm");
        console.log("VID:", vid.default)
        videoSource.value = vid.default
      }
      console.log("SOURCE:", videoSource.value);
      videoReady.value = true;
      globalStore.showLoadingScreen = false;
    }

    onBeforeMount(() => {
      globalStore.showLoadingScreen = true;
    });
    onMounted(async () => {
      const networkSpeed = getNetworkSpeed();
      console.log("NETWORKSPEED", networkSpeed);
      if (networkSpeed !== null) {
        await determineBackgroundMedia(networkSpeed);
        console.log("Current value = ", videoSource.value);
      } else {
        goodNetwork.value = false
        // videoSource.value = await import("@/assets/pages/home/desktop_1mbps.mp4").default;
      }
    });
    return {
      showVideo,
      switchBackground,
      isMobile,
      videoSource,
      videoReady,
    };
  },
};
</script>
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
    object-fit: contain;
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
