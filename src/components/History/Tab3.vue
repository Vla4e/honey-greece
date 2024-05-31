<template>
  <div class="tab-3">
    <h1 class="heading">ALRIGHT THEN</h1>
    <h2 class="heading-addition">of our honey</h2>
  </div>
</template>

<script>
export default {
  name: 'Tab3',
  phases: 2,
}
</script>
<script setup>
import {ref, computed, inject } from 'vue';
import router from '@/router/index.js'
import { stringifyQuery } from 'vue-router';
const maxPhases = 2 //3 counted from 0
</script>

<style lang="scss" scoped>
</style>