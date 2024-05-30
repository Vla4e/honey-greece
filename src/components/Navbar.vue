<template>
  <nav class="navbar">
    <div class="links-container">
      <div class="burger-icon-container">
        <!-- <img :src="sidebar" @click="toggleSidebar" class="burger-icon"/> -->
      </div>
      <div class="blend-links-container">
        <LinkTree v-for="brand in brands" :brand="brand"/>
      </div>
      <div class="inquire-container">
        <span class="blend-link" @click="toggleContactForm()">
          Inquire
        </span>
      </div>
      <router-link class="logo-link" to="/">
        <img :src="homeIcon" class="navbar-logo" />
      </router-link>
    </div>
  </nav>
</template>

<script>
import { inject, ref } from 'vue'
import logoUrl from '@/assets/images/main-logo.png'
import burgerIcon from '@/assets/images/burger-icon.svg'
import homeIcon from '@/assets/images/home-icon.svg'

import brandConfigs from "@/assets/brand-information/index.js"

export default {
  name: 'NavbarComponent',
  setup() {
    let emitter = inject('emitter')
    let brands = []

    //"Map" brandConfigs to brands variable
    Object.keys(brandConfigs).forEach((brand) => {
      let tempBrand = brandConfigs[brand]
      brands.push({
        name: tempBrand.fullBrandName,
        urlSlug: tempBrand.brand,
        linkTo: `/product/${tempBrand.brand}?line=${tempBrand.productLines[0]}`,
        disabled: false,
        lines: tempBrand.productLines.map((productLine) => {
          return {
            text: productLine,
            linkTo: `/product/${tempBrand.brand}?line=${productLine}`
          }
        })
      })
    })
    let tempBrand = [
      {
        name: 'Melculum',
        linkTo: '',
        disabled: true,
        lines: [
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
      },
      {
        name: 'All Products',
        disabled: false,
        linkTo: '/all-products',
        lines: []
      }
    ]
    tempBrand.forEach((brand) => {
      brands.push(brand)
    })

    function toggleContactForm(){
      console.log("TOGGLING")
      emitter.emit('toggleContactForm')
    }
    return { 
      logo: logoUrl,
      homeIcon,
      sidebar: burgerIcon,
      brands,
      toggleContactForm
    };
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
  // margin-bottom: 2%;
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
  cursor: pointer;
} 
.logo-link{
  display: flex;
  justify-content: center;
  align-items: center;
  img{
    width: 26px;
  }
}
.logo-container{
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  width: 25%;
  position: relative;
  // margin-top: 3%;
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