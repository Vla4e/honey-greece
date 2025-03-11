<template>
  <div class="tab-2" :class="`tab-2-phase-${currentPhase}`">
    <!-- <div class="background-container">
    </div> -->
    <img class="background" :src="background"/>
    <Transition name="fade" mode="out-in">
      <div v-if="currentPhase >= 1" class="background-cover"></div>
    </Transition>
    <div class="text-container">
      <h1 class="heading">
        Greece,
        <br/>our beloved home
      </h1>
      <Transition name="slide-in" mode="out-in">
        <p :class="currentPhase > 0 ? 'show' : ''" class="text">
          A long-standing tradition of producing high-quality honey with an intense aroma. 
          From the blossoms of the Peloponnesian orchards to the wild herbs of Crete, our bees are nature's gifted artisans, 
          capturing the essence of the Greek landscape in every jar.
          <br/>
          <br/>
          As we celebrate our heritage and our honey's journey from our hives to your homes, 
          we invite you to savor the magic of honey in all its glory. Not only is honey a delectable natural sweetener, 
          but it also offers a plethora of health benefits. Packed with antioxidants, vitamins, and minerals, honey is a true elixir of wellness, 
          enhancing both the palate and the body.
        </p>
      </Transition>
    </div>
    <Transition name="slide-in" mode="out-in">
      <div v-if="currentPhase > 1" class="quote-container">
          <div class="pushdown" style="height: 15%; width: 30%;">
          </div>
          <span class="honey-heading">
            Antonios Montouris Honey
          </span>
          <p class="quote">
            <img class="quote quote-start" :src="quoteStart"/>
            where tradition, innovation, 
            <br/>and the purest honey meet
            <img class="quote quote-end" :src="quoteEnd"/>
          </p>    
          <router-link :to="'/products'" class="cta">Discover the range of honey products &gt;</router-link>
      </div>
    </Transition>
  </div>
</template>


<script setup>
import {ref, computed, inject } from 'vue';
import router from '@/router/index.js'
import { stringifyQuery } from 'vue-router';
import quoteStart from '@/assets/pages/history/quote-start.png'
import quoteEnd from '@/assets/pages/history/quote-end.png'
import background from '@/assets/pages/history/16-9.jpg';

defineOptions({
  name: 'Tab2',
  phases: 2,// 0 indexed
})

let props = defineProps({
  currentPhase: Number
})

const maxPhases = 2 //3 counted from 0
</script>

<style lang="scss" scoped>
.tab-2{
  // background-image: url('@/assets/pages/history/16-9.jpg');
  // background-size: cover;
  // background-position: center;
  // background-repeat: no-repeat;
  display: flex;
  // justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  .background-container{
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    top: 0;
    right: 0;
    transition: transform 1.5s ease;
  }
  .background, .background-cover{
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 1;
    top: 0;
    right: 0;
    transition: transform 1.5s ease;
  }

  .background-cover{
    background: linear-gradient(125.77deg, transparent 39.63%, #14141480 69.84%);
    // background-blend-mode: multiply;
    // opacity: 0.2;
    z-index:2;
    opacity: 0;
    transition: transform 1.5s ease, opacity 1s ease;
  }

  .text-container{
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 50%;
    min-width: 50%;
    transition: transform 0.7s ease, width 2.7s ease;
    position: relative;
    transform: translateX(50%);
    .heading{
      font-family: 'DM Serif';
      font-style: normal;
      font-size: clamp(3rem, 0rem + 4.688vw, 7.5rem);
      font-weight: 400;
      color: white;
      text-align: center;
      text-shadow: 4px 4px 4px rgba(0, 0, 0, 0.5);
      margin: 0;
      // transform: translate(0%, 0%);
      transition: font-size 1.5s ease;
      // position: absolute;
      // top: 20%;
    }

    .text{
      // position: absolute;
      // top: 50%;
      font-family: "DMSans";
      font-size: clamp(1rem, 0.167rem + 1.102vw, 2rem);
      line-height: clamp(1rem, 0.167rem + 2vw, 2.5rem);
      font-weight: 400;
      text-align: left;
      color: white;
      width: 80%;
      text-shadow: 4px 4px 4px rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 1.5s;
      &.show{
        opacity: 1;
      }
      // @media(max-width: 1440px){
      //   font-size: 16px;
      // }
    }
  }
  
  .quote-container{
    display: flex;
    flex-direction: column;
    align-items: center;
    // justify-content: center;
    z-index: 3;
    position: relative;
    height: 100%;
    transition: all 1s 0.5s ease;
    .honey-heading{
      font-family: "DMSans";
      font-size: clamp(50px, 2rem + 5vw, 100px + 3vw);
      font-weight: 700;
      line-height: clamp(50px, 2rem + 5vw, 100px + 3vw);
      letter-spacing: 0.03em;
      text-align: left;
      text-transform: uppercase;
      // position:absolute;
      // top: 15%;
      // left: 5%;
      // padding-left: 5%;
      z-index: 2;
      color: #0000000D;
    }
    .quote{
      font-family: "Alex Brush";
      font-size: 64px;
      font-weight: 400;
      line-height: 80px;
      text-align: center;
      color: #000000;
      // position:absolute;
      z-index: 2;
      .quotes{
        font-family: "AbyssinicaSIL";
        font-size: 70px;
        font-weight: 400;
        text-align: center;
      }
    }
  }

  &-phase-0{
    // width: 95% !important;
    .text-container{
      // width: 80%;
    }
  }

  &-phase-1{
    // width: 95% !important;
    // justify-content: flex-end;
    .text-container{
      // width: 80%;
      transform: translate(100%, clamp(5%, 5vh , 10%)) !important;
      .heading{
        font-size: clamp(3rem, 0rem + 4.688vw, 7.5rem);
        font-weight: 400;
        text-align: center;
      }
    }
    .quote-container{
      width: 55%;
    }
    .background{
      // width: 120%;
      // height: 120%;
    }
    .background-cover{
      opacity: 1;
    }
  }

  &-phase-2{
    width: 100% !important;
    // justify-content: flex-start;
    .text-container{
      // width: 50%;
      // padding-left: 5%;
      // padding-right: 5%;
      transform: translateX(0%) !important;
      .heading{
        font-size: clamp(3rem, 0rem + 4.688vw, 7.5rem);
        font-weight: 400;
        text-align: center;
      }
      .text{
        // width: 100%;
        // @media(max-width: 1440px){
        //   font-size: 16px;
        // }
        font-size: clamp(1rem, 0.167rem + 1.102vw, 2rem);
      }
    }
    .quote-container{
      width: 50%;
      max-width: 50%;
      overflow: hidden;
      padding-left: 2%;
      padding-right: 2%;
      .quote{
        @media(max-width: 1440px){
          font-size: 56px;
        }
      }
    }
    .background{
      // width: 120%;
      // height: 120%;
      transform: translateX(-50%);
    }
    .background-cover{
      // right: 50%;
      // width: 50%;
      opacity: 1;
      background: linear-gradient(125.77deg, #14141440 35.84%,  #14141480 69.84%);
      transform: translateX(-50%);
    }
  }
}
.cta{
  font-family: "DMSans";
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  color: black;
  text-transform: uppercase;
  transition: transform 0.3s ease;
  &:hover{
    transform: scale(1.1)
  }
}
.slide-in-enter-active, .slide-in-leave-active{
  transition: all 0.5s 0.5s ease-out;
}

.slide-in-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-in-enter-to{
  transform: translateX(0%);
  opacity: 1;
}

.slide-in-leave-from {
  transform: translateX(0%);
  opacity: 0;
}
.slide-in-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
.slide-in-leave-active {
  position: absolute;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>