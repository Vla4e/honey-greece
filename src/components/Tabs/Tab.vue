<template>
  <div 
    :id="tabId" 
    @mouseover="tabHover(true)" 
    @mouseleave="tabHover(false)" 
    @click="tabClick(brand)"
    :class="['tab', `tab-${tabId}`, tabState]"
  >
    <img :src="logoSource" class="tab-logo" :class="`tab-logo-${tabId}`"/>
    <div class="series-container">
      <span 
        v-for="(productLine, idx) in productLines" 
        :key="idx"
        class="series-link" 
        @click="goToProductLine(brand, productLine)"
      >
        {{ productLine }}
      </span>
    </div>
    <div class="tab-texts">
      <span class="tab-title">{{tabTitle}}</span>
      <span class="tab-text">{{tabText}}</span>
    </div>
    <img :src="jarImage" class="tab-jar" :class="brand.toLowerCase()"/>
  </div>
</template>

<script>
import { ref, computed, inject, onMounted, onUnmounted } from 'vue';
import router from '@/router/index.js'
import oktoJar from '@/assets/images/jar-labels/okto/monoflorals/450g/oak_honey.png'
import haaJar from '@/assets/images/jar-labels/haa/monoflorals/300g/cotton_limited.png'

export default {
  name: 'Tab',
  props: {
    tabText: { type: String, default: 'Test' },
    tabTitle: { type: String, default: 'Test' },
    tabId: { type: Number, required: true },
    brand: { type: String, required: true },
    productLines: { type: Array, default: () => ['Test1', 'Test2', 'Test3'] },
    line: { type: String, required: true, default: 'Okto' }
  },
  setup(props) {
    console.log("PROPS TABID", props.tabId, props.brand)
    const singleTabEmitter = inject('emitter')
    const { isMobile } = inject('screenSize')

    const tabActive = ref(false)
    const tabClicked = ref(false)

    const tabState = computed(() => {
      if (tabClicked.value) return 'clicked-tab'
      if (tabActive.value) return 'hovered-tab'
      return 'inactive-tab'
    })

    
    let logoUrl = computed(() => {
      switch(props.tabId){
        case 1:
          const imgUrl = new URL('@/assets/pages/tabs/tab1-larger.png', import.meta.url).href;
          return imgUrl;
        case 2:
          const imgUrl2 = new URL('@/assets/pages/tabs/tab2-larger.png', import.meta.url).href;
          return imgUrl2;
        case 3:
          const imgUrl3 = new URL('@/assets/pages/tabs/tab3-larger.png', import.meta.url).href;
          return imgUrl3;
      }
    })

    const jarImage = computed(() => {
      switch(props.brand) {
        case 'Okto': return oktoJar
        case 'HAA': return haaJar
        default: return oktoJar
      }
    })

    function tabHover(bool) {
      if (isMobile.value) return
      if (props.tabId === 3) return

      tabActive.value = bool
      if (!bool) {
        tabClicked.value = bool
        singleTabEmitter.emit('toggleClickedTab', { value: tabClicked.value, tabId: null })
      }
    }

    function tabClick(brand) {
      console.log("TABCLICKED", brand)
      if(brand === 'Melculum') return // Melculum not ready
      tabClicked.value = !tabClicked.value
      singleTabEmitter.emit('toggleClickedTab', { value: tabClicked.value, brand: props.brand })
    }

    onMounted(() => {
      singleTabEmitter.on('toggleClickedTab', ({ value, brand }) => {
        if (brand !== props.brand) {
          tabClicked.value = false;
          tabActive.value = false;
        }
      });
    })
    onUnmounted(() => {
      singleTabEmitter.off('toggleClickedTab')
    })

    function goToProductLine(brand, productLine) {
      console.log("going to TABS", brand, productLine)
      if(brand === 'Melculum'){
        return
      }
      router.push({ 
        name: 'Product', 
        params: { selectedBrand: brand }, 
        query: { line: productLine }
      }).catch(err => {
        console.log("error while routing", err)
      })
    }

    return { 
      tabState,
      jarImage,
      logoSource: logoUrl,
      tabHover,
      tabClick,
      goToProductLine
    }
  }
}
</script>

<style lang="scss" scoped>
.tab {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  // background: #FFFFFF;
  // border-right: 2px gray solid;
  overflow: hidden !important;
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
  transition: width 0.3s ease-in;
  @media(max-width: 767px){
    transition: height 0.3s ease-in;
  }

  &-1 {
    background-image: url('@/assets/pages/tabs/bg-1.png'); 
  }
  &-2 { 
    background-image: url('@/assets/pages/tabs/bg-2.png');
    &.hovered-tab .tab-jar {
      // max-height: 45% !important;
      @media(max-width: 1366px) {
        // // max-height: 55% !important;
        // right: -25% !important;
        // bottom: -5% !important;
      }
    }
  }
  &-3 { 
    background-image: url('@/assets/pages/tabs/bg-3.png');
    position: relative;
    cursor: default !important;
    .tab-texts{
      display: flex;
      position: absolute !important;
      top: 70% !important;
      left: 50% !important;
      max-width: 100% !important;
      width: 100% !important;
      justify-content: center;
      transform: translate(-50%, -50%);
      opacity: 0.6;
      @media(max-width: 767px){
        // display: none !important;
        .tab-title{
          margin-bottom: 0px !important;
          margin-top: 20px !important;
        }
      }
      .tab-text{
        display: none !important;
      }
    }
  }

  &:last-child { 
    border-right: none; 
  }

  .tab-title {
    color: #000;
    font-family: "DMSans";
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 10px;
    text-align: left;
    @media(max-width: 1366px) { font-size: 16px; }
  }

  .tab-text {
    color: #000;
    font-family: "DMSans";
    font-size: 15px;
    font-weight: 400;
    letter-spacing: 1.5px;
    text-align: left;
    @media(max-width: 1366px) { 
      font-size: 14px; 
    }
    @media(max-width: 768px) {
      display: flex;
      justify-content: flex-start;
      font-size: 12px;
      text-align: left;
    }
    @media(max-width: 376px){
      font-size: 10px;
    }
  }
  
  &.inactive-tab, .clicked-tab, .hovered-tab {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    // background: transparent;
    z-index: 6;
  }
}

.clicked-tab {
  .series-container {
    opacity: 1;
    transition: opacity ease-in-out 0.5s;
    transition-delay: 0.3s;
    position: absolute;
    left: 50%;
    top: 60%;
    transform: translate(-50%, -50%);
    width: 80%;
    display: flex;
    justify-content: space-around;
    align-items: center;

    .series-link {
      color: #000;
      text-align: center;
      font-family: "DMSans";
      font-size: 22px;
      font-weight: 400;
      letter-spacing: 2px;
      text-transform: capitalize;
      transition: font-size ease 0.3s;
      &:hover { font-size: 24px; }
    }
  }
  .tab-texts { 
    max-width: 60%;
    
    @media(max-width: 768px){
      max-width: 90%;
    }

    position: absolute;
    top: 30%;
    left: -100%;
    transition: all ease-in-out 0.15s;
  }
  .tab-jar {
    position: absolute;
    max-height: 40%;
    bottom: 25%;
    right: -100% !important;
    transform: translate(50%, 50%);
    transition: all 0.5s ease-in-out;
  }
  .tab-logo {
    position: absolute;
    top: 35%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    margin-left: auto;
    margin-right: auto;
    transition: all ease-in-out 0.3s;
    @media(max-width: 767px){
      width: 40%;
      top: 25%;
    }
  }
}

.hovered-tab {
  .tab-logo {
    position: absolute;
    top: 20%;
    left: 50%;
    width: 40%;
    transform: translate(-50%, -50%);
    opacity: 1;
    transition: 0.5s ease-in-out;
  }
  .series-container {
    display: none;
    opacity: 0;
    transition: all ease-in 1s, all ease-out 0s;
  }
  .tab-texts {
    display: flex !important;
    flex-direction: column;
    max-width: 60%;
    @media(max-width: 768px){
      max-width: 90%;
    }
    position: absolute;
    top: 30%;
    left: 10%;
    transition: left ease-in-out 1s;
  }
  .tab-jar {
    position: absolute;
    bottom: 0% !important;
    right: -30%;
    transition: all 0.8s ease-in-out;
    max-height: 50%;
    @media(max-width: 1600px) { 
      max-height: 45%; 
    }
    @media(max-width: 1366px) {
      max-height: 45%;
      right: -25%;
    }
  }
}

.inactive-tab {
  .tab-logo {
    position: absolute;
    width: 70%;
    opacity: 0.6;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.3s ease-in-out;
    @media(max-width: 767px){
      width: 50%;
      opacity: 1;
    }
  }
  .series-container { 
    display: none; 
    opacity: 0 !important; 
  }
  .tab-texts {
    max-width: 60%;
    
    @media(max-width: 768px){
      max-width: 90%;
    }
    position: absolute;
    top: 30%;
    left: -100%;
  }
  .tab-jar {
    position: absolute;
    max-height: 60%;
    right: -200%;
  }
}

@media (max-width: 767px) {
  .tab {
    .inactive-tab, .clicked-tab, .hovered-tab {
      background: none !important; // Ensure no background color is applied on mobile
    }
    .series-link{
      font-size: 18px !important;
    }
  }
}

@media (max-width: 767px) and (min-height: 840px) {
  .clicked-tab{
    .tab-texts{
      // position: static;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      max-width: 90%;
      width: 90%;
      transition: all 0.5s ease;
      .tab-title{
        display: none;
      }
      .tab-text{}
    }
    .tab-logo{
      top: 18%;
    }
    .series-container{
      bottom: 5%;
      top: auto;
    }
  }
}
</style>
