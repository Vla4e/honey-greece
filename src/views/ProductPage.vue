<template>
  <div class="product-page-container">
    <Transition name="fade" mode="out-in">
      <span
        class="floating-text"
        :style="{
          'font-size': computedTextLength.fontSize + 'px',
          'line-height': computedTextLength.lineHeight + 'px',
        }"
        :key="currentFlavour?.name"
      >
        {{ currentFlavour?.name }}
      </span>
    </Transition>

    <span v-if="isMobile" class="mobile-series">
      {{ currentProductLine?.name }}
    </span>

    <div class="series-selection">
      <div class="pushdown" style="height: 35%; width: 100%"></div>

      <!-- Desktop product line selector -->
      <div v-if="!isMobile" class="series-item-container">
        <div class="series-items">
          <div
            class="series-item"
            v-for="(line, idx) in brandProductLines"
            :key="idx"
            :class="{ selected: line.name === currentProductLine?.name }"
            @click="selectProductLine(line)"
          >
            <span class="series-item-text">Okto - {{ line.name }}</span>
            <div class="stylish-pointer" v-show="line.name === currentProductLine?.name">
              <img :src="pointerLine" class="pointer-line" />
              <img :src="pointerCircle" class="pointer-circle" />
            </div>
          </div>
        </div>
      </div>

      <!-- Description for the selected product line/flavour -->
      <div class="selected-description">
        <h2 class="description-subheading">{{ currentFlavour?.tagline }}</h2>
        <span class="description-text">{{ currentFlavour?.description }}</span>
      </div>

      <div class="technical-sheet">
        Technical Sheet
        <img :src="downloadIcon" class="download-sheet" />
      </div>
    </div>

    <!-- Product Viewer -->
    <div class="product-viewer" ref="productViewer">
      <ProductSceneFinal v-if="isCapable" />
      <ProductImage v-else />
    </div>

    <!-- Flavour (blend) selection -->
    <div v-if="(isMobile && circleToggled) || !isMobile" class="blend-selection">
      <img src="../assets/images/x-icon.svg" @click="toggleCircle()" v-if="isMobile" />

      <span
        v-for="(flavour, idx) in productLineFlavours"
        :key="idx"
        class="blend"
        :class="{ selected: flavour.name === currentFlavour?.name }"
        @click="selectFlavour(flavour)"
      >
        <span class="blend-text">{{ flavour.name }}</span>
        <div
          class="stylish-pointer-to-left"
          v-show="flavour.name === currentFlavour?.name"
        >
          <img :src="pointerCircle" class="pointer-circle" />
          <img :src="pointerLine" class="pointer-line" />
        </div>
      </span>

      <!-- Mobile: Switch product lines (displays the other lines in brand) -->
      <div
        v-for="(line, idx) in brandProductLines"
        :key="idx"
        class="blend product-line"
        v-if="isMobile"
        v-show="currentProductLine?.name !== line.name"
        @click="selectProductLine(line)"
      >
        <span class="blend-text">{{ line.name }} &gt;</span>
      </div>
    </div>

    <!-- Mobile circle toggler -->
    <div v-if="isMobile" class="series-selection-mobile">
      <div
        class="circle"
        id="circle"
        :class="{ clicked: circleToggled }"
        @click="toggleCircle()"
      >
        <div class="plus"></div>
      </div>
    </div>

    <!-- Mobile: suggested brand section -->
    <div v-if="isMobile" class="suggested-brand-section">
      <span class="flavor-text">Also discover...</span>
      <div class="suggested-brands">
        <router-link :to="`/product/${suggestedBrandRoute}`" class="brand">
          <img :src="suggestedBrandLogoUrl" class="logo" alt="Brand" />
          <img :src="chevronRight" class="chevron" alt="Go to brand" />
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, inject } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useWindowSize } from "@vueuse/core";

// Assets
import downloadIcon from "@/assets/pages/product-page/download-icon.png";
import pointerLine from "@/assets/pages/product-page/pointer-line.svg";
import pointerCircle from "@/assets/pages/product-page/pointer-circle.svg";
import chevronRight from "@/assets/images/arrow.svg";

// Local
import ProductSceneFinal from "../components/ProductSceneFinal.vue";
import brandConfigs from "@/assets/brand-information/index.js";
import { useProductStore } from "@/store/product.js";

// Provide or inject screen size
const { width: windowWidth } = useWindowSize();
const { isMobile } = inject("screenSize");

// Check webgl capabilities
import { checkCapabilities } from "../helpers/WebGLCapabilities/checkCapabilities";
let isCapable = ref(false);

// Emitter from parent, if relevant
let emitter = inject("emitter");

// === Refs ===
const productViewer = ref(null);
const circleToggled = ref(false);

// === Route Setup ===
const route = useRoute();
const router = useRouter();
/**
 * Assuming your route is something like:
 *  /product/:selectedBrand?line=Blends&honey=<some-flavour>
 *
 *  route.params.selectedBrand -> "Okto" or "HAA"
 *  route.query.line -> "Blends" or "Monoflorals" ...
 *  route.query.honey -> "Acacia" ...
 */

// === Brand / Product Line / Flavour from route ===
const selectedBrandParam = computed(() => route.params.selectedBrand);
// const selectedLine = computed(() => route.query.line);
let selectedLine = ref(route.query.line);
// const selectedHoney = computed(() => route.query.honey);
let selectedHoney = ref(route.query.honey);

/**
 * 1) Full brand config from brand-information
 * 2) brandProductLines for whichever brand
 * 3) currentProductLine from brandProductLines using query
 * 4) currentFlavour from productLineFlavours using honey name or slug
 */
const selectedBrandConfig = computed(() => {
  return brandConfigs[selectedBrandParam.value];
});

const brandProductLines = computed(() => {
  return selectedBrandConfig.value?.brandProductLines || {};
});

const currentProductLine = computed(() => {
  return brandProductLines.value[selectedLine.value] || null;
});

const productLineFlavours = computed(() => {
  return currentProductLine.value?.flavours || [];
});

const currentFlavour = computed(() => {
  console.log("Computing currentFlavour:");
  // If you store flavors with a 'urlSlug' property, you might compare that.
  // If you only store them by name, do a match by 'name' instead.
  if (!productLineFlavours.value.length) return null;

  // Try to find flavor matching the `honey` query
  let found = productLineFlavours.value.find(
    (f) => f.urlSlug === selectedHoney.value || f.name === selectedHoney.value
  );
  // fallback to first if none found
  return found || productLineFlavours.value[0];
});

// === Setup watchers for store synchronization ===
const productStore = useProductStore();

// Whenever brand/line/flavour changes, set to store if you need it
watch(currentFlavour, (newVal) => {
  if (newVal) {
    productStore.setFlavour({
      name: newVal.name,
      urlSlug: newVal.urlSlug,
    });
  }
});
watch(currentProductLine, (newVal) => {
  if (newVal) {
    productStore.setProductLine({
      name: newVal.name,
      urlSlug: newVal.urlSlug,
    });
  }
});
watch(selectedBrandConfig, (newVal) => {
  if (newVal) {
    productStore.setBrand({
      name: newVal.brand,
      urlSlug: newVal.urlSlug,
    });
  }
});

function toggleCircle() {
  circleToggled.value = !circleToggled.value;
}

function selectFlavour(flavour) {
  selectedHoney.value = flavour.urlSlug;
  // close circle menu in mobile
  if (isMobile.value) circleToggled.value = false;
}

function selectProductLine(line) {
  selectedLine.value = line.name;
}

if (emitter) {
  emitter.on("meshEdges", (meshEdges) => {
    calculateLineWidths(meshEdges);
  });
  onUnmounted(() => {
    emitter.off("meshEdges");
  });
}

function calculateLineWidths(edgeCoordinates) {
  // console.log("Got EdgeDistance", edgeCoordinates.leftEdge, edgeCoordinates.rightEdge)
  if (productViewer.value) {
    const circleDetraction = 45; // Account for circle width, and imprecision in calculation
    const productViewerWidth = productViewer.value.offsetWidth;
    const productViewerPositionalData = productViewer.value.getBoundingClientRect();
    //Distances
    let leftElementToCanvas =
      productViewerPositionalData.left -
      seriesItem.value[0].getBoundingClientRect().right;
    let rightElementToCanvas =
      blendItem.value[0].getBoundingClientRect().left - productViewerPositionalData.right;
    let leftLineDistance =
      leftElementToCanvas + edgeCoordinates.leftEdge - circleDetraction;
    let rightLineDistance =
      rightElementToCanvas + edgeCoordinates.rightEdge - circleDetraction;
    // console.log("DISTANCE LEFT", leftLineDistance)
    // console.log("DISTANCE RIGHT", rightLineDistance)
    //Set variable value to calculated distance
    document.documentElement.style.setProperty(
      "--pointer-line-width",
      `${leftLineDistance}px`
    );
    document.documentElement.style.setProperty(
      "--pointer-line-right-width",
      `${rightLineDistance}px`
    );
    return;
  }
}

const computedTextLength = computed(() => {
  if (!currentFlavour.value) {
    return { fontSize: 100, lineHeight: 130 };
  }
  let nameLength = currentFlavour.value.name.length;
  let fontSize;
  switch (true) {
    case nameLength > 28:
      fontSize = 80;
      break;
    case nameLength < 12:
      fontSize = 130;
      break;
    case nameLength < 16:
      fontSize = 120;
      break;
    case nameLength < 20:
      fontSize = 110;
      break;
    case nameLength < 22:
      fontSize = 100;
      break;
    case nameLength <= 24:
      fontSize = 100;
      break;
    case nameLength < 28:
      fontSize = 90;
      break;
    default:
      fontSize = 100;
      break;
  }

  // Adjust for smaller screens
  if (windowWidth.value <= 1440 && !isMobile.value) {
    fontSize -= 20;
  }
  // Adjust for mobile
  if (isMobile.value) {
    fontSize -= 65;
  } else {
    // hardcoded fix
    fontSize -= 20;
  }

  let lineHeight = fontSize * 1.3;
  return { fontSize, lineHeight };
});

// For "Also discover..."
const suggestedBrandLogoUrl = ref(null);
const suggestedBrandRoute = ref(null);

onMounted(async () => {
  isCapable.value = await checkCapabilities();
});
</script>

<style lang="scss">
.color-picker {
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
  &.hide {
    .floating-text {
      opacity: 0;
    }
    .blend-selection {
      opacity: 0;
    }
    .series-selection {
      opacity: 0;
    }
    .target {
      opacity: 1;
    }
  }
  &.show {
    .floating-text {
      opacity: 1;
    }
    .blend-selection {
      opacity: 1;
    }
    .series-selection {
      opacity: 1;
    }
    .target {
      opacity: 0;
    }
  }

  .floating-text,
  .mobile-series {
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
    .series-item-container {
      display: flex;
      flex-direction: column;
      width: 90%;
      .series-item {
        position: relative;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        width: 100%;
        .series-item-text {
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
        &:hover {
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
      &:hover,
      &.selected {
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

  @media (max-width: 767px) {
    display: flex;
    flex-direction: column;
    width: 100% !important;
    max-width: 100%;
    background: white;
    .floating-text {
      display: flex;
      align-items: center;
      position: static;
      max-width: 95%;
      text-align: center;
      line-height: 60px;
      font-size: 65px;
      margin: auto;
      margin-bottom: -30px;
      min-height: 125px;
      transition: all 0.3s ease-in-out;
    }
    .mobile-series {
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
      .stylish-pointer-to-left {
        display: none !important;
      }
      .pushdown {
        display: none;
      }
      img {
        width: 40px;
        height: 40px;
        align-self: flex-end;
        margin-right: 20px;
        margin-bottom: 20px;
      }
      .blend {
        width: 95%;
        justify-content: center;
        margin-bottom: 40px;
        min-height: 40px;
        .blend-text {
          color: white;
          text-align: center;
          transition: font-size 0.3s ease;
          font-size: 16px;
        }
        &.selected {
          .blend-text {
            position: relative;
            font-size: 22px;
            &::before,
            &::after {
              content: "";
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

        &.product-line {
          margin-top: 35px;
          border-top: 1px solid white;
          width: 80%;
          margin: auto;
          padding-top: 30px;
          margin-top: 0px;
          margin-bottom: 0;
          .blend-text {
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
      .stylish-pointer {
        display: none !important;
      }
      .selected-description {
        order: 1;
        align-items: center;
        .description-subheading {
          text-align: center;
        }
        .description-text {
          text-align: center;
          width: 90%;
        }
      }
      .technical-sheet {
        order: 2;
      }
    }
    .suggested-brand-section {
      order: 4;
    }
  }
}

.series-selection-mobile {
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
      .plus {
        background-color: white;
        &:before {
          background-color: white;
        }
      }
    }

    .plus {
      position: absolute;
      width: 25px;
      height: 1px;
      background-color: #000;
      &:before {
        content: "";
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
.suggested-brand-section {
  margin-top: 50px;
  .flavor-text {
    font-family: "Didact Gothic";
    font-size: 14px;
    font-weight: 400;
    line-height: 18.35px;
    letter-spacing: 0.1em;
    text-align: center;
    color: #525151;
  }
  .suggested-brands {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      position: relative;
      .logo {
        width: 50%;
        justify-self: center;
        opacity: 0.3;
      }
      .chevron {
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
.stylish-pointer,
.stylish-pointer-to-left {
  position: relative;
  overflow: hidden;
  display: flex;
}

.stylish-pointer::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to right, white 0%, white 100%);
  animation: fadeEffectLeftToRight 0.5s forwards; // delay for switch animation to play out
}
.stylish-pointer-to-left::before {
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
