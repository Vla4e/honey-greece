
<template>
  <div class="home-container">
    <JarScene v-if="!showVideo && !isMobile"/>
    <div v-else-if="!isMobile" class="video-container">
      <!-- Add video tag here -->
      <!-- <img :src="bgNew" class="background-video"/> -->
      <video class="background-video" autoplay muted loop playsinline>
        <source :src="homeVideoHQ" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
    <button v-if="!isMobile" class="show-vid-button" @click="showBg()">switch to video/scene</button>
    <JarSceneMobile v-if="isMobile"/>
    <!-- <div class="texts-container">
      <div class="home-text-container">
        <span class="home-text">Essence of <br/>Nature</span>
        <router-link class="route-button small-button" style="color: #131313;" to="/products">Start your journey</router-link>
      </div>
      <span class="home-subtext">By Honey Apiary Academy</span>
    </div> -->
  </div>
</template>

<script>
import { ref } from 'vue';
import { useWindowSize } from "@vueuse/core";
import homeVideo from '@/assets/pages/home/background-vid.mp4'
import homeVideoHQ from '@/assets/pages/home/background-video-hq.mp4'
import bgNew from '@/assets/pages/home/bg-new.png'
import JarScene from '../components/JarScene.vue'
import JarSceneMobile from '../components/JarSceneMobile.vue'
import WebGL from 'three/addons/capabilities/WebGL.js';
export default{
  name: 'Home',
  components: { JarScene, JarSceneMobile },
  setup(){
    const { width: windowWidth, height: windowHeight } = useWindowSize();
    let isMobile = ref(false);
    if(windowWidth.value < 764){
      isMobile.value = true;
    } else isMobile.value = false
    console.log("WebGL AVAILABLE", WebGL.isWebGLAvailable())
    console.log("Is mobile:", isMobile.value)
    let showVideo = ref(false)
    function showBg(){
      showVideo.value = !showVideo.value
    }
    return { homeVideo, homeVideoHQ, bgNew, showVideo, showBg, isMobile}
  }
}
</script>

<style lang="scss">
.home-container{
  display: flex;
  width: 100%;
  max-height: 92%;
  align-items: center;
  justify-content: flex-end;
  z-index: 3 !important;
  .jar-sc-container{
    z-index: 1 !important;
    position: absolute;
    top: 0;
    left: 0;
  }
}
.show-vid-button{
  position: absolute;
  bottom: 0%;
  left: 25%;
  z-index: 20000;
}
.read-the-docs {
  color: #888;
}
.video-cover{
  background: linear-gradient(180deg, rgba(204, 204, 204, 0.50) 0%, rgba(255, 255, 255, 0.00) 100%);
  z-index: 2;
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  
}
.background-video-container{
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  z-index: 1 !important;
  overflow:hidden;
  .background-video{
    width: 140vw;
  }
}
.texts-container{
  display: flex;
  flex-direction: row;
  align-content: center;
  justify-content: center;
  z-index: 4;
  .small-jar-home{
    height: 400px !important; 
    margin-right: 50px;
  }
  .home-text-container{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    // margin-top: -300px;
    .home-text{
      display: flex;
      align-items: center;
      font-family: 'DM Serif';
      font-size: 100px;
      font-weight: 600;
      color: #131313;
      line-height: 82.6%;
      text-align: left;
      margin-bottom: 15px;
    }
  }
}
.video-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1; /* Ensure it's behind everything else but above the jar scene if needed */
}

.background-video {
  width: 100%;
  height: 100%;
  object-fit: cover; /* This will cover the entire area without stretching the video */
}
</style>
