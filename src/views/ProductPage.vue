<template>
  <div class="product-page-container">
    <span class="floating-text">
      {{ currentFlavour.name }}
    </span>

    <div class="series-selection">
      <div class="pushdown" style="height: 35%; width: 100%;"></div>
      <div class="series-item-container">
        <div
          class="series-item"
          ref="seriesItem"
          v-for="(brandProductLine, idx) in brandProductLines"
          :class="currentProductLine.name === brandProductLine.name ? 'selected' : ''"
          @click="selectProductLine(brandProductLine.name)"
          :key="idx"
        >
          <span class="series-item-text">
            {{ brandProductLine.name }}
          </span>
          <div
            class="stylish-pointer"
            :style="currentProductLine.name === brandProductLine.name ? 'display: flex;' : 'display: none;'"
          >
            <img :src="pointerLine" class="pointer-line" />
            <img :src="pointerCircle" class="pointer-circle" />
          </div>
        </div>
      </div>
      <div class="selected-description">
        <!-- <h1 class="description-heading">{{ currentFlavour.name }}</h1> -->
        <h2 class="description-subheading">{{ currentFlavour.tagline }}</h2>
        <span class="description-text">{{ currentFlavour.description }}</span>
      </div>
      <div class="technical-sheet">
        Technical Sheet <img :src="downloadIcon" class="download-sheet" />
      </div>
    </div>

    <div class="product-viewer" ref="productViewer">
      <div class="pushdown" style="height: 15%; width: 100%;"></div>
      <ProductScene />
    </div>

    <div class="blend-selection">
      <div class="brand-selection">
        <img @click="switchBrand()" class="brand-image" :src="computedLogo"/>
      </div>
      <span
        class="blend"
        ref="blendItem"
        :class="flavour.name === currentFlavour.name ? 'selected' : ''"
        v-for="(flavour, idx) in productLineFlavours"
        :key="idx"
        @click="selectFlavour(flavour)"
      >
        <span class="blend-text">
          {{ flavour.name }}
        </span>
        <div
          class="stylish-pointer-left"
          :style="
          flavour.name === currentFlavour.name
              ? 'display: flex;'
              : 'display: none;'
          "
        >
          <img :src="pointerCircle" class="pointer-circle" />
          <img :src="pointerLine" class="pointer-line" />
        </div>
      </span>
    </div>
  </div>
</template>

<script>
import { onBeforeMount, onMounted, ref, toRaw, computed, watch, inject } from "vue";
import { useWindowSize } from "@vueuse/core";
import { useRoute } from 'vue-router';

import ProductScene from "../components/ProductScene.vue";

import downloadIcon from "@/assets/pages/product-page/download-icon.png";
import pointerLine from "@/assets/pages/product-page/pointer-line.svg";
import pointerCircle from "@/assets/pages/product-page/pointer-circle.svg";

import brandConfigs from "@/assets/brand-information/index.js"

export default {
  components: { ProductScene },
  props: ['line', 'selectedBrand'],

  setup(props) {
    const router = useRoute();
    console.log("SELECTEDLINE AND BRAND", router.query.line, props.selectedBrand)
    let emitter = inject('emitter')

    //receives distance of Mesh from Canvas ends
    emitter.on('meshEdges', (meshEdges)=>{
      calculateLineWidths(meshEdges)
    })

    const productViewer = ref()
    const blendItem = ref()
    const seriesItem = ref()
    

    let currentFlavour = ref(null)
    let currentProductLine = ref(null)
    let selectedBrand = ref(null); // Okto / Haa / Melculum
    let brandProductLines = ref(null);
    let productLineFlavours = ref(null);

    if(props.selectedBrand){
      selectedBrand.value = brandConfigs[props.selectedBrand]
      brandProductLines = ref(selectedBrand.value.brandProductLines)
      if(router.query?.line){
        currentProductLine.value = selectedBrand.value.brandProductLines[router.query.line]
      }
    } else {
      selectedBrand.value = brandConfigs[0]
      brandProductLines = ref(selectedBrand.value.brandProductLines)
      currentProductLine.value = brandProductLines.value['Blends']
    }

    productLineFlavours = computed(() => currentProductLine.value.flavours)
    currentFlavour.value = productLineFlavours.value[0]

    
    let computedLogo = computed(() => {
      switch(selectedBrand.value.brand){
        case 'Okto':
          const imgUrl = new URL('@/assets/pages/tabs/tab1-larger.png', import.meta.url).href;
          return imgUrl;
        case 'HAA':
          console.log("returnign HAA")
          const imgUrl2 = new URL('@/assets/pages/tabs/tab2-larger.png', import.meta.url).href;
          return imgUrl2;
      }
    })

    watch(productLineFlavours, (newFlavours) => {
      if (newFlavours.length > 0) {
        currentFlavour.value = newFlavours[0];
      } else {
        currentFlavour.value = null;
      }
    });

    watch(selectedBrand, (newBrand) => {
      brandProductLines.value = newBrand.brandProductLines
      currentProductLine.value = brandProductLines.value['Blends']
    })

    function selectProductLine(productLine) {
      if (productLine !== currentProductLine.value.name) {
        currentProductLine.value = brandProductLines.value[productLine];
      } else 
      return
    }
    function selectFlavour(flavour) {
      if(currentFlavour.value !== flavour){
        currentFlavour.value = flavour;
      } else return
    }

    function switchBrand(){
      if(selectedBrand.value.brand == brandConfigs['Okto'].brand){
        selectedBrand.value = brandConfigs['HAA']
      } else selectedBrand.value = brandConfigs['Okto']
    }

    function calculateLineWidths(edgeCoordinates){
      console.log("Calculating line widths, edgeCoordinates:", edgeCoordinates)
      if (productViewer.value) {

        const circleDetraction = 40; // Account for circle width, and imprecision in calculation
        const productViewerWidth = productViewer.value.offsetWidth;
        const productViewerPositionalData = productViewer.value.getBoundingClientRect()
        console.log("productViewerWith", productViewerWidth)
        //Distances
        let leftLineFromCanvas = productViewerPositionalData.left  - seriesItem.value[0].getBoundingClientRect().right
        let rightLineFromCanvas = blendItem.value[0].getBoundingClientRect().left - productViewerPositionalData.right
        console.log("Distances from line source to canvas", leftLineFromCanvas, rightLineFromCanvas)
        let leftLineDistance = leftLineFromCanvas + edgeCoordinates.leftEdge - circleDetraction
        let rightLineDistance = rightLineFromCanvas + (productViewerWidth - edgeCoordinates.rightEdge - circleDetraction)
        console.log("leftLineDistance, rightLine Distance", leftLineDistance, rightLineDistance)

        //Set variable value to calculated distance
        document.documentElement.style.setProperty('--pointer-line-width', `${leftLineDistance}px`);
        document.documentElement.style.setProperty('--pointer-line-right-width', `${rightLineDistance}px`);
        return
      }
      // if (productViewer.value) { //Calculated stylish-pointer-line width to end at pointerWidth% of product-viewer width
      //   const productViewerWidth = productViewer.value.offsetWidth;
      //   const productViewerPositionalData = productViewer.value.getBoundingClientRect()
      //   const pointerWidth = productViewerWidth * 0.38; // width % of product-viewer
      //   const pointerRightSideWidth = productViewerWidth *0.35;
      //   const width1440 = productViewerWidth * 0.25;
      //   const widthRight1440 = productViewerWidth *0.25;
      //   document.documentElement.style.setProperty('--pointer-line-width-1440', `${width1440}px`);
      //   document.documentElement.style.setProperty('--pointer-line-right-width-1440', `${widthRight1440}px`);
      //   document.documentElement.style.setProperty('--pointer-line-width', `${pointerWidth}px`);
      //   document.documentElement.style.setProperty('--pointer-line-right-width', `${pointerRightSideWidth}px`);
      //   if(seriesItem.value){
      //     let productLinePositionaldata = seriesItem.value[0].getBoundingClientRect();
      //     let delta1 = productViewerPositionalData.left - productLinePositionaldata.right
      //     document.documentElement.style.setProperty('--pointer-line-width-1200', `${delta1}px`);
      //   }
      //   if(blendItem.value){
      //     let flavourPositionalData = blendItem.value[0].getBoundingClientRect();
      //     let delta2 = flavourPositionalData.left - productViewerPositionalData.right
      //     document.documentElement.style.setProperty('--pointer-line-right-width-1200', `${delta2}px`);
      //   }
      // }
    }
    
    return {
      downloadIcon,
      pointerCircle,
      pointerLine,
      productViewer,
      blendItem,
      seriesItem,
      selectedBrand,
      brandProductLines,
      productLineFlavours,
      currentFlavour,
      currentProductLine,
      computedLogo,
      selectProductLine,
      selectFlavour,
      switchBrand,
    };
  },
};
</script>

<style lang="scss" scoped>
.product-page-container {
  position: relative;
  justify-content: space-between;
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 30% 40% 30%;
  flex-grow: 1 !important;

  .floating-text {
    z-index: 1;
    color: rgba(0, 0, 0, 0.1);
    font-family: "DMSans";
    max-width: 70%;
    font-size: 100px;
    font-style: normal;
    font-weight: 700;
    letter-spacing: 5px;
    text-transform: uppercase;
    text-align: left;
    position: absolute;
    left: 0%;
    top: 5%;
    animation: fadeIn 0.5s;
    -webkit-animation: fadeIn 5s;
    -moz-animation: fadeIn 5s;
    -o-animation: fadeIn 5s;
    -ms-animation: fadeIn 5s;
    @media(max-width: 1980px){
      font-size: 75px;
      max-width: 72%;
    }
    @media(min-width: 1600px){
      line-height: 108px;
    }
    @media(max-width: 1440px){
      font-size: 75px;
      max-width: 75%;
    }
    @media(max-width: 1366px){
      font-size: 65px;
      max-width: 95%;
    }
  }

  .blend-selection {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    // justify-content: center;
    .blend {
      position: relative;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      width: 100%;
      margin-bottom: 15px;
      width: 80%;
      .stylish-pointer-left {
        position: absolute;
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: auto;
        .pointer-line {
          width: var(--pointer-line-right-width);
        }
        .pointer-circle {
          width: 80px;
        }
      }
    }
  }

  .series-selection {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    // justify-content: center;
    // padding-top: 55%;
    width: 85%;
    .series-item-container{
      display: flex;
      flex-direction: column;
      width: 90%;
      .series-item {
        position: relative;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        width: 100%;
        .series-item-text{
            
        }
        .stylish-pointer {
          position: absolute;
          left: 100%; /* Starts at the end of the series-item */
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9;
          .pointer-line {
            width: var(--pointer-line-width);
          }
          .pointer-circle {
            width: 80px;
          }
        }
      }
    }

    .selected-description {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: start;
      .description-heading {
        color: #000;
        font-family: "DMSans";
        font-size: 35px;
        font-style: normal;
        font-weight: 700;
        letter-spacing: 3px;
        min-height: 110px;
      }
      .description-subheading {
        color: #000;
        font-family: "Didact Gothic";
        font-size: 24px;
        font-style: normal;
        font-weight: 400;
        letter-spacing: 2px;
        text-transform: capitalize;
      }
      .description-text {
        color: #000;
        font-family: "DMSans";
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
      }
    }

    .technical-sheet {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;
      color: #000;
      font-family: "DMSans";
      font-size: 20px;
      font-style: normal;
      font-weight: 400;
      letter-spacing: 1.2px;
      text-transform: capitalize;
      margin-top: 15px;
      justify-self: flex-end !important;
      .download-sheet {
        width: 20px;
        height: 20px;
        margin-left: 15px;
        cursor: pointer;
        transition: all ease-in-out 0.2s;
        &:hover{
          width: 22px;
          height: 22px;
        }
      }
    }
  }

  .series-selection,
  .blend-selection {
    .blend,
    .series-item {
      color: #000;
      font-family: "DMSans";
      font-size: 15px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
      letter-spacing: 1px;
      text-transform: uppercase;
      transition: font-size 0.15s ease;
      text-align: left;
      min-height: 25px;
      cursor: pointer;
      z-index: 6;
      &:hover, &.selected {
        font-weight: 700;
      }
    }
  }

  .product-viewer {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    z-index: 10;
    .product-image {
      max-height: 60vh;
    }
  }
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.brand-selection{
  height: 40%;
  width: 100%;
  .brand-image{
    width: 80%;
    margin: auto;
    opacity: 0.3;
    cursor: pointer;
  }
}
</style>
