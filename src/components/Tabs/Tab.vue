<template>
  <div 
  :id="tabId" 
  @mouseover="tabHover(true)" 
  @mouseleave="tabHover(false)" 
  :class="`tab-${tabId}`" 
  class="tab"
  >
      <div v-if="!tabActive" class="inactive-tab">
        <img :src="logoSource" class="tab-logo" :class="`tab-logo-${tabId}`"/>
      </div>
      <div v-else-if="tabClicked"  @click="tabClick()" class="clicked-tab">
          <img :src="logoSource" class="tab-logo" :class="`tab-logo-${tabId}`"/>
          <div class="series-container">
            <router-link class="series-link" :to="`/${series}`" v-for="(series,idx) in series" :key="idx">
              {{series}}
            </router-link>
          </div>
      </div>
      <div @click="tabClick()"  v-else class="active-tab">
        <!-- <img :src="backgroundSource" class="tab-background" :class="`tab-background-${tabId}`" /> -->
        <div class="tab-texts">
          <img :src="logoSource" class="tab-logo" :class="`tab-logo-${tabId}`"/>
          <span class="tab-title">{{tabTitle}}</span>
          <span class="tab-text">{{tabText}}</span>
        </div>
        <img :src="mockJar" class="tab-jar"/>
      </div>
  </div>
</template>

<script>
import {ref, computed } from 'vue';
import mockJar from '@/assets/pages/tabs/haa-jar.png'
export default {
  name: 'tab',
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
    function tabHover(bool){
      // console.log("TABHOVER", bool)
      tabActive.value = bool

    }
    function tabClick(){
      console.log("TABCLICKED", tabClicked.value)
      tabClicked.value = !tabClicked.value
      
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
  &-1{
    .active-tab, .clicked-tab{
      background: url('@/assets/pages/tabs/bg-1.png');
    }
  }
  &-2{
    .active-tab, .clicked-tab{
      background: url('@/assets/pages/tabs/bg-2.png');
    }
  }
  &-3{
    .active-tab, .clicked-tab{
      background: url('@/assets/pages/tabs/bg-3.png');
    }
  }
  .active-tab{
    justify-content: flex-start;
    align-items: flex-start;
  }
  .active-tab, .clicked-tab{
    position: relative;
    background-size: cover;
    background-repeat: no-repeat;
    max-width: 100%;
    .tab-texts{
      display: flex;
      flex-direction: column;
      max-width: 60%;
      position: absolute;
      top: 10%;
      left: 10%;
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
    .tab-logo{
      width: 40%;
    }
    .tab-jar{
      position: absolute;
      bottom: 0%;
      right: 0%;
      max-height: 60%;
    }
  }
  .clicked-tab{
    justify-content: center;
    align-items: center;
    .series-container{
      display: flex;
      justify-content: space-between;
      align-items: center;
      .series-link{
        color: #000;
        text-align: center;
        font-family: "DMSans";
        font-size: 16px;
        font-style: normal;
        font-weight: 400;
        line-height: normal;
        letter-spacing: 2px;
        text-transform: capitalize;
      }
    }
  }
  .inactive-tab{
    justify-content: center;
    align-items: center;
  }
  .inactive-tab, .clicked-tab, .active-tab{
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  &-logo{
    width: 50%;
    &-1{
      background-image: src('@/assets/pages/tabs/tab1.png')
    }
    &-2{
      background-image: src('@/assets/pages/tabs/tab2.png')

    }
    &-3{
      background-image: src('@/assets/pages/tabs/tab3.png')

    }
  }
}
.tab:last-child{
  border-right: none;
}
.background-change-enter,
.background-change-leave{
  // transition: opacity 0.5s ease-in-out;
}
</style>