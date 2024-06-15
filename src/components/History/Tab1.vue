<template>
  <div class="tab-1" :class="`tab-1-phase-${currentPhase}`">
    <Transition name="slide" mode="out-in">
      <TransitionGroup key="row-1" v-if="currentPhase < 3" name="grid" tag="div" class="row row-1">
        <!-- <div class="column" :class="`column-${idx}`" v-for="(column, idx) in columns" :key="column.id">
          {{ column.text }} index:{{ column.id }}
        </div> -->
        <div v-if="currentPhase < 2" class="column column-boxes">
          <img :src="image1" class="image boxes"/>
        </div>
        <div v-if="currentPhase >= 1" class="column column-beekeeper">
          <img :src="image2" class="image beekeeper"/>
        </div>
        <div class="column column-beginning">
          <p v-if="currentPhase < 1" class="floating-text" style="color: black;">
            It all began four decades ago, when the Montouris family established their honey business. 
            What started as a humble endeavor grew into a labor of love and a testament to unwavering commitment.
          </p>
          <p v-else class="floating-text" style="color: black;">
            When Antonios Montouris took the reins after his father's passing, 
            he didn't just inherit a business; he inherited a legacy. 
            His vision was clear – to expand, to innovate, 
            and to share the exquisite honey from their hives with the world.
          </p>
        </div>
        <div v-if="currentPhase >= 2" class="column column-journey">
          <span class="journey-heading">
            journey
            <br/>of our honey
          </span>
          <div class="journey-subtext-container">
            <span class="journey-subheading">
              Our journey began with a simple premise
            </span>
            <span class="journey-text">
              Direct sales from our premises. 
              The sheer quality of our honey garnered attention, and it was soon recognized as a benchmark for excellence. 
              The demand for our golden nectar inspired us to diversify our offerings.
            </span>
          </div>
        </div>
      </TransitionGroup>

      <div v-else key="row-2" class="row row-2">
        <h1 class="brand-heading-container">
          <span class="brand-text">Today, we are proud to introduce three distinct product series</span>
          <span class="brand-floating-heading">
            Hellenic
            <br/>premium
            <br/>honey
          </span>
        </h1>
        <div class="okto-container column">
          <img class="logo" :src="okto" alt="HAA">
          <span class="description">
            For those who seek the best, our Premium Honey series combines the rich flavors of the Greek countryside with a touch of tradition. 
            This is honey that carries a piece of our heritage in every drop.
          </span>
        </div>
        <div class="haa-container column">
          <img class="logo" :src="haa" alt="haa">
          <span class="description">
            The epitome of honey perfection, this series offers the purest, most exquisite honey nature has to offer. 
            Our bees roam pristine Greek landscapes, collecting nectar from a rich tapestry of flowers, resulting in a honey that is unparalleled in quality.
          </span>
        </div>
        <div class="melculum-container column">
          <img class="logo" :src="melculum" alt="melculum">
          <span class="description">
            Our honey spreads and other delightful creations are a testament to our creativity and passion. 
            Here, we blend the beauty of diversity with the art of taste, crafting unique and delicious honey-based products that you'll love.
          </span>
        </div>
      </div>
    </Transition>
    <!-- <button style="position: absolute; bottom: 20%; left: 50%;" @click="test()">Test</button> -->

    <h1 class="floating-heading floating-heading-1" v-if="currentPhase < 2">A Tradition of Excellence</h1>
    <!-- <h1 class="floating-heading floating-heading-2">
      journey
      <br/>of our 
      <br/>honey
    </h1>
    <img :src="image1" class="image image-1"/>
    <img :src="image2" class="image image-2"/>
    <p class="floating-text">
      It all began four decades ago, when the Montouris family established their honey business. 
      What started as a humble endeavor grew into a labor of love and a testament to unwavering commitment.
    </p>
    <div class="journey-text-container">
      <span class="heading">
        Our journey began with a simple premise
      </span>
      <span class="text">
        direct sales from our premises. 
        The sheer quality of our honey garnered attention, and it was soon recognized as a benchmark for excellence. 
        The demand for our golden nectar inspired us to diversify our offerings
      </span>
    </div>
    <div class="okto-container">
      <img class="logo" alt="HAA">
      <span class="description">
        For those who seek the best, our Premium Honey series combines the rich flavors of the Greek countryside with a touch of tradition. 
        This is honey that carries a piece of our heritage in every drop.
      </span>
    </div>
    <div class="haa-container">
      <img class="logo" alt="haa">
      <span class="description">
        The epitome of honey perfection, this series offers the purest, most exquisite honey nature has to offer. 
        Our bees roam pristine Greek landscapes, collecting nectar from a rich tapestry of flowers, resulting in a honey that is unparalleled in quality.
      </span>
    </div>
    <div class="melculum-container">
      <img class="logo" alt="melculum">
      <span class="description">
        Our honey spreads and other delightful creations are a testament to our creativity and passion. 
        Here, we blend the beauty of diversity with the art of taste, crafting unique and delicious honey-based products that you'll love.
      </span>
    </div> -->
  </div>
</template>

<script>
export default {
  name: 'Tab1',
  phases: 3,
}
</script>
<script setup>
import { ref, watch, onMounted, nextTick, toRaw } from 'vue';
import { useWindowSize } from "@vueuse/core";
import router from '@/router/index.js'
import image1 from '@/assets/pages/history/tab-1-1.png'
import image2 from '@/assets/pages/history/tab-1-2.png'
import okto from '@/assets/pages/history/okto.png'
import haa from '@/assets/pages/history/haa.png'
import melculum from '@/assets/pages/history/melculum.png'

const {width, height} = useWindowSize()
console.log("WIDTH AND HEIGHT", toRaw(width.value), toRaw(height.value))
let props = defineProps({
  currentPhase: Number
})

let columns = ref([
  {
    id: 0,
    text: 'Column 1'
  },
  {
    id: 1,
    text: 'Column 2'
  },
  // {
  //   id: 2,
  //   text: 'Column 3'
  // },
])
let counter = ref(3)
async function test() {
  // Remove the first item and remember it
  // let removed = columns.value.shift();
  
  // Create a new column
  let newColumn = { text: counter.value + ' Column', id: counter.value };
  
  // Use Vue.nextTick to ensure DOM updates have been processed
  await nextTick()
  setTimeout(()=>{
    let tempLength = columns.value.length;
    columns.value.splice(1, 0, newColumn)
    // columns.value.push(newColumn);
    counter.value++;
  }, 0)
}


watch(() => props.currentPhase, (newPhase) => {
  console.log("phase change", newPhase)
  test()
})


</script>

<style lang="scss" scoped>

.tab-1{
  display: flex !important;
  justify-content: center;
  background-color: white;
  overflow: hidden;
  .floating-heading{
    position: absolute;
    top: 10%;
    left: 50%;
    transform: translateX(-50%);
    font-family: "DMSans";
    font-size: 150px;
    font-weight: 700;
    letter-spacing: 0.03em;
    line-height: 120px;
    text-align: center;
    color: #0000000D;
    margin: 0;
    width: 100%;
    text-transform: uppercase;
    &-1{
      @media(max-width:1660px){
        font-size: 135px;
      }
      @media(max-width:1440px){
        font-size: 120px;
      }
    };
    &-2{

    }
    &-3{

    }
  }
  .floating-text{
    font-family: "DMSans";
    font-size: 16px;
    font-weight: 400;
    color: #000000;
    text-align: justify;
    margin: 0px !important;
    position: relative;
    top: 15%;
    @media(min-width: 1660px){
      font-size: 20px;
    }
  }
  .journey{
    &-heading{
      font-family: "DMSans";
      font-size: 150px;
      font-weight: 700;
      text-align: left;
      color: #0000000D;
      text-transform: uppercase;
      line-height:122px !important;
      margin-bottom: 20px;
      @media(max-width:1660px){
        font-size: 120px;
      }
    }
    &-subtext-container{
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
    }
    &-subheading{
      font-family: "DMSans";
      font-size: 20px;
      font-style: italic;
      font-weight: 700;
      text-align: left;
    }
    &-text{
      font-family: "DMSans";
      font-size: 16px;
      font-weight: 400;
      text-align: left;
    }
  }
  .row {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 95%;
    height: 100%;
    // transition: transform 0.5s ease;
    position:relative;
    z-index:2; //floating-text goes behind
  }
  .row-1{
    .column{
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 80%;
      color: #131313;
      font-size: 46px;
      transition: all 0.5s ease;
      &:not(:last-child){
        margin-right: 20px;
      }
      @media(max-width: 1367px){
        height: 70%;
      }
    }
  }
  .row-2{
    // position: relative;
    justify-content: space-between;
    width: 80%;
    .brand-heading-container{
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      z-index: 2;
      width: 100%;
      height: 100%;
      position: absolute;
      top: 5%;
      .brand-text{
        font-family: "DM Serif";
        font-size: 24px;
        font-style: italic;
        font-weight: 400;
        text-align: left;
        color: black;
      }
      .brand-floating-heading{
        font-family: "DMSans";
        font-size: 200px;
        font-weight: 700;
        text-align: center;
        color: #0000000D;
        text-transform: uppercase;
        @media(max-width: 1660px){
          font-size: 150px;
        }
        @media(max-width: 1440px){
          font-size: 130px;
        }
      }
    }
    .column{
      z-index: 3;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 30%;
      &:not(:last-child){
        // margin-right: 20px;
      }
      .description{
        font-family: "DMSans";
        font-size: 14px;
        font-weight: 400;
        text-align: center;
        color: black;
        @media(min-width: 1660px){
          font-size: 18px;
        }
      }
      .logo{
        width: 75%;
        margin-bottom: 5%;
      }
    }
    .okto-container{

    }
    .haa-container{

    }
    .melculum-container{

    }
  }
  &-phase-0{
    // background: red;
    // justify-content: center;
    .row{
      // justify-content: center;
    }
    .column{
      // width: 33.333%;
      // margin-right: 20px;
      .image{
        width: 90%;
        @media(max-width: 1536px){
          width: 80%;
        }
        @media(max-width: 1367px){
          width: 90%;
        }
      }
    }
    .column-boxes{
      width: 37.5%;
      justify-content: flex-end !important;
    }
    .column-beginning{
      width: 20%;
    }
  }
  
  &-phase-1{
    // background: red;
    .column{
      .image{
      }
    }
    .column-boxes{
      width: 37.5%;
      justify-content: flex-end !important;
      .image{
        width: 90%;
        @media(max-width: 1537px){
          width: 80%;
        }
        @media(max-width: 1367px){
          width: 90%;
        }
      }
    }
    .column-beekeeper{
      width: 30%;
      justify-content: flex-end !important;
      .image{
        height: 100%;
      }
    }
    .column-beginning{
      width: 20%;
    }
  }
  &-phase-2{
    .column{
    }
    // .column-boxes{
    //   justify-content: flex-end;
    // }
    .column-beekeeper{
      width: 30%;
      justify-content: flex-end !important;
      .image{
        // max-width: 100%;
        // max-height: 100%;
        height: 100%;
      }
    }
    .column-beginning{
      width: 20%;
      margin-right: 5% !important;
    }
    .column-journey{
      width: 40%;
      align-items: flex-start !important;
      justify-content: space-between !important;
      .journey{
        @media(max-width: 1440px){
          &-heading{
            font-size: 100px;
          }
        }
        
        @media(min-width: 1660px){
          &-heading{
            line-height: 160px !important;
          }
          &-subheading{
            margin-bottom: 20px;
          }
          &-text{
            width: 70%;
          }
        }
      }
    }
  }
  &-phase-3{
    
  }
  &-phase-4{
    
  }
}

.grid-move, /* apply transition to moving elements */
.grid-enter-active,
.grid-leave-active {
  transition: all 1s ease;
}

.grid-enter-from,
.grid-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
.grid-leave-active {
  position: absolute;
}

// .slide-enter-active, .slide-leave-active {
//   transition: transform 0.5s ease-out;
// }

// .slide-enter-from, .slide-leave-to {
//   transform: translateX(100%);
// }

// .slide-leave-from, .slide-enter-to {
//   transform: translateX(0%);
// }

// .slide-leave-to {
//   transform: translateX(-100%);
// }
.slide-enter-active, .slide-leave-active{
  transition: transform 0.5s ease-out;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-enter-to{
  transform: translateX(0%);
}

.slide-leave-from {
  transform: translateX(0%);
}
.slide-leave-to {
  transform: translateX(-100%);
}
</style>