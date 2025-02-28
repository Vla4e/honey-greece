<template>
  <div class="tab-0" :class="`tab-0-phase-${currentPhase}`">
    <video
      v-if="videoReady"
      class="background-video"
      :class="isMobile ? 'mobile-video' : ''"
      autoplay
      muted
      loop
      playsinline
      disableremoteplayback
    >
      <source :src="videoSource" type="video/mp4" />
    </video>
    <div class="video-layer" />
    <!-- State 1 -->
    <div class="heading-container">
      <h1 class="heading">History</h1>
      <h2 class="heading-addition">of our honey</h2>
      <p v-if="!isMobile" class="text text-1">
        For over 40 years, the Montouris family has been dedicated to the timeless craft
        of beekeeping, producing some of the finest honey in Greece. Today, we proudly
        continue this rich tradition, with Antonios Montouris at the helm, steering the
        course towards an even sweeter future.
      </p>
    </div>
    <div v-if="!isMobile" class="image-grid">
      <!-- <Transition name="fade" class="fade-out"> -->
      <img :src="gridImage1" class="image-1" />
      <!-- </Transition> -->
      <img :src="gridImage2" class="image-2" />
      <img :src="gridImage3" class="image-3" />
    </div>
    <!-- State 2 -->
    <!-- State 3 -->
  </div>
</template>

<script>
export default {
  name: "Tab0",
  phases: 2, // 0 indexed
};
</script>
<script setup>
import { ref, onMounted, inject, watch } from "vue";
import router from "@/router/index.js";
import { getNetworkSpeed } from "@/helpers/checkNetworkSpeed.js";

import gridImage1 from "@/assets/pages/history/tab-0-card-1.png";
import gridImage2 from "@/assets/pages/history/tab-0-card-2.png";
import gridImage3 from "@/assets/pages/history/tab-0-card-3.png";

const maxPhases = 2; //3 counted from 0
const { isMobile } = inject("screenSize");

let props = defineProps({
  currentPhase: Number,
});

let videoReady = ref(false);
let videoSource = ref(null);

async function loadVideo(speed) {
  if (isMobile.value) {
    videoSource.value = (
      await import("@/assets/pages/history/smoker-mobile.mp4")
    ).default;
  } else {
    if (speed >= 5) {
      videoSource.value = (await import("@/assets/pages/history/smoker-hd.mp4")).default;
    } else {
      videoSource.value = (await import("@/assets/pages/history/smoker.mp4")).default;
    }
  }
  videoReady.value = true;
}

onMounted(async () => {
  const networkSpeed = getNetworkSpeed();
  console.log("NETWORKSPEED", networkSpeed);
  if (networkSpeed !== null) {
    await loadVideo(networkSpeed);
    console.log("Current value = ", videoSource.value);
  } else {
    videoSource.value = await import("@/assets/pages/history/smoker.mp4").default;
  }
});

watch(
  () => props.currentPhase,
  (newPhase) => {
    console.log("phase change", newPhase);
  }
);
</script>

<style lang="scss" scoped>
.background-video {
  display: flex;
  position: absolute;
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  overflow: hidden !important;
}
.video-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgb(34 34 34 / 30%);
}
.tab-0 {
  position: relative;
  background-image: url("@/assets/pages/history/tab-0-background.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  .heading-container {
    display: flex;
    flex-direction: column;
    position: absolute;
    width: 25%;
    top: 20%;
    right: 20%;
    transition: all 1s ease-out, width 0.8s;
    .heading {
      transition: all 1s ease-in-out;
    }
    .heading-addition {
      transition: opacity 0.5s ease-in-out;
    }
    .text {
      opacity: 0;
      transition: all 0.6s 1.2s ease-in-out;
    }
  }
  .image-grid {
    display: flex;
    width: 70%; // of the container tab-0
    overflow: hidden;
    position: relative;
    transform: translateX(150%); // Start off-screen to the right
    transition: transform 1s ease-in-out;
    img {
      width: 33.3%;
      // height: auto;
    }
  }

  @media (max-width: 767px) {
    background-image: none !important;
    min-height: 100vh !important;
    justify-content: center;
    align-items: center;
    .heading-container {
      position: initial;
      width: 100%;
      justify-content: center;
      align-items: center;
      z-index: 10;
    }
    .heading {
      font-size: 64px !important;
      &-addition {
        font-size: 20px !important;
      }
    }
  }
}

// PHASE 1
.tab-0-phase-0 {
  flex-direction: column;
  position: relative;
  .heading-container {
  }
  .image-grid {
  }
}
// PHASE 2
.tab-0-phase-1 {
  flex-direction: row;
  align-items: center;
  justify-content: center;
  .heading-container {
    width: 25%;
    top: 30%;
    right: 65%;
    .heading {
      font-size: clamp(36px, 64px + 2vw, 150px);
      text-align: left;
      @media (max-width: 1366px) {
        font-size: 60px;
      }
      @media (max-width: 1024px) {
        font-size: 60px;
      }
    }
    .heading-addition {
      display: none;
      opacity: 0;
    }
    .text {
      opacity: 1;
      font-size: clamp(16px, 1rem + 0.5vw, 60px);
      @media (max-width: 1537px) {
        font-size: 20px;
      }
      @media (max-width: 1367px) {
        font-size: 18px;
      }
      @media (max-width: 1025px) {
        font-size: 16px;
      }
    }
  }
  .image-grid {
    transform: translateX(40%);
    .image-1 {
      opacity: 1;
      transition: opacity 0.5s ease-in-out;
    }
    .image-2,
    .image-3 {
      transform: translateX(0%);
      transition: transform 0.5s ease-in-out;
    }
  }
}
// PHASE 3
.tab-0-phase-2 {
  flex-direction: row;
  align-items: center;
  justify-content: center;
  .heading-container {
    width: 25%;
    top: 30%;
    right: 65%;
    .heading {
      font-size: clamp(36px, 64px + 2vw, 150px);
      text-align: left;
      @media (max-width: 1366px) {
        font-size: 60px;
      }
      @media (max-width: 1024px) {
        font-size: 60px;
      }
    }
    .heading-addition {
      display: none;
    }
    .text {
      opacity: 1;
      font-size: clamp(16px, 1rem + 0.5vw, 60px);
      @media (max-width: 1537px) {
        font-size: 20px;
      }
      @media (max-width: 1367px) {
        font-size: 18px;
      }
      @media (max-width: 1025px) {
        font-size: 16px;
      }
    }
  }
  .image-grid {
    // transform: translateX(-20%);
    transform: translateX(40%);
    img {
      //  transition: transform 0.5s ease-out;
    }
    .image-1 {
      opacity: 0;
      transition: opacity 0.5s ease-in-out;
    }
    .image-2,
    .image-3 {
      transform: translateX(-100%);
      transition: transform 0.5s ease-in-out;
    }
  }
}

.heading-container {
  .heading {
    font-family: "DM Serif";
    font-style: normal;
    font-size: clamp(64px, 8vw, 10vw);
    font-weight: 400;
    color: white;
    text-align: right;
    text-shadow: 4px 4px 4px rgba(0, 0, 0, 0.5);
    margin: 0;
    margin-bottom: 15px;
    &-addition {
      font-family: "DMSans";
      font-size: clamp(28px, 2vw, 4vw);
      font-weight: 400;
      color: white;
      letter-spacing: 0.04em;
      text-align: right;
      text-transform: uppercase;
      text-shadow: 4px 4px 4px rgba(0, 0, 0, 0.5);
      margin: 0;
    }
  }
  .text-1 {
    font-family: "DMSans";
    font-size: clamp(16px, 1rem + 0.5vw, 60px);
    text-shadow: 4px 4px 4px rgba(0, 0, 0, 0.5);
    font-weight: 400;
    text-align: left;
    color: white;
  }
}
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-leave-from {
  opacity: 1;
}
.fade-leave-to {
  opacity: 0;
}
</style>
