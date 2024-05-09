<template>
  <nav class="navbar">
    <div class="links-container">
      <div class="burger-icon-container">
        <!-- <img :src="sidebar" @click="toggleSidebar" class="burger-icon"/> -->
      </div>
      <div class="blend-links-container">
        <LinkTree v-for="category in categories" :category="category"/>
        <!-- <router-link class="blend-link" to="/">
          Okto
        </router-link>
        
        <router-link class="blend-link" to="/">
          Honey Apiary Academy
        </router-link>
        
        <router-link class="blend-link" to="/">
          Melculum
        </router-link> -->
      </div>
      <div class="inquire-container">
        <a class="blend-link" href="mailto:vlade_nikolovski@hotmail.com" target="_blank">
          Inquire
        </a>
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
    let categories = [
      {
        main: 'Okto',
        subCategories: [
          {
            text: 'Monofloral series',
            linkTo: '/okto/monofloral'
          },
          {
            text: 'Blend series',
            linkTo: '/okto/blend'
          },
          {
            text: 'All products',
            linkTo: 'products'
          }
        ]
      },
      {
        main: 'Honey Apiary Academy',
        subCategories: [
          {
            text: 'Monofloral series',
            linkTo: '/haa/monofloral'
          },
          {
            text: 'Blend series',
            linkTo: '/haa/blend'
          },
          {
            text: 'All products',
            linkTo: 'products'
          }
        ]
      },
      {
        main: 'Melculum',
        subCategories: [
          {
            text: 'Monofloral series',
            linkTo: '/melculum/monofloral'
          },
          {
            text: 'Blend series',
            linkTo: '/melculum/blend'
          },
          {
            text: 'All products',
            linkTo: 'products'
          }
        ]
      }
    ]
    function toggleSidebar(){
      emitter.emit('toggleSidebar')
    }
    function testButton(){
      count.value++
      console.log('counting up', count.value)
    }
    console.log('categ', categories)
    return { logo: logoUrl, sidebar: burgerIcon, toggleSidebar, testButton, count, categories };
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
    cursor: pointer;
  }
  .burger-icon-container{
    width: 25%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    z-index: 11;
    :hover{
      transform: scale(1.1);
      transition: all ease-in-out 0.3s;
    }
    .burger-icon{
      position: absolute;
      top: 2%;
      left: 2%;
    }
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