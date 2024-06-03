<template>
  <div class="tab-2" :class="`tab-2-phase-${currentPhase}`">
    <h1 class="floating-heading">A Tradition of Excellence</h1>
    <img :src="image1" class="image image-1"/>
    <img :src="image2" class="image image-2"/>
    <p class="floating-text"></p>
    <div class="journey-text-container">
      <span class="heading">
      </span>
      <span class="text">
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Tab2',
  phases: 5,
}
</script>
<script setup>
import { ref, watch, onMounted } from 'vue';
import router from '@/router/index.js'
import image1 from '@/assets/pages/history/tab-2-1.png'
import image2 from '@/assets/pages/history/tab-2-2.png'
let props = defineProps({
  currentPhase: Number
})
const currentContent = ref(['A', 'B', ''])
const isSliding = ref([false, false, false]);

watch(() => props.currentPhase, (newPhase) => {
  console.log("phase change", newPhase)
})
const updateContent = (newContent, indices, delay) => {
  setTimeout(() => {
    indices.forEach(index => {
      isSliding.value[index] = true;
    });
    setTimeout(() => {
      newContent.forEach((content, i) => {
        currentContent.value[indices[i]] = content;
        isSliding.value[indices[i]] = false;
      });
    }, 300); // Corresponds to CSS transition time
  }, delay);
};

onMounted(() => {
  updateContent(['A', 'C', 'B'], [1, 2], 1000); // Step 2
  updateContent(['C', 'C', 'D'], [0, 1, 2], 2000); // Step 3
  updateContent(['E', 'F', 'G'], [0, 1, 2], 3000); // Step 4
});

</script>

<style lang="scss" scoped>
.tab-2{
  display: block !important;
  // justify-content: flex-start;
  background-color: white;
  .floating-heading{
    position: absolute;
    top: 15%;
    left: 50%;
    transform: translateX(-50%);
    font-family: "DMSans";
    font-size: 150px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-align: center;
    color: #0000000D;
    margin: 0;
    width: 100%;
    text-transform: uppercase;
  }

  .image{
    &-1{
      
    }
    &-2{

    }
  }
  .floating-text{
  }
  
  .journey-text-container{
    .heading{
    }
    .subheading{
    }
  }
}

//Phase 1
.tab-2-phase-0{
  .floating-heading{
  }

  .image{
    &-1{
      position: absoulte;
      width: 35%;
    }
    &-2{}
  }
  .floating-text{
  }
  
  .journey-text-container{
    .heading{
    }
    .subheading{
    }
  }
}

//Phase 2
.tab-2-phase-1{
  .floating-heading{

  }

  .image{
    &-1{
      
    }

    &-2{

    }
  }
  .floating-text{

  }
  
  .journey-text-container{
    .heading{

    }
    .subheading{

    }
  }
}

//Phase 3
.tab-2-phase-2{
  .floating-heading{

  }

  .image{
    &-1{
      
    }

    &-2{
      
    }
  }
  .floating-text{

  }
  
  .journey-text-container{
    .heading{

    }
    .subheading{

    }
  }
}

//Phase 4
.tab-2-phase-3{
  .floating-heading{

  }

  .image{
    &-1{

    }

    &-2{

    }
  }
  .floating-text{

  }
  
  .journey-text-container{
    .heading{

    }

    .subheading{

    }
  }
}
</style>