<template>
  <nav class="navbar">
    <div class="links-container">
      <img :src="sidebar" @click="toggleSidebar" class="burger-icon"/>
      <button @click="testButton">TEST ME {{count}}</button>
    </div>
    <div class="logo-container">
      <img :src="logo" class="navbar-logo" />
    </div>
  </nav>
</template>

<script>
import { inject, ref } from 'vue'
import logoUrl from '@/assets/images/main-logo.png'
import burgerIcon from '@/assets/images/burger-icon.svg'
export default {
  name: 'Navbar',
  setup() {
    let emitter = inject('emitter')
    let count = ref(0)
    function toggleSidebar(){
      emitter.emit('toggleSidebar')
    }
    function testButton(){
      count.value++
      console.log('counting up', count.value)
    }
    return { logo: logoUrl, sidebar: burgerIcon, toggleSidebar, testButton, count };
  },
};
</script>


<style lang="scss" scoped>
.navbar{
  display: flex;
  flex-direction: column;
  width: 100vw;
  min-height: 100px;
  background: transparent;
  position: relative;
}
.logo-container{
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
  position: relative;
  .navbar-logo{
    width: 210px;
  }
}
.links-container{
  display: flex;
  flex-grow: 1;
  justify-content: space-around;
  height: 60px; 
  .burger-icon{
    width: 40px;
  }
}
.links-container label {
  color: red;
  font-size: 16px;
}
</style>