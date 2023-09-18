<template>
  <div class="home-container">
    <JarScene/>
  </div>
</template>

<script>
import JarScene from '../components/JarScene.vue'
export default {
  components: { JarScene },
  setup(){
  }
}
</script>

<style>
.home-container{
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
}
</style>