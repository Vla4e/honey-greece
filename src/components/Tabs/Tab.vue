<template>
  <div 
  :id="tabId" 
  @mouseover="tabHover(true)" 
  @mouseleave="tabHover(false)" 
  :class="`tab-${tabId}`" 
  class="tab"
  >
        <!-- SINGLE DIV -->
        <img :src="currentTabBackground" class="tab-background" :class="[!tabActive ? 'hide' : 'show', tabClicked ? 'clicked': '']" />
        <div :class="!tabActive ? 'inactive-tab': tabClicked ? 'clicked-tab' : 'active-tab'" @click="tabClick()">
          <img :src="logoSource" class="tab-logo" :class="`tab-logo-${tabId}`"/>
          <!-- CLICKED -->
          <div class="series-container">
            <router-link class="series-link" :to="`/${series}`" v-for="(series,idx) in series" :key="idx">
              {{series}}
            </router-link>
          </div>
          <!-- <JarScene class="jar-clicked"/> -->
          <!-- ACTIVE -->
          <div class="tab-texts">
            <span class="tab-title">{{tabTitle}}</span>
            <span class="tab-text">{{tabText}}</span>
          </div>
          <img :src="mockJar" class="tab-jar"/>
        </div>
        <!--  -->
        <!-- <div :key="`inactive-${tabId}`" v-if="!tabActive" class="inactive-tab">
          <img :src="logoSource" class="tab-logo" :class="`tab-logo-${tabId}`"/>
        </div>
        <div :key="`clicked-${tabId}`" v-else-if="tabClicked"  @click="tabClick()" class="clicked-tab">
            <img :src="logoSource" class="tab-logo" :class="`tab-logo-${tabId}`"/>
            <div class="series-container">
              <router-link class="series-link" :to="`/${series}`" v-for="(series,idx) in series" :key="idx">
                {{series}}
              </router-link>
            </div>
        </div>
        <div :key="`active-${tabId}`" @click="tabClick()"  v-else class="active-tab">
          <div class="tab-texts">
            <img :src="logoSource" class="tab-logo" :class="`tab-logo-${tabId}`"/>
            <span class="tab-title">{{tabTitle}}</span>
            <span class="tab-text">{{tabText}}</span>
          </div>
          <img :src="mockJar" class="tab-jar"/>
        </div> -->
  </div>
</template>

<script>
import {ref, computed, inject } from 'vue';
import JarScene from '@/components/JarScene.vue'
import mockJar from '@/assets/pages/home/jar-medium.png'
import tab1bg from '@/assets/pages/tabs/bg-1.png'
import tab2bg from '@/assets/pages/tabs/bg-2.png'
import tab3bg from '@/assets/pages/tabs/bg-3.png'
export default {
  name: 'tab',
  components: { JarScene },
  props: {
    content: {
      type: Array,
      required: false,
      default: null
    },
    logoSource: {
      type: String,
      required: false,
      default: ''
    },
    backgroundSource: {
      type: String,
      required: false,
      default: ''
    },
    tabText: {
      type: String,
      required: false,
      default: 'Test'
    },
    tabTitle: {
      type: String,
      required: false,
      default: 'Test'
    },
    tabId: {
      type: Number,
      required: false,
      default: ''
    },
    series: {
      type: Array,
      required: false,
      default: () => {
        return [
          'Test1',
          'Test2',
          'Test3'
        ]
      }
    }
  },
  setup(props){
    // console.log("USEIMAGE", useImage)
    let singleTabEmitter = inject('emitter')
    let tabActive = ref(false)
    let tabOpen = ref(false)
    let tabClicked = ref(false)
    let logoUrl = computed(() => {
      switch(props.tabId){
        case 1:
          const imgUrl = new URL('@/assets/pages/tabs/tab1.png', import.meta.url).href;
          return imgUrl;
        case 2:
          const imgUrl2 = new URL('@/assets/pages/tabs/tab2.png', import.meta.url).href;
          return imgUrl2;
        case 3:
          const imgUrl3 = new URL('@/assets/pages/tabs/tab3.png', import.meta.url).href;
          return imgUrl3;
      }
    })
    let currentTabBackground = null;
    if(props.tabId == 1) currentTabBackground = tab1bg
    else if (props.tabId == 2) currentTabBackground = tab2bg
    else currentTabBackground = tab3bg
    function tabHover(bool){
      // console.log("TABHOVER", bool)
      tabActive.value = bool
      if(!bool){
        tabClicked.value = bool
        singleTabEmitter.emit('toggleClickedTab', {value: tabClicked.value, tabId: null})
      }
    }
    function tabClick(){
      console.log("TABCLICKED", tabClicked.value)
      tabClicked.value = !tabClicked.value
      singleTabEmitter.emit('toggleClickedTab', {value: tabClicked.value, tabId: props.tabId})
      
    }
    return{ 
      tabTitle: props.tabTitle,
      tabText: props.tabText,
      series: props.series,
      backgroundSource: props.backgroundSource, 
      logoSource: logoUrl, 
      tabActive,
      tabClicked,
      tabOpen,
      mockJar,
      currentTabBackground,
      tabHover,
      tabClick }
  }
}
</script>

<style lang="scss" scoped>
.tab{
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  border-right: 2px gray solid;
  overflow: hidden !important;
  position: relative;
  .inactive-tab{
  }
  .active-tab{
  }
  .clicked-tab{
    .series-container{
      display: flex;
      justify-content: space-around;
      align-items: center;
      .series-link{
        color: #000;
        text-align: center;
        font-family: "DMSans";
        font-size: 22px;
        font-style: bold;
        font-weight: 400;
        line-height: normal;
        letter-spacing: 2px;
        text-transform: capitalize;
        transition: font-size ease-in-out 0.3s;
        &:hover{
          font-size: 24px;
          transition: all ease-in-out 0.3s;
        }
      }
    }
  }
  .active-tab, .clicked-tab{
    .tab-title{
      color: #000;
      font-family: "DMSans";
      font-size: 20px;
      font-style: normal;
      font-weight: 700;
      line-height: normal;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 10px;
      text-align: left;
    }
    .tab-text{
      color: #000;
      font-family: "DMSans";
      font-size: 15px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
      letter-spacing: 1.5px;
      text-transform: capitalize;
      text-align: left;
    }
  }
  
  .inactive-tab, .clicked-tab, .active-tab{
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    background: transparent;
    z-index: 6;
  }
}
.tab:last-child{
  border-right: none;
}

//ANIMATIONS
.clicked-tab{
  .jar-clicked{
    display: block;
    position: absolute;
    width: 70%;
    height: auto;
    top: 60%;
    left: 10%;
  }
  .series-container{
    opacity: 1;
    transition: opacity ease-in-out 0.5s;
    transition-delay: 0.3s;
    position: absolute;
    left: 50%;
    top: 60%;
    transform: translate(-50%, -50%);
    width: 80%;
  }
  .tab-texts{ 
    max-width: 60%;
    position: absolute;
    top: 25%;
    left: -100%;
    transition: all ease-in-out 0.15s;
  }
  .tab-jar{ //clicked jar
    position: absolute;
    // display: none !important;
    max-height: 40%;
    bottom: 25%;
    right: -100% !important;
    transform: translate(50%, 50%);
    transition: all 0.5s ease-in-out;
  }
  .tab-logo{
    position: absolute;
    top: 35%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    margin-left: auto;
    margin-right: auto;
    transition: all ease-in-out 0.3s;
  }
}
.active-tab{
  .jar-clicked{
    display: none;
  }
  .tab-logo{
    position: absolute;
    top: 20%;
    left: 50%;
    width: 40%;
    transform: translate(-50%, -50%);
    opacity: 1;
    transition: 0.5s ease-in-out;
  }
  .series-container{
    opacity: 0;
    transition: all ease-in 1s, all ease-out 0s;
  }
  .tab-texts{
    display: flex !important;
    flex-direction: column;
    max-width: 60%;
    position: absolute;
    top: 25%;
    left: 10%;
    transition: left ease-in-out 1s;
  }
  .tab-jar{ //hovered jar
    position: absolute;
    bottom: 0% !important;
    right: -50%;
    transition: all 0.8s ease-in-out;
    max-height: 50%;
  }
}
.inactive-tab{
  .jar-clicked{
    display: none;
  }
  .tab-logo{
    position: absolute;
    width: 70%;
    opacity: 0.6;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.3s ease-in-out;
  }
  .series-container{
    display: none !important;
  }
  .tab-texts{
    max-width: 60%;
    position: absolute;
    top: 25%;
    left: -100%;
  }
  .tab-jar{
    position: absolute;
    // display: none !important;
    max-height: 60%;
    right: -200%;
  }
}
.tab-background{
  height: 100%;
  position: absolute;
  top: 0%;
  // left: 0%;
  // transform: translate(50%, 50%);
  z-index: 5;
  opacity: 1;
  transition: opacity ease-in-out 0.25s;
  // transition-delay: 0.5s;
  &.hide{
    opacity: 0;
  }
  &.clicked{
    transform: scale(1.6, 1.6);
    transition: all ease-in-out 0.3s;
    // transition-delay: 0.5s;
  }
}
</style>