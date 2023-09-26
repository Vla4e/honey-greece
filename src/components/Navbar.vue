<template>
  <nav class="navbar">
    <div class="links-container">
      <div class="burger-icon-container">
        <img :src="sidebar" @click="toggleSidebar" class="burger-icon"/>
      </div>
      <div class="blend-links-container">
        <router-link class="blend-link" to="/">
          Okto
        </router-link>
        
        <router-link class="blend-link" to="/">
          Honey Apiary Academy
        </router-link>
        
        <router-link class="blend-link" to="/">
          Melculum
        </router-link>
      </div>
      <div class="inquire-container">
        <router-link class="blend-link" to="/">
          Inquire
        </router-link>
      </div>
    </div>
    <!-- <div class="logo-container">
      <router-link class="logo-link" to="/">
        <img :src="logo" class="navbar-logo" />
      </router-link>
    </div> -->
  </nav>
</template>

<script>
import { inject, ref } from 'vue'
import logoUrl from '@/assets/images/main-logo.png'
import burgerIcon from '@/assets/images/burger-icon.svg'
export default {
  name: 'NavbarComponent',
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
  min-height: 10%;
  background: transparent;
  position: relative;
  margin-bottom: 2%;
  z-index: 2;
}
.blend-link{
  color: #000;
  text-align: center;
  font-family: "DMSans";
  font-size: 15px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  letter-spacing: 1.5px;
  text-transform: uppercase;
} 
.logo-container{
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  width: 25%;
  position: relative;
  // margin-top: 3%;
  .logo-link{
    width: 15%;
  }
  .navbar-logo{
    width: 100%;
  }
}
.links-container{
  display: flex;
  flex-grow: 1;
  justify-content: space-between;
  height: 0px;
  padding: 0 2% 2% 2%;
  .burger-icon{
    height: 50px;
    width: 50px;
  }
  .burger-icon-container{
    width: 25%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    z-index: 11;
  }
  .blend-links-container{
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: 50%;
  }
  .inquire-container{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 25%;
  }
}
.links-container label {
  color: red;
  font-size: 16px;
}
</style>