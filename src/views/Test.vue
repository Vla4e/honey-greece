<template>
  <div class="product-page-container">
    <div class="product-viewer" ref="productViewer">
      <TestScene/>
    </div>
    <ColorPicker class="color-picker target"/>
  </div>
</template>

<script>
import TestScene from "../components/TestScene.vue"

export default {
  components: { TestScene },

  setup(props) {
    return {
    };
  },
};
</script>

<style lang="scss" scoped>
.color-picker{
  position: absolute;
  bottom: 10%;
  right: 10%;
  top:auto !important;
  left: auto !important;
  z-index: 10000;
}
.product-page-container{
  display: flex;
  width: 100% !important;
  max-width: 100% !important;
  height: 100%;
  .product-viewer{
    width: 100%;
  }
}
</style>
