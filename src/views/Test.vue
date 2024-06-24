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

<style lang="scss">
.color-picker{
  position: absolute;
  top: 30%;
  left: 80%;
  z-index: 10000;
}
.product-page-container{
  display: flex;
  width: 100% !important;
  max-width: 100% !important;
  height: 100%;
}
</style>
