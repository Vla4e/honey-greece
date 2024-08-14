<template>
  <div class="product-page-container">
    <!-- <span class="floating-text" ">
      {{ currentFlavour.name }}
    </span> -->

    <transition name="fade" mode="out-in">
      <span class="floating-text" :style="{ 
        'font-size': computedTextLength.fontSize + 'px',
        'line-height': computedTextLength.lineHeight + 'px'
      }" :key="currentFlavour.name">
        {{ currentFlavour.name }}
      </span>
    </transition>
    
    <span v-if="isMobile" class="mobile-series">
          {{ currentProductLine.name }}
        </span>

    <div class="series-selection">
      <div class="pushdown" style="height: 35%; width: 100%;"></div>
      <div v-if="!isMobile" class="series-item-container">
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
      <!-- <div class="pushdown" style="height: 15%; width: 100%;"></div> -->
      <ProductSceneFinal />
      <!-- <ProductScene /> -->
    </div>


    <!-- <ColorPicker class="color-picker target"/>
    <button style="position: absolute; top: 0%; left: 10%; z-index: 200000;" @click="toggleViews()">Toggle views</button> -->

    <div v-if="(isMobile && circleToggled) || !isMobile" class="blend-selection">
      <img src="../assets/images/x-icon.svg" @click="toggleCircle()" v-if="isMobile"/>
      <div class="brand-selection pushdown">
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
      <div
        class="blend product-line"
        v-for="(brandProductLine, idx) in brandProductLines"
        :style="currentProductLine.name !== brandProductLine.name ? '': 'display: none !important;'"
        @click="selectProductLine(brandProductLine.name)"
        :key="idx"
        v-if="isMobile"
      >
        <span class="blend-text">
          {{ brandProductLine.name }} &gt;
        </span>
      </div>
    </div>

    <div v-if="isMobile" class="series-selection-mobile">
      <div @click="toggleCircle()" :class="circleToggled ? 'clicked': ''" class="circle" id="circle">
        <div class="plus"></div>
      </div>
    </div>

    

    <div v-if="isMobile" class="suggested-brand-section">
      <span class="flavor-text">Also discover... </span>
      <div class="suggested-brands">
        <router-link :to="`/product/HAA?line=Monoflorals`" class="brand">
          <img :src="suggestedBrandLogoUrl" class="logo" alt="Brand"/>
          <img :src="chevronRight" class="chevron" alt="Go to brand"/>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { onUnmounted, onMounted, ref, toRaw, computed, watch, inject } from "vue";
import { useWindowSize } from "@vueuse/core";
import { useRoute } from 'vue-router';

import downloadIcon from "@/assets/pages/product-page/download-icon.png";
import pointerLine from "@/assets/pages/product-page/pointer-line.svg";
import pointerCircle from "@/assets/pages/product-page/pointer-circle.svg";
import arrow from "@/assets/images/arrow.svg";
import chevronRight from '@/assets/images/arrow.svg';

import brandConfigs from "@/assets/brand-information/index.js"
import { useProductStore } from '@/store/product.js'
import ProductSceneFinal from "../components/ProductSceneFinal.vue"
import ProductScene from "../components/ProductScene.vue"

export default {
  components: { ProductSceneFinal, ProductScene },
  props: ['line', 'selectedBrand'],

  setup(props) {
    const { width: windowWidth, height: windowHeight } = useWindowSize();

    const { isMobile } = inject('screenSize')
    
    let showControls = ref(false)
    function toggleViews(){
      showControls.value = !showControls.value
    }

    const route = useRoute();

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
    //   // console.log("Before mount")
    // })
    // onMounted(() => {
    //   // console.log("Mounting")
    // })


    let currentFlavour = ref(null)
    let currentProductLine = ref(null)
    let selectedBrand = ref(null); // Okto / Haa / Melculum string
    let brandProductLines = ref(null);
    let productLineFlavours = ref(null);

    if(props.selectedBrand){
      selectedBrand.value = brandConfigs[props.selectedBrand]
      brandProductLines = ref(selectedBrand.value.brandProductLines)
      // console.log("route query", route.query?.line)
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


    //TODO: incorrect usage of computed - asynchronous fetch of url - this should be function with separate reactive variable
    let computedLogo = computed( async () => {
      switch(selectedBrand.value.brand){
        case 'Okto':
          const imgUrl = new URL('@/assets/pages/tabs/tab2-larger.png', import.meta.url).href;
          return imgUrl;
        case 'HAA':
          // console.log("returnign HAA")
          const imgUrl2 = new URL('@/assets/pages/tabs/tab1-larger.png', import.meta.url).href;
          return imgUrl2;
      }
    })

    async function fetchLogoUrl(){
      // console.log("Attempting to fetch logourl", selectedBrand.value.brand)
      let imgUrl = null
      switch(selectedBrand.value.brand){
        case 'Okto':
          imgUrl = (await import('@/assets/pages/tabs/tab2-larger.png')).default;
          return imgUrl;
        case 'HAA':
          // console.log("returnign HAA")
          imgUrl = (await import('@/assets/pages/tabs/tab1-larger.png')).default;
          return imgUrl;
      }
    }
    let suggestedBrandLogoUrl = ref(null) // does not look cool bro...

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
      if(windowWidth.value <= 1440 && !isMobile.value){
        fontSize -= 20
      }
      if(isMobile.value){
        // console.log("DELETING 40px", fontSize)
        fontSize -= 65
      } else {
        fontSize -= 20; // TEMP FIX
      }
      // console.log("Calculated fontsize", fontSize)
      let lineHeight = fontSize * 1.3
      return {fontSize, lineHeight}
    })

    const isSelected = function (brandProductLine){
      // // console.log("HUH", toRaw(brandProductLine.name), currentProductLine.value.name, toRaw(brandProductLine.name) === currentProductLine.value.name)
      return currentProductLine.value.name === brandProductLine.name ? 'selected' : '';
    }

    const displayStyle = function (brandProductLine) {
      // // console.log("DUH", toRaw(brandProductLine.name), currentProductLine.value.name)
      return { display: currentProductLine.value.name === brandProductLine.name ? 'flex' : 'none' };
    };

    watch(() => route.params, (params) => {
      if(params && params.selectedBrand){
        // // console.log("PARAMS === >", params.selectedBrand)
        if(params.selectedBrand !== selectedBrand.value.brand){
          // console.log("Not the same param")
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

    watch(selectedBrand, async (newBrand) => {
      // // console.log("newBrand", toRaw(newBrand))
      brandProductLines.value = newBrand.brandProductLines
      currentProductLine.value = brandProductLines.value[route.query?.line ? route.query.line : 'Monoflorals']
      if(newBrand){
        productStore.setBrand({name: newBrand.brand, urlSlug: newBrand.urlSlug })
        suggestedBrandLogoUrl.value = await fetchLogoUrl()
      }
    }, {immediate: true})

    watch(currentProductLine, (newProductLine) => {
      // // console.log("newProductLine", toRaw(newProductLine))
      // // console.log("currentProductLine", toRaw(currentProductLine))
      if(newProductLine){
        productStore.setProductLine({name: newProductLine.name, urlSlug: newProductLine.urlSlug })
      }
    }, {immediate: true})

    watch(currentFlavour, (newFlavour) => {
      // // console.log("newFlavour", toRaw(newFlavour))
      if(newFlavour){
        productStore.setFlavour({name: newFlavour.name, urlSlug: newFlavour.urlSlug })
      }
    }, {immediate: true})
    
    function selectProductLine(productLine) {
      if (productLine !== currentProductLine.value.name) {
        // console.log("Changing productLine Value", productLine)
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
      // console.log("Switching Brand");
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
      // console.log("CPL", toRaw(currentProductLine.value))
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    function calculateLineWidths(edgeCoordinates){
      // console.log("Got EdgeDistance", edgeCoordinates.leftEdge, edgeCoordinates.rightEdge)
      if (productViewer.value) {

        const circleDetraction = 45; // Account for circle width, and imprecision in calculation
        const productViewerWidth = productViewer.value.offsetWidth;
        const productViewerPositionalData = productViewer.value.getBoundingClientRect()
        //Distances
        let leftElementToCanvas = productViewerPositionalData.left  - seriesItem.value[0].getBoundingClientRect().right
        let rightElementToCanvas = blendItem.value[0].getBoundingClientRect().left - productViewerPositionalData.right
        let leftLineDistance = leftElementToCanvas + edgeCoordinates.leftEdge - circleDetraction
        let rightLineDistance = rightElementToCanvas + edgeCoordinates.rightEdge - circleDetraction
        // console.log("DISTANCE LEFT", leftLineDistance)
        // console.log("DISTANCE RIGHT", rightLineDistance)
        //Set variable value to calculated distance
        document.documentElement.style.setProperty('--pointer-line-width', `${leftLineDistance}px`);
        document.documentElement.style.setProperty('--pointer-line-right-width', `${rightLineDistance}px`);
        return
      }
    }

    let circleToggled = ref(false)
    function toggleCircle(){
      // console.log("TOGGLING CIRCLE")
      circleToggled.value = !circleToggled.value
    }


    return {
      toggleCircle,
      circleToggled,
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
      suggestedBrandLogoUrl,
      isSelected,
      displayStyle,
      selectProductLine,
      selectFlavour,
      switchBrand,
      toggleViews,
      showControls,
      isMobile,
      chevronRight
    };
  },
};
</script>

<style lang="scss">
.color-picker{
  position: absolute;
  top: 30%;
  left: 80%;
  z-index: 10000;
}
.product-page-container {
  position: relative;
  // justify-content: space-between;
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 25% 55% 20%;
  flex-grow: 1 !important;
  width: 95% !important;
  &.hide{
    .floating-text{
      opacity: 0;
    }
    .blend-selection{
      opacity: 0;
    }
    .series-selection{
      opacity: 0;
    }
    .target{
      opacity: 1;
    }
  }
  &.show{
    .floating-text{
      opacity: 1;
    }
    .blend-selection{
      opacity: 1;
    }
    .series-selection{
      opacity: 1;
    }
    .target{
      opacity: 0;
    }
  }

  .floating-text, .mobile-series {
    // opacity: 0;
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
    // opacity: 0;
    // justify-content: center;
    .blend {
      position: relative;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      // width: 100%;
      margin-bottom: 15px;
      width: 80%;
      .stylish-pointer-to-left {
        display: none !important;
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
    // opacity: 0;
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
          display: none !important;
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

  
  @media(max-width: 767px){
    display: flex;
    flex-direction: column;
    width: 100% !important;
    max-width: 100%;
    background: white;
    .floating-text{
      position: static;
      max-width: 95%;
      text-align: center;
      line-height: 60px;
      font-size: 65px;
      margin: auto;
      margin-bottom: -30px;
    }
    .mobile-series{
      position: static;
      font-size: 24px;
      width: 100%;
      align-self: center;
      text-align: center; 
      margin-top: 50px;
      border-top: 0.5px solid #8080803b; // margin-top: -20px;
    }
    .product-viewer {
      order: 1;
      margin-bottom: 30px;
    }
    .selected-description {
      order: 2;
      margin-bottom: 30px;
    }
    .blend-selection {
      order: 3;

      background: #00000095;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 20000;
      align-items: center;
      justify-content: center;
      margin-bottom: 30px;
      overflow: hidden !important;
      .stylish-pointer-to-left{
        display: none !important;
      }
      .pushdown{
        display: none;
      }
      img{
        width: 40px;
        height: 40px;
        align-self: flex-end;
        margin-right: 20px;
        margin-bottom: 20px;
      }
      .blend{
        width: 100%;
        justify-content: center;
        margin-bottom: 40px;
        min-height: 40px;
        .blend-text{
          color: white;
          text-align: center;
          transition: font-size 0.3s ease;
          font-size: 18px;
        }
        &.selected{
          .blend-text{
            position: relative;
            font-size: 25px;
            &::before,
            &::after {
                content: '';
                position: absolute;
                top: 50%;
                width: 20px;
                height: 2px;
                background-color: #fff;
            }

            &::before {
                left: -30px; /* Adjust this value to position the line */
                transform: translateY(-50%);
            }

            &::after {
                right: -30px; /* Adjust this value to position the line */
                transform: translateY(-50%);
            }
          }
        }

        &.product-line{
          margin-top: 35px;
          border-top: 1px solid white;
          width: 80%;
          margin: auto;
          padding-top: 30px;
          margin-top: 0px;
          margin-bottom: 0;
          .blend-text{
            font-size: 22px;
          }
        }
      }
      
    }
    .series-selection {
      order: 4;

      width: 100% !important;
      align-items: center;
      margin-bottom: 30px;
      .stylish-pointer{
        display: none !important;
      }
      .selected-description{
        order: 1;
        align-items: center;
        .description-subheading{
          text-align: center;
        }
        .description-text{
          text-align: center;
          width: 90%;
        }
      }
      .technical-sheet{
        order: 2;
      }
    }
    .suggested-brand-section{
      order: 4;
    }
  }
}

.series-selection-mobile{
  display: flex;
  flex-direction: column;
  width: 95%;
  margin: auto;
  .circle {
    position: relative;
    width: 45px;
    height: 45px;
    border-radius: 50%;
    background-color: transparent;
    border: 1px solid #000;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 10001;
    align-self: flex-end;

    &.clicked {
      // border-color: white;
      background-color: black;
      .plus{
        background-color: white;
        &:before{
          background-color: white;
        }
      }
    }
    
    .plus {
      position: absolute;
      width: 25px;
      height: 1px;
      background-color: #000;
      &:before{
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 1px;
        // margin-left: -1px;
        height: 25px;
        background-color: #000;
      }
    }
  }
}
.suggested-brand-section{
  margin-top: 50px;
  .flavor-text{
    font-family: "Didact Gothic";
    font-size: 14px;
    font-weight: 400;
    line-height: 18.35px;
    letter-spacing: 0.1em;
    text-align: center;
    color: #525151;
  }
  .suggested-brands{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    .brand{
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      position: relative;
      .logo{
        width: 50%;
        justify-self: center;
        opacity: 0.3;
      }
      .chevron{
        position: absolute;
        right: 2%;
        width: 30px;
        height: 30px;
      }
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
    animation: fadeEffectLeftToRight 0.5s forwards; // delay for switch animation to play out
}
.stylish-pointer-to-left::before{
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to right, white 0%, white 100%);
  animation: fadeEffectRightToLeft 0.5s forwards; // delay for switch animation to play out
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
