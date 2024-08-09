<template>
  <nav class="navbar" :class="navbarFloating ? 'floating': ''">
    <div class="links-container">

      <div class="burger-icon-container">
        <BurgerMenuIcon @click="toggleSidebar" class="burger-icon"/>
        <!-- <img :src="sidebar" @click="toggleSidebar" class="burger-icon"/> -->
      </div>

      <div v-if="!isMobile && (!showSidebar || isMobile)" class="blend-links-container">
        <LinkTree v-for="brand in brands" :brand="brand"/>
      </div>

      <div v-if="!isMobile && (!showSidebar || isMobile)" class="inquire-container">
        <span class="blend-link" @click="toggleContactForm()">
          Inquire
        </span>
      </div>

      <router-link class="logo-link home" to="/">
        <img v-if="currentNavbarColor === 'white'" :src="homeIconWhite" class="home-icon"/>
        <img v-else :src="homeIcon" class="home-icon" />
      </router-link>
    </div>
  </nav>
</template>

<script>
import { inject, ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useNavbarStore } from '@/store/navbar.js'
import { useSidebarStore } from '@/store/sidebar.js'

import logoUrl from '@/assets/images/main-logo.png'
import burgerIcon from '@/assets/images/burger-icon.svg'

import homeIcon from '@/assets/images/home-icon.svg'
import homeIconWhite from '@/assets/images/home-icon-white.svg'

import brandConfigs from "@/assets/brand-information/index.js"

export default {
  name: 'NavbarComponent',
  setup() {

    let emitter = inject('emitter')
    const { isMobile } = inject('screenSize')

    const sidebarStore = useSidebarStore()
    let showSidebar = computed(() => sidebarStore.getSidebarStatus)
    let localSidebar = ref(false)
    
    const navbarStore = useNavbarStore();

    let navbarFloating = computed(() => navbarStore.getNavbarFloating)
    //Nav color
    let currentNavbarColor = computed(()  =>  {
      // console.log("COMPUTING", isMobile, navbarStore.getNavbarColor)
      if(isMobile){
        return navbarStore.getNavbarColor.mobile
      } else return navbarStore.getNavbarColor.desktop
    })

    let originalNavbarColor = ref(currentNavbarColor.value);

    watch(currentNavbarColor, (newColor) => {
      document.documentElement.style.setProperty('--navbar-color', newColor);
    });

    //TODO: map brandConfigs to brands variable
    let brands = []
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
            linkTo: '/all-products'
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
      // console.log("Called toggle contact form")
      emitter.emit('toggleContactForm')
    }

    function toggleSidebar() {
      emitter.emit('toggleSidebar');
      sidebarStore.setSidebarStatus(!showSidebar.value)
      // showSidebar.value = !showSidebar.value;
      if (showSidebar.value) {
        originalNavbarColor.value = currentNavbarColor.value; // Store the original color
        navbarStore.setNavbarColor({desktop: 'black', mobile: 'white'});
        // switchTextColor('black');
      } else {
        navbarStore.setNavbarColor({desktop: originalNavbarColor.value, mobile: originalNavbarColor.value}); // Revert to original color
        // switchTextColor(originalNavbarColor.value);
      }
    }

    // function switchTextColor(colorString = 'black'){
    //   // console.log("Switching color 1111111111111111111111111111111111111111", colorString)
    //   document.documentElement.style.setProperty('--navbar-color', `${colorString}`);
    //   currentNavbarColor.value = colorString === 'black' ? 'black' : 'white'
    // }

    onMounted(() => {
      // emitter.on('switchTextColor', switchTextColor)
    })

    onUnmounted(() => {
      // emitter.off('switchTextColor')
    })
    return { 
      logo: logoUrl,
      homeIcon,
      homeIconWhite,
      currentNavbarColor,
      sidebar: burgerIcon,
      showSidebar,
      brands,
      navbarFloating,
      toggleContactForm,
      toggleSidebar,
      isMobile
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
  @media(max-width: 767px){
    height: 80px;
  }
  background: transparent;
  position: relative;
  // margin-bottom: 2%;
  z-index: 2;
  background: linear-gradient(to bottom, rgba(128, 128, 128, 0.1) 0%, transparent 100%);
  &.floating{
    min-height: 80px;
    height: 80px;
    position: fixed;
    top: 0;
    left: 0; // Ensuring it aligns to the left edge
    right: 0; // Ensuring it spans the entire width
    width: 100%; // Overrides any other width properties
    background: linear-gradient(to bottom, rgba(128, 128, 128, 0.7) 0%, rgba(128, 128, 128, 0) 100%);
    // background: red;
  }
}
.blend-link{
  color: var(--navbar-color, #000);
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
  .home-icon{
    width: 100%;
  }
}
.links-container{
  display: flex;
  flex-grow: 1;
  justify-content: space-between;
  height: 100%;
  padding: 2% 4% 2% 4%;
  .burger-icon{
    height: 35px;
    width: 35px;
    cursor: pointer;
  }
  .burger-icon-container{
    width: 25%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    z-index: 11;
    @media(max-width: 767px){
      // justify-content: center;
      .burger-icon{
        width: 30px;
        height: 30px;
        z-index: 100000;
      }
    }
    :hover{
      transform: scale(1.1);
      transition: all ease-in-out 0.3s;
    }
    .burger-icon{
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