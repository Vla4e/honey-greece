<template>
  <div class="product-page-container">
    <!-- <span class="floating-text" ">
      {{ currentFlavour.name }}
    </span> -->
    <transition name="fade" mode="out-in">
      <span class="floating-text" :style="{ 'font-size': computedTextLength + 'px' }" :key="currentFlavour.name">
        {{ currentFlavour.name }}
      </span>
    </transition>

    <div class="series-selection">
      <div class="pushdown" style="height: 35%; width: 100%;"></div>
      <div class="series-item-container">
        
        <!-- <div class="brand-selection-test">
          <img @click="switchBrand()" class="arrow arrow-up" :src="arrow"/>
          <img class="brand-image" :src="computedLogo"/>
          <img @click="switchBrand()" class="arrow arrow-down" :src="arrow"/>
        </div> -->
        <div class="series-items">
          <div
            class="series-item"
            ref="seriesItem"
            v-for="(brandProductLine, idx) in brandProductLines"
            :class="isSelected(brandProductLine)"
            @click="selectProductLine(brandProductLine.name)"
            :key="idx"
          >
            <span class="series-item-text">
              {{ brandProductLine.name }}
            </span>
            <div
              class="stylish-pointer"
              :style="displayStyle(brandProductLine)"
            >
              <img ref="pointerline" :src="pointerLine" class="pointer-line" />
              <img :src="pointerCircle" class="pointer-circle" />
            </div>
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
        <!-- <img @click="switchBrand()" class="brand-image" :src="computedLogo"/> -->
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
          class="stylish-pointer-to-left"
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
import { onUnmounted, onMounted, ref, toRaw, computed, watch, inject } from "vue";
import { useWindowSize } from "@vueuse/core";
import { useRoute } from 'vue-router';

import ProductScene from "../components/ProductScene.vue";

import downloadIcon from "@/assets/pages/product-page/download-icon.png";
import pointerLine from "@/assets/pages/product-page/pointer-line.svg";
import pointerCircle from "@/assets/pages/product-page/pointer-circle.svg";
import arrow from "@/assets/pages/product-page/arrow.svg";

import brandConfigs from "@/assets/brand-information/index.js"
import { useProductStore } from '@/store/product.js'

export default {
  components: { ProductScene },
  props: ['line', 'selectedBrand'],

  setup(props) {
    const route = useRoute();

    const { width: windowWidth, height: windowHeight } = useWindowSize();
    
    const productStore = useProductStore()
    //receives distance of Mesh from Canvas ends
    let emitter = inject('emitter')
    emitter.on('meshEdges', (meshEdges)=>{
      calculateLineWidths(meshEdges)
    })
    onUnmounted(() => {
      emitter.off('meshEdges')
    })
    const productViewer = ref()
    const blendItem = ref()
    const seriesItem = ref()
    
    // onBeforeMount(()=>{
    //   console.log("Before mount")
    // })
    // onMounted(() => {
    //   console.log("Mounting")
    // })


    let currentFlavour = ref(null)
    let currentProductLine = ref(null)
    let selectedBrand = ref(null); // Okto / Haa / Melculum string
    let brandProductLines = ref(null);
    let productLineFlavours = ref(null);

    if(props.selectedBrand){
      selectedBrand.value = brandConfigs[props.selectedBrand]
      brandProductLines = ref(selectedBrand.value.brandProductLines)
      console.log("route query", route.query?.line)
      if(route.query?.line){
        currentProductLine.value = brandProductLines.value[route.query.line]
      } else { // Default if no selectedLine was passed as query
        currentProductLine.value = selectedBrand.value.brandProductLines['Blends']
      }
    } else { //Default to Okto/Blends if no prop was passed as selectedBrand
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
    
    let computedTextLength = computed(()=>{
      let nameLength = currentFlavour.value.name.length
      let fontSize;
      switch(true){
        case (nameLength > 28):{
          fontSize = 80
          break;
        }
        case (nameLength < 12):{
          fontSize = 130
          break;
        }
        case (nameLength < 16):{
          fontSize = 120
          break;
        }
        case (nameLength < 20):{
          fontSize = 110
          break;
        }
        case (nameLength < 22):{
          fontSize = 100
          break;
        }
        case (nameLength <= 24):{
          fontSize = 100
          break;
        }
        case (nameLength < 28):{
          fontSize =  90;
          break;
        }
        default: fontSize = 100;
      }
      if(windowWidth.value <= 1440){
        fontSize -= 20
      }
      // console.log("Calculated fontsize", fontSize)
      return fontSize
    })

    const isSelected = function (brandProductLine){
      // console.log("HUH", toRaw(brandProductLine.name), currentProductLine.value.name, toRaw(brandProductLine.name) === currentProductLine.value.name)
      return currentProductLine.value.name === brandProductLine.name ? 'selected' : '';
    }

    const displayStyle = function (brandProductLine) {
      // console.log("DUH", toRaw(brandProductLine.name), currentProductLine.value.name)
      return { display: currentProductLine.value.name === brandProductLine.name ? 'flex' : 'none' };
    };

    watch(() => route.params, (params) => {
      if(params && params.selectedBrand){
        // console.log("PARAMS === >", params.selectedBrand)
        if(params.selectedBrand !== selectedBrand.value.brand){
          console.log("Not the same param")
          switchBrand()
        }
      }
    }, { immediate: true });

    watch(productLineFlavours, (newFlavours) => {
      if (newFlavours.length > 0) {
        currentFlavour.value = newFlavours[0];
      } else {
        currentFlavour.value = null;
      }
    });

    watch(selectedBrand, (newBrand) => {
      // console.log("newBrand", toRaw(newBrand))
      brandProductLines.value = newBrand.brandProductLines
      currentProductLine.value = brandProductLines.value[route.query?.line ? route.query.line : 'Monoflorals']
      if(newBrand){
        productStore.setBrand({name: newBrand.brand, urlSlug: newBrand.urlSlug })
      }
    }, {immediate: true})
    watch(currentProductLine, (newProductLine) => {
      // console.log("newProductLine", toRaw(newProductLine))
      // console.log("currentProductLine", toRaw(currentProductLine))
      if(newProductLine){
        productStore.setProductLine({name: newProductLine.name, urlSlug: newProductLine.urlSlug })
      }
    }, {immediate: true})
    watch(currentFlavour, (newFlavour) => {
      // console.log("newFlavour", toRaw(newFlavour))
      if(newFlavour){
        productStore.setFlavour({name: newFlavour.name, urlSlug: newFlavour.urlSlug })
      }
    }, {immediate: true})
    
    function selectProductLine(productLine) {
      if (productLine !== currentProductLine.value.name) {
        console.log("Changing productLine Value", productLine)
        currentProductLine.value = brandProductLines.value[productLine];
      } else 
      return
    }
    function selectFlavour(flavour) {
      if(currentFlavour.value !== flavour){
        currentFlavour.value = flavour;
      } else return
    }

    function switchBrand() {
      console.log("Switching Brand");
      // Determine the next brand
      const nextBrandKey = selectedBrand.value.brand === brandConfigs['Okto'].brand ? 'HAA' : 'Okto';
      const nextBrand = brandConfigs[nextBrandKey];

      // Update the selectedBrand
      selectedBrand.value = nextBrand;

      // Set the currentProductLine to the default line or the one specified in the route query if applicable
      if (route.query?.line && nextBrand.brandProductLines[route.query.line]) {
        // Check if the next brand has the line specified in the query
        currentProductLine.value = nextBrand.brandProductLines[route.query.line];
      } else {
        // Default to 'Blends' or another default if 'Blends' is not available
        currentProductLine.value = nextBrand.brandProductLines['Blends'] || nextBrand.brandProductLines[Object.keys(nextBrand.brandProductLines)[0]];
      }
      console.log("CPL", toRaw(currentProductLine.value))
    }

    function calculateLineWidths(edgeCoordinates){
      console.log("Got EdgeDistance", edgeCoordinates.leftEdge, edgeCoordinates.rightEdge)
      if (productViewer.value) {

        const circleDetraction = 40; // Account for circle width, and imprecision in calculation
        const productViewerWidth = productViewer.value.offsetWidth;
        const productViewerPositionalData = productViewer.value.getBoundingClientRect()
        //Distances
        let leftElementToCanvas = productViewerPositionalData.left  - seriesItem.value[0].getBoundingClientRect().right
        let rightElementToCanvas = blendItem.value[0].getBoundingClientRect().left - productViewerPositionalData.right
        let leftLineDistance = leftElementToCanvas + edgeCoordinates.leftEdge - circleDetraction
        let rightLineDistance = rightElementToCanvas + edgeCoordinates.rightEdge - circleDetraction

        //Set variable value to calculated distance
        document.documentElement.style.setProperty('--pointer-line-width', `${leftLineDistance}px`);
        document.documentElement.style.setProperty('--pointer-line-right-width', `${rightLineDistance}px`);
        return
      }
    }
    
    return {
      downloadIcon,
      pointerCircle,
      pointerLine,
      arrow,
      productViewer,
      blendItem,
      seriesItem,
      selectedBrand: selectedBrand,
      brandProductLines,
      productLineFlavours,
      currentFlavour,
      currentProductLine,
      computedLogo,
      computedTextLength,
      isSelected,
      displayStyle,
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
  // justify-content: space-between;
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 30% 40% 30%;
  flex-grow: 1 !important;

  .floating-text {
    z-index: 1;
    color: rgba(0, 0, 0, 0.1);
    font-family: "DMSans";
    max-width: 85%;
    // font-size: 100px;
    line-height: 90px;
    font-style: normal;
    font-weight: 700;
    letter-spacing: 5px;
    text-transform: uppercase;
    text-align: left;
    position: absolute;
    left: 0%;
    top: 5%;
    // animation: fadeIn 0.5s;
    // -webkit-animation: fadeIn 5s;
    // -moz-animation: fadeIn 5s;
    // -o-animation: fadeIn 5s;
    // -ms-animation: fadeIn 5s;
    // @media(max-width: 1980px){
    //   font-size: 75px;
    //   max-width: 72%;
    // }
    // @media(min-width: 1600px){
    //   line-height: 108px;
    // }
    // @media(max-width: 1440px){
    //   font-size: 75px;
    //   max-width: 75%;
    // }
    // @media(max-width: 1366px){
    //   font-size: 65px;
    //   max-width: 95%;
    // }
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
      .stylish-pointer-to-left {
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
        font-size: 18px;
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



// @keyframes fadeInMaskRight {
//     0% {
//         mask-image: linear-gradient(to right, transparent 0%, black 100%);
//     }
//     50% {
//         mask-image: linear-gradient(to right, transparent 50%, black 100%);
//     }
//     100% {
//         mask-image: none;  // This ensures the mask is completely removed at the end.
//     }
// }
// @keyframes fadeInMaskLeft {
//     0% {
//         mask-image: linear-gradient(to left, transparent 0%, black 100%);
//     }
//     50% {
//         mask-image: linear-gradient(to left, transparent 50%, black 100%);
//     }
//     100% {
//         mask-image: none;  // This ensures the mask is completely removed at the end.
//     }
// }
// .stylish-pointer {
//     display: flex;
//     mask-image: none;
//     animation: fadeInMaskRight 3s forwards;
//     /* Additional styling for pointer-line and pointer-circle if needed */
// }

// .stylish-pointer-to-left {
//     display: flex;
//     mask-image: none;
//     animation: fadeInMaskLeft 3s forwards;
//     /* Additional styling for pointer-line and pointer-circle if needed */
// }
.stylish-pointer, .stylish-pointer-to-left {
    position: relative;
    overflow: hidden;
    display: flex;
}

.stylish-pointer::before{
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to right, white 0%, white 100%);
    animation: fadeEffectLeftToRight 1s 2s forwards; // delay for switch animation to play out
}
.stylish-pointer-to-left::before{
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to right, white 0%, white 100%);
  animation: fadeEffectRightToLeft 1s 2s forwards; // delay for switch animation to play out
}
@keyframes fadeEffectLeftToRight {
    0% {
        left: -100%;
    }
    100% {
        left: 100%;
    }
}
@keyframes fadeEffectRightToLeft {
    0% {
        right: -100%;
    }
    100% {
        right: 100%;
    }
}
.brand-selection {
  height: 30%;
  width: 100%;
  margin-bottom: 15%;
  .brand-image {
    width: 60%; /* Set the width of the image to 60% of its container */
    height: auto; /* Maintains the aspect ratio */
    opacity: 0.3;
    cursor: pointer;
  }
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
