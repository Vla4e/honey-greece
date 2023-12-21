<template>
  <div class="product-page-container">
    <span class="floating-text">
      {{selectedBlend.name}}
    </span>
    <div class="blend-selection">
      <span 
        class="blend"
        :class="selectedBlend.name === blend.name ? 'selected':''"
        @click="selectBlend({blend, idx})"
        v-for="(blend, idx) in blends"
        :key="idx"
      >
        {{blend.name}}
      </span>
    </div>
    <div class="product-viewer">
      <ProductScene/>
    </div>
    <div class="series-selection">  
      <div 
        class="series-item" 
        v-for="(seriesItem,idx) in selectedBlend.series" 
        :key="idx"
        @click="selectSeries(seriesItem)"
        :class="selectedSeries === seriesItem ? 'selected':''"
      >
        {{seriesItem}}
      </div>
      <div class="selected-description">
        <h1 class="description-heading">{{selectedBlend.name}}</h1>
        <h2 class="description-subheading">{{selectedBlend.tagline}}</h2>
        <span class="description-text">{{selectedBlend.description}}</span>
        <div class="technical-sheet">
          Technical Sheet <img :src="downloadIcon" class="download-sheet"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ProductScene from '../components/ProductScene.vue'
import { watch, onMounted, ref, computed } from "vue";
import downloadIcon from '@/assets/pages/product-page/download-icon.png'
import jarMockup from '@/assets/pages/product-page/jar-mockup.png'
export default {
  components: { ProductScene },
  setup(){
    let blends = [
      {
        name: 'Master blender selection',
        tagline: 'Ultra Premium Honey',
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad`,
        series: [
          'mb1',
          'mb2',
          'mb3',
          'mb4',
        ]
      }, 
      {
        name: 'honey aficionado',
        tagline: 'Ultra Premium Honey',
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad`,
        series: [
          'hA1',
          'hA2',
          'hA3',
          'hA4',
        ]
      },
      {
        name: 'Mediterranean',
        tagline: 'Ultra Premium Honey',
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad`,
        series: [
          'me1',
          'me2',
          'me3',
          'me4',
        ]
      },
      {
        name: 'nature’s blend',
        tagline: 'Ultra Premium Honey',
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad`,
        series: [
          'nb1',
          'nb2',
          'nb3',
          'nb4',
        ]
      },
      {
        name: 'forest blend',
        tagline: 'Ultra Premium Honey',
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad`,
        series: [
          'fb1',
          'fb2',
          'fb',
          'fb',
        ]
      },
    ]
    //Default to first array entry
    let selectedBlend = ref(blends[0])
    let selectedSeries = ref(selectedBlend.value.series[0])
    function selectBlend(value){
      if(selectedBlend.value.name !== value.blend.name){
        selectedBlend.value = value.blend
        selectedSeries.value = selectedBlend.value.series[0]
      }
    }
    function selectSeries(value){
      selectedSeries.value = value
    }
    return {blends, selectedBlend, selectedSeries, downloadIcon, jarMockup, selectBlend, selectSeries}
  }
}
</script>

<style lang="scss" scoped>
.product-page-container{
  position: relative;
  // display: flex;
  // width: 100%;
  justify-content: space-between;
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 1fr 1fr 1fr;
  flex-grow: 0 !important;
  margin-top: 5vh !important;
  .floating-text{
    z-index: 1;
    color: rgba(0, 0, 0, 0.10);
    font-family: 'DMSans';
    font-size: 60px;
    font-style: normal;
    font-weight: 700;
    letter-spacing: 6px;
    text-transform: uppercase;
    white-space: nowrap;
    position: absolute;
    left: 0%;
    top: 0%;
    animation: fadeIn 0.5s;
    -webkit-animation: fadeIn 5s;
    -moz-animation: fadeIn 5s;
    -o-animation: fadeIn 5s;
    -ms-animation: fadeIn 5s;
  }
  .blend-selection{
    // width: calc(100vw/3);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    align-self: center;
  }
  .series-selection{
    // position: absolute;
    // top: 30%;
    // right: 25%;
    // max-height: 20%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
  }
  .series-selection, .blend-selection{
    .blend, .series-item{
      color: #000;
      font-family: 'DMSans';
      font-size: 16px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
      letter-spacing: 2.72px;
      text-transform: uppercase;
      transition: all ease-in-out 0.15s;
      cursor: pointer;
      z-index: 6;
      &:hover{
        font-size: 17px;
      }
      &.selected{
        font-size: 19px;
        font-weight: 700;
        letter-spacing: 3.23px;
      }
    }
  }
  .selected-description{
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: start;
    // align-self: flex-end;
    // padding-bottom: 10%;
    .description-heading{
      color: #000;
      font-family: 'DMSans';
      font-size: 35px;
      font-style: normal;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    .description-subheading{
      color: #000;
      font-family: 'DMSans';
      font-size: 24px;
      font-style: normal;
      font-weight: 400;
      letter-spacing: 2.6px;
      text-transform: capitalize;
    }
    .description-text{
      color: #000;
      font-family: 'DMSans';
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      letter-spacing: 1.4px;
    }
    .technical-sheet{
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;
      color: #000;
      font-family: 'DMSans';
      font-size: 20px;
      font-style: normal;
      font-weight: 400;
      letter-spacing: 1.2px;
      text-transform: capitalize;
      .download-sheet{
        width: 50px;
        height: 40px;
        margin-left: 15px;
      }
    }
  }
  .product-viewer{
    position: relative;
    // width: 40%;
    display: flex;
    height: 100%;
    z-index: 5;
    // align-self: center;
    .product-image{
      max-height: 60vh;
    }
  }
}
    @keyframes fadeIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
</style>