<template>
  <div class="tab-2">
    <h1 class="floating-heading">A Tradition of Excellence</h1>
    <div class="image-container">
    </div>
  </div>
</template>

<script>
export default {
  name: 'Tab2',
  phases: 5,
}
</script>
<script setup>
import {ref, computed, inject } from 'vue';
import router from '@/router/index.js'
const maxPhases = 5; //6 counted from 0
</script>

<style lang="scss" scoped>
.tab-2{
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  .floating-heading{
    position: absolute;
    top: 15%;
    left: 50%;
    transform: translateX(-50%);
    font-family: "DMSans";
    font-size: 150px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-align: center;
    color: #0000000D;
    margin: 0;
    width: 100%;
    text-transform: uppercase;
  }
}
</style>