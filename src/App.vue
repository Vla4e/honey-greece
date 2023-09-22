<template>
  <div class="app-container">
    <Sidebar/>
    <NavbarComponent id="nav"/>
    <RouterView class="page-container"/>
    <!-- <Footer id="footer"/> -->
  </div>
</template>

<script>
export default {
}
</script>
<style scoped>
.app-container{
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  /* background: url('@/assets/pages/home/background.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center; */
}
.page-container{
  max-width: 1280px;
  margin: auto;
  flex-grow: 1;
  z-index: 3;
}
#nav, #footer{
  z-index: 10;
}
</style>
