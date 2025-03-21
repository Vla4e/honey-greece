<template>
  <div class="jar-test-container">
    <JarTest/>
  </div>
</template>

<script setup>
import JarTest from '../components/JarTest/JarTest.vue';
</script>

<style lang="scss" scoped>
.jar-test-container{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>