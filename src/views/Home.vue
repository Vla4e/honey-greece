
<template>
  <div class="home-container">
    <JarScene/>
    <div class="texts-container">
      <div class="home-text-container">
        <span class="home-text">Essence of <br/>Nature</span>
        <router-link class="route-button small-button" to="/products">Start your journey</router-link>
      </div>
      <!-- <span class="home-subtext">By Honey Apiary Academy</span> -->
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import homeVideo from '@/assets/pages/home/bg-vid.mp4'
import JarScene from '../components/JarScene.vue'
export default{
  name: 'Home',
  components: { JarScene },
  setup(){
    return { homeVideo }
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
      color: white;
      line-height: 82.6%;
      text-align: left;
      margin-bottom: 15px;
    }
  }
}
</style>
