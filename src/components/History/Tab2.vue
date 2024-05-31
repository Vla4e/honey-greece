<template>
  <div class="tab-2">
    <h1 class="heading" style="color: black;">TAB 2</h1>
    <h2 class="heading-addition">of our honey</h2>
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
</style>