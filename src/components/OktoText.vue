<template>
  <div ref="oktoText" :class="hoverable ? 'hoverable' : ''" class="okto-text">
    <span class="okt" :style="computedBold ? 'font-weight: 700 !important;': ''">Okt</span>
    <span class="omega" :style="computedBold ? 'font-weight: 700 !important;':''">ώ</span>
    <!-- <img :src="oktoOmega" class="okto-omega"/> -->
  </div>
</template>
<script>
export default {
  name: "OktoText",
};
</script>
<script setup>
import { computed, watch, onBeforeMount, onMounted, ref, inject } from "vue";

import oktoOmega from "@/assets/images/o-omega-2.png";

const { isMobile } = inject("screenSize");
const oktoText = ref();
const props = defineProps({
  fontSize: {
    type: Number,
    required: false,
  },
  hoverable: {
    type: Boolean,
    required: false,
    default: false,
  },
  isBold: {
    type: Boolean,
    required: false,
    default: false
  }
});

//NOT WORKING BUT DONT FIX
watch(
  () => props.fontSize,
  (newVal) => {
    let fontSize;
    console.log("SIMOB", isMobile.value)
    if (isMobile) fontSize = props.fontSizeMobile;
    else fontSize = newVal;
    console.log("FONTSIZE:", fontSize, newVal, props.fontSizeMobile)
    document.documentElement.style.setProperty("--okto-font-size", fontSize + "px");
  },
  {
    immediate: true,
  }
);

let computedBold = computed(() => props.isBold)
</script>

<style lang="scss" scoped>
.okto-text {
  .okto-omega {
    max-height: 110px;
  }
  .okt {
    font-family: "DMSans" !important;
    font-weight: 400 !important;
    text-align: left !important;
    text-transform: uppercase !important;
    font-size: var(--okto-font-size);
    @media (min-width: 1981px) {
      font-size: 20px;
    }
  }
  .omega {
    // font-family: "DMSans";
    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif !important;
    font-weight: 400 !important;
    text-align: left !important;
    text-transform: lowercase !important;
    font-size: calc(
      var(--okto-font-size) * 1.22
    ); // 1.22 = ratio of figma design proposed omega letter fontsize / "okt" fontsize
    @media (min-width: 1981px) {
      font-size: calc(20px * 1.22);
    }
  }
}

.hoverable {
  &:hover {
    .okt,
    .omega {
      font-weight: 700 !important;
    }
  }
}
</style>
