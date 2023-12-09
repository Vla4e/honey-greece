<template>
  <div class="product-page-container">
    <ProductScene/>
  </div>
</template>

<script>
import ProductScene from '../components/ProductScene.vue'
export default {
  components: { ProductScene },
  setup(){
  }
}
</script>

<style lang="scss" scoped>
.product-page-container{
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
}
</style>