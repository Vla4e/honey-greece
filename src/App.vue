
<template>
  <div class="app-container">
    <Navbar/>
    <RouterView class="page-container"/>
    <footer-component/>
  </div>
</template>

<script>
import { RouterLink, RouterView } from "vue-router";
</script>
<style scoped>
.app-container{
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  
  background: #FAEDE3;
}
.page-container{
  max-width: 1280px;
  margin: auto;
  flex-grow: 1;
}
</style>
