<template>
  <div :class="brand.disabled ? 'disabled' : ''" class="link-tree">
    <span @click="goToPage(typedBrands.urlSlug)" class="tree-route" :class="currentBrandPage ? 'active': ''">
      {{typedBrands.name}}
    </span>
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

import { ref, watch } from 'vue'
import router from '@/router/index.js'
import { useRoute } from 'vue-router';

export default {
  name: 'LinkTree',
  props: {
    brand: {
      type: Array,
      required: true,
    }
  },
  setup (props) {
    let currentBrandPage = ref(false)
    const route = useRoute()

    //Add type values to lines (branches), so correct branch image can be computed
    let renderDropdownTree = ref(false)
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
      typedBrands.link = props.brand.linkto
      typedBrands.urlSlug = props.brand.urlSlug
      if(!props.brand.lines.length){
        renderDropdownTree.value = false
      } else renderDropdownTree.value = true
    }
    
    //Check whether route matches component's brand, set to active if true
    watch(() => [
      route.name,
      route.params
    ], ([name, params]) => {
      if(name && params){
        if(params.selectedBrand){
          if(props.brand.name === params.selectedBrand){
            currentBrandPage.value = true
          } else {
            currentBrandPage.value = false
          }
        }
      }
    }, { immediate: true });

    function goToPage(brand){
      // console.log("going to:", brand)
      if(brand === 'All Products'){
        router.push({ name: 'AllProducts'}).catch(err => {
          console.log("error while routing", err)
        });
      } else {
        currentBrandPage.value = true
        router.push({ name: 'Product', params: { selectedBrand: brand}}).catch(err => {
          console.log("error while routing", err)
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

    return {
      treeRoot,
      treeNode,
      treeLeftmost,
      treeRightmost,
      renderDropdownTree,
      brand: props.brand,
      typedBrands,
      currentBrandPage,
      computeSource,
      goToPage
    }
  }
}
</script>

<style lang="scss" scoped>
.link-tree{
  position: relative;
  &:hover{
    color: black;
    .dropdown-tree{
      opacity: 1;
      max-height: 500px;
      pointer-events: auto;
      .root{
        opacity: 1;
      }
      .branches{
        .branch{
          opacity: 1;
          pointer-events: auto;
          .branch-link{
            pointer-events: auto;
            &:hover{
              font-size: 17px;
            }
          }
          &.first, &.inbetween, &.last {
            pointer-events: auto;
            opacity: 1;
          }
        }
      }
    }
  }
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
    cursor: pointer;
    &.active{
      font-weight: 700;
    }
  }
  &.disabled{
    pointer-events: none !important;
    .dropdown-tree{
      pointer-events: none !important;
    }
  }
}
</style>