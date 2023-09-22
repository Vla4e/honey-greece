<template>
  <div class="product-tabs-container">
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

<style lang="scss" scoped>
.product-tabs-container{
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
}
</style>