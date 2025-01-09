<template>
  <div ref="oktoText" :class="hoverable ? 'hoverable' : ''" class="okto-text">
    <span class="okt">Okt</span>
    <span class="omega">ώ</span>
    <!-- <img :src="oktoOmega" class="okto-omega"/> -->
  </div>
</template>
<script>
export default {
  name:'OktoText'
}
</script>
<script setup>
import { computed, onBeforeMount, onMounted, ref, inject } from 'vue';

import oktoOmega from '@/assets/images/o-omega-2.png'

const { isMobile } = inject('screenSize')
const oktoText = ref();
const props = defineProps({
  fontSize: {
    type: Number,
    required: false
  },
  fontSize: {
    type: Number,
    required: false
  },
  hoverable:{
    type: Boolean,
    required: false,
    default: false
  }
});


const baseOktFontSize = 36;
const baseOmegaFontSize = 44;
const ratio = baseOmegaFontSize / baseOktFontSize; // 1.22(2)
let fontSizeOkt = computed(() => {
  if(isMobile.value)
    return props.fontSizeMobile
  else 
    return props.fontSize
});  
let fontSizeOmega = computed(() => {
  if(isMobile.value)
    return props.fontSizeMobile * ratio
  else 
    return props.fontSize * ratio
});
onMounted(() => {
  // console.log("OKTOTEXT", oktoText.value.style.fontSize)
})
</script>

<style lang="scss" scoped>
.okto-text{
  .okto-omega{
    max-height: 110px;
  }
  .okt{
    font-family: "DMSans" !important;
    font-weight: 400 !important;
    text-align: left !important;
    text-transform: uppercase !important;
    font-size: 16px;
    @media(min-width: 1981px){
      font-size: 20px;
    }
  }
  .omega{
    // font-family: "DMSans";
    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif !important;
    font-weight: 400 !important;
    text-align: left !important;
    text-transform: lowercase !important;
    font-size: calc(16px * 1.22); // 1.22 = ratio of figma design proposed omega letter fontsize / "okt" fontsize
    @media(min-width: 1981px){
      font-size: calc(20px * 1.22);
    }
  }
}

.hoverable{
  &:hover{
    .okt, .omega{
      font-weight: 700 !important;
    }
  }
}
</style>