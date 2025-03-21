<template>
  <div :class="brand.disabled ? 'disabled' : ''" class="link-tree">
    
    <!-- Navbar link -->
    <span 
      v-if="!brand.disabled"
      @click="goToPage(typedBrands.urlSlug, typedBrands.link)" 
      class="tree-route" 
      :class="currentBrandPage ? 'active': ''"
    >
      <OktoText :fontSize="16" v-if="typedBrands.name === 'Oktώ'" :isBold="boldOkto"/>
      <span :class="computedColor" v-else>{{typedBrands.name}}</span>
    </span>
    <span 
      v-else
      class="tree-route" 
      :class="currentBrandPage ? 'active': ''"
      @mouseover="hoverTrigger(true)"
      @mouseleave="hoverTrigger(false)"
    >
      <Transition name="slide-vertical" mode="out-in">
        <div v-if="!hovered" :class="computedColor">{{typedBrands.name}}</div>
        <div v-else :class="computedColor">coming soon</div>
      </Transition>
    </span>
    
    <!-- Dropdown Tree -->
    <div v-if="renderDropdownTree" class="dropdown-tree">
      <img :src="treeRoot" class="root"/>
      <div class="branches">
        <div v-for="(line, idx) in typedBrands" :key="idx" class="branch" :class="typedBrands.type">
          <img :src="computeSource(line.type)" class="branch-image"/>
          <router-link :to="line.linkTo" class="branch-link">
            {{ line.text }}
          </router-link>
        </div>
      </div>
    </div>
  
  </div>
</template>

<script>
import treeRoot from "@/assets/components/link-tree/tree-root.svg"
import treeNode from "@/assets/components/link-tree/tree-node.svg"
import treeLeftmost from "@/assets/components/link-tree/tree-leftmost.svg"
import treeRightmost from "@/assets/components/link-tree/tree-rightmost.svg"

import { onMounted, ref, watch } from 'vue'
import router from '@/router/index.js'
import { useRoute } from 'vue-router';

export default {
  name: 'LinkTree',
  props: {
    brand: {
      type: Array,
      required: true,
    },
    rightHalfOppositeColor: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup (props) {
    let currentBrandPage = ref(false)
    const route = useRoute()

    //Add type values to lines (branches), so correct branch image can be computed
    let renderDropdownTree = ref(false) // defaults to false since subcategories have been removed and tree is redundant for a single category.
    let typedBrands = [] 
    if(props.brand.lines){
      let lines = props.brand.lines
      typedBrands = lines.map((brand, idx) => {
        return {
          ...brand,
          type: idx === 0 ? 'first' : idx === lines.length -1 ? 'last' : 'inbetween',
        }
      })
      typedBrands.name = props.brand.name
      typedBrands.link = props.brand.linkTo
      typedBrands.urlSlug = props.brand.urlSlug
      // if(!props.brand.lines.length){
      //   renderDropdownTree.value = false
      // } else renderDropdownTree.value = true
    }
    
    //Check whether route matches component's brand, set to active if true
    let boldOkto = ref(false)
    watch(() => [
      route.name,
      route.params,
      route.path
    ], ([name, params, path]) => {
      console.log(`=== Route Change Detected ${props.brand.name}===`);
      console.log(`Path: ${path}`);
      console.log(`Route Name: ${name}`, !!name);
      console.log(`Route Params:`, params, !!params);
      
      console.log(`Has Name & Params: ${Boolean(name && params)}`);
      
      if (params?.selectedBrand !== undefined) {
        // console.log(`Selected Brand in Params: ${params.selectedBrand}`);
        // console.log(`Current Brand URL Slug: ${props.brand.urlSlug}`);
        // console.log(`Is Current Brand Page: ${props.brand.urlSlug === params.selectedBrand}`);
        if(props.brand.urlSlug === 'Okto' && route.params.selectedBrand === 'Okto'){
          console.log("BOLDING")
          boldOkto.value = true;
        }
      }
      
      if (name && params) {
        if (params.selectedBrand) {
          currentBrandPage.value = props.brand.urlSlug === params.selectedBrand;
        } else if (path === props.brand.linkTo) {
          currentBrandPage.value = true;
        } else{
          currentBrandPage.value = false
          boldOkto.value = false;
        }
      }
      
      // console.log(`Final State - currentBrandPage: ${currentBrandPage.value}`);
      // console.log("================================");
    }, { immediate: true });
    
    function goToPage(brand, linkTo){
      if(brand === 'All Products' || linkTo === '/all-products'){
        router.push({ name: 'AllProducts'}).catch(err => {
          console.error("error while routing", err)
        });
      } else {
        currentBrandPage.value = true
        router.push({ name: 'Product', params: { selectedBrand: brand}}).catch(err => {
          console.error("error while routing", err)
        });
      }
    }

    function computeSource(type){
      if(type === 'first'){
        return treeLeftmost
      } else if(type === 'last'){
        return treeRightmost
      } else return treeNode
    }
    
    let computedColor = ref(null)
    watch(() => props.rightHalfOppositeColor, (newVal) => {
      if(props.brand.name === 'Melculum' || props.brand.linkTo == '/all-products'){
        if(newVal){
          computedColor.value = 'black'
        }
      }
    })

    let hovered = ref(false)
    function hoverTrigger(val){
      hovered.value = val
    }
    return {
      treeRoot,
      treeNode,
      treeLeftmost,
      treeRightmost,
      renderDropdownTree,
      brand: props.brand,
      rightHalfOppositeColor: props.rightHalfOppositeColor,
      typedBrands,
      currentBrandPage,
      computeSource,
      computedColor,
      goToPage,
      hovered,
      hoverTrigger,
      boldOkto
    }
  }
}
</script>

<style lang="scss" scoped>
.link-tree{
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  
  transition: transform 0.3s ease-in-out;
  &:hover{
    transform: scale(1.02);
  }
  // &:hover{
  //   color: black;
  //   .dropdown-tree{
  //     opacity: 1;
  //     max-height: 500px;
  //     pointer-events: auto;
  //     .root{
  //       opacity: 1;
  //     }
  //     .branches{
  //       .branch{
  //         opacity: 1;
  //         pointer-events: auto;
  //         .branch-link{
  //           pointer-events: auto;
  //           &:hover{
  //             font-size: 17px;
  //           }
  //         }
  //         &.first, &.inbetween, &.last {
  //           pointer-events: auto;
  //           opacity: 1;
  //         }
  //       }
  //     }
  //   }
  // }
  .dropdown-tree{
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    max-height: 0;
    pointer-events: none;
    transition: all ease-in 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    .root{
      opacity: 0;
      transition: opacity ease-in 0.2s 0.1s;
    }
    .branches{
      display: flex;
      .branch{
        // max-width: 150px;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        opacity: 0;
        pointer-events: none;
        // Define the transition for both hover and unhover states
        transition: opacity 0.2s ease-in-out;
        .branch-link{
          pointer-events: none;
          white-space: nowrap;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          color: #000;
          text-align: center;
          font-family: "DMSans";
          font-size: 15px;
          font-style: normal;
          font-weight: 400;
          line-height: normal;
          letter-spacing: 1.5px;
          text-transform: uppercase; 
          transition: font-size 0.2s ease;
          display: inline-block;
          z-index: 100;
        }
        img{
          // max-width: 150px;
          margin-left: -0.3px;
          margin-right: -0.3px;
          // width: 100%;
        }
        &.first, &.last{
          pointer-events: none;
          opacity: 0;
          transition: all ease-in 0.45s 0.2s;
        }
        &.inbetween{
          pointer-events: none;
          opacity: 0;
          transition: all ease-in 0.3s 0.2s;
        }
      }
    }
  }
  .tree-route{
    color: var(--navbar-color, #000);
    text-align: center;
    font-family: "DMSans";
    font-size: 15px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    text-shadow: var(--navbar-text-shadow);
    position: relative;
    cursor: pointer;
    
    &.active{
      font-weight: 700 !important;
      .okt, .omega{
        font-weight: 700 !important;
      }
    }
    .okto-text{
      line-height: 0px !important;
    }
    span{
      &.black{
        color: black !important;
        text-shadow: none !important;
      }
    }
    @media(min-width: 1981px){
      font-size: 20px;
    }
  }
  &.disabled{
    // pointer-events: none !important;
    .dropdown-tree{
      pointer-events: none !important;
    }
  }
}

.slide-vertical-enter-active,
.slide-vertical-leave-active {
  transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
}

.slide-vertical-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.slide-vertical-enter-to {
  transform: translateY(0);
  opacity: 1;
}

.slide-vertical-leave-from {
  transform: translateY(0);
  opacity: 1;
}

.slide-vertical-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>