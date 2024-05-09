<template>
  <div class="link-tree">
    <router-link class="tree-route" :to="'product'">
      {{typedCategories.main}}
    </router-link>
    <div class="dropdown-tree">
      <img :src="treeRoot" class="root"/>
      <div class="branches">
        <div v-for="(subCategory, idx) in typedCategories" :key="idx" class="branch" :class="subCategory.type">
          <img :src="computeSource(subCategory.type)" class="branch-image"/>
          <router-link :to="'test'" class="branch-link">
            {{subCategory.text}}
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
export default {
  name: 'LinkTree',
  props: {
    category: {
      type: Array,
      required: true,
    }
  },
  setup (props) {
    console.log("PROPS", props.category)
    let typedCategories = [] 
    if(props.category.subCategories){
      let subCategories = props.category.subCategories
      typedCategories = subCategories.map((category, idx) => {
        return {
          ...category,
          type: idx === 0 ? 'first' : idx === subCategories.length -1 ? 'last' : 'inbetween',
        }
      })
      typedCategories.main = props.category.main
      typedCategories.link = props.category.linkto
      console.log("TYPED CATS", typedCategories)
    }
    function computeSource(type){
      if(type === 'first'){
        return treeLeftmost
      } else if(type === 'last'){
        return treeRightmost
      } else return treeNode
    }
    return {treeRoot, treeNode, treeLeftmost, treeRightmost, typedCategories, computeSource}
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
}
</style>