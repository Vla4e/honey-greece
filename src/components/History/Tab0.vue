<template>
  <div class="tab-0" :class="`tab-0-phase-${currentPhase}`">

    <!-- State 1 -->
    <div class="heading-container">
      <h1 class="heading">History</h1>
      <h2 class="heading-addition">of our honey</h2>
      <p class="text text-1">
        For over 40 years, the Montouris family has been dedicated to the timeless craft of beekeeping, producing some of the finest honey in Greece. 
        Today, we proudly continue this rich tradition, with Antonios Montouris at the helm, steering the course towards an even sweeter future.
      </p>
    </div>
    <div class="image-grid">
      <!-- <Transition name="fade" class="fade-out"> -->
        <img :src="gridImage1" class="image-1"/>
      <!-- </Transition> -->
        <img :src="gridImage2" class="image-2"/>
        <img :src="gridImage3" class="image-3"/>
    </div>
    <!-- State 2 -->
    <!-- State 3 -->
  </div>
</template>

<script>
export default {
  name: 'Tab0',
  phases: 2,
}
</script>
<script setup>
import {ref, computed, inject, watch } from 'vue';
import router from '@/router/index.js'

import gridImage1 from '@/assets/pages/history/tab-0-card-1.png'
import gridImage2 from '@/assets/pages/history/tab-0-card-2.png'
import gridImage3 from '@/assets/pages/history/tab-0-card-3.png'
const maxPhases = 2; //3 counted from 0

let props = defineProps({
  currentPhase: Number
})

watch(() => props.currentPhase, (newPhase) => {
  console.log("phase change", newPhase)
})

</script>

<style lang="scss" scoped>
.tab-0{
  position: relative;
  background-image: url('@/assets/pages/history/tab-0-background.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  .heading-container{
    display: flex;
    flex-direction: column;
    position: absolute;
    width: 40%;
    top: 20%;
    right: 20%;
    transform: translate(0%, 0%);
    transition: 
    top 1s ease-out,
    right 1s ease-out,
    transform 1s ease-out,
    width 0.8s;
    .heading{
      transition: all 1s ease-in-out;
    }
    .heading-addition{
      transition: all 1s ease-in-out;
    }
    .text{
      opacity:0;
      transition: all 1s 1s ease-in-out;
    }
  }
  .image-grid{
    display: flex;
    width: 70%; // of the container tab-0
    overflow: hidden;
    position: relative;
    transform: translateX(150%); // Start off-screen to the right
    transition: transform 1s ease-in-out;
    img{
      width: 33.3%;
      // height: auto;
    }
  }
}

// PHASE 1
.tab-0-phase-0{
  flex-direction: column;
  position: relative;
  .heading-container{
  }
  .image-grid{
  }
}
// PHASE 2
.tab-0-phase-1{
  flex-direction: row;
  align-items: center;
  justify-content: center;
  .heading-container{
    width: 25%;
    top: 30%;
    right: 65%;
    .heading{
      font-size: 64px;
      text-align: left;
    }
    .heading-addition{
      display: none;
    }
    .text{
      opacity: 1;
    }
  }
  .image-grid{
    transform: translateX(40%); 
    .image-1{
      opacity: 1;
      transition: opacity 0.5s ease-in-out;
    }
    .image-2, .image-3{
      transform: translateX(0%);
      transition: transform 0.5s ease-in-out;
    }
  }

}
// PHASE 3
.tab-0-phase-2{
  flex-direction: row;
  align-items: center;
  justify-content: center;
  .heading-container{
    width: 25%;
    top: 30%;
    right: 65%;
    .heading{
      font-size: 64px;
      text-align: left;
    }
    .heading-addition{
      display: none;
    }
    .text{
      opacity: 1;
    }
  }
  .image-grid{
    // transform: translateX(-20%); 
    transform: translateX(40%); 
    img{
    //  transition: transform 0.5s ease-out;
    }
    .image-1{
      opacity: 0;
      transition: opacity 0.5s ease-in-out;
    }
    .image-2, .image-3{
      transform: translateX(-100%);
      transition: transform 0.5s ease-in-out;
    }
  }

}


.heading-container{
  .heading{
    font-family: 'DM Serif';
    font-style: normal;
    font-size: 150px;
    font-weight: 400;
    color: white;
    text-align: right;
    text-shadow: 4px 4px 4px rgba(0, 0, 0, 0.5);
    margin: 0;
    &-addition{
      font-family: "DMSans";
      font-size: 40px;
      font-weight: 400;
      color: white;
      letter-spacing: 0.04em;
      text-align: right;
      text-transform: uppercase;
      text-shadow: 4px 4px 4px rgba(0, 0, 0, 0.5);
      margin: 0;
    }
  }
  .text-1{
    font-family: "DMSans";
    font-size: 20px;
    font-weight: 400;
    text-align: left;
  }
}
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-leave-from{
  opacity: 1;
}
.fade-leave-to {
  opacity: 0;
}
</style>