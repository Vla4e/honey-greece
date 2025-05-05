<template>
  <div class="carousel-container">
    <div ref="carouselAnimationContainer" 
         class="carousel-animation-container"
         @mousedown="startDrag" 
         @mousemove="onMouseMove" 
         @mouseup="endDrag" 
         @mouseleave="endDrag"
         @touchstart="startDrag" 
         @touchmove="onMouseMove" 
         @touchend="endDrag"
         @touchcancel="endDrag">
      <div
        ref="carouselContent"
        class="carousel-content"
        :class="computedCarouselDirection === 'row' ? 'row' : 'column'"
        :style="{ transform: `translateX(${translateValue}px)` }"
      >
        <div
          v-for="(obj, index) in currentBrand"
          :key="index"
          class="carousel-item"
          @click="goToItem(obj)"
        >
          <slot :name="index">
            <img :src="obj.path" class="jar-image" loading="lazy" :draggable="false"/>
            <span class="name"> {{ obj.flavourData.flavour.name }} </span>
            <span class="product-line"> {{obj.flavourData.lineName}} </span>
          </slot>
        </div>
      </div>
      <div class="fade-overflow-left"></div>
      <div class="fade-overflow-right"></div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, onBeforeMount, onBeforeUnmount, watchEffect, inject, computed, toRaw } from 'vue';
import router from '@/router/index.js'

defineOptions({
  name: "Carousel"
})

const props = defineProps({
  brand: {
    type: Object,
    required: true
  },
  carouselDirection: {
    type: String,
    required: false,
    default: 'row'
  },
  visibleItems: {
    type: Number,
    required: false,
    default: 4 // Default to 4 visible items if not specified
  },
  brandsData:{
    type: Object,
    required: false
  }
});

const { isMobile, isTablet } = inject('screenSize')

// Assign currentBrand values from props to fetch imageurls and texts
let currentBrand = ref(null)
onBeforeMount(() => {
  currentBrand.value = props.brandsData[props.brand.name]
  console.log("Current brand:", toRaw(currentBrand.value))
})


function goToItem(val){
  // console.log('Item selected ===================================>', currentBrand.value)
  // console.log(toRaw(val))
  let brandName = ''
  if(props.brand.name === 'haa') brandName = 'HAA'
  else brandName = 'Okto'
  if(!moved.value){
    router.push({ 
      name: 'Product', 
      params: { selectedBrand: brandName},
      query : {
        line: val.flavourData.lineName,
        honey: val.flavourData.flavour.urlSlug
      }
      // query: {
      //   line: val.flavourData.lineName
      // }
    })
    .catch(err => {
      console.log("error while routing", err)
    });
  }
}

let computedCarouselDirection = computed(() => {
  if(isMobile.value) return 'column'
  else return 'row'
})


const carouselAnimationContainer = ref(null);
const carouselContent = ref(null);

const translateValue = ref(0);
const isDragging = ref(false);
const startX = ref(0);
const previousTranslate = ref(0);

const lastTranslateValue = ref(0);
const lastTime = ref(0);
const velocity = ref(0);

const itemWidth = ref(0);

watchEffect(() => {
  calculateItemWidth();
  updateTranslateBounds();
});

function calculateItemWidth() {
  requestAnimationFrame(() => {
    if (carouselContent.value) {
      const carouselItems = carouselContent.value.querySelectorAll('.carousel-item');
      if (carouselItems.length > 0) {
        itemWidth.value = carouselItems[0].clientWidth;
        updateTranslateBounds();
      }
    }
  });
}

// Gets called upon animationFrames - checks current value against max/min and adjusts if out of bounds
function updateTranslateBounds() {
  const maxTranslate = 0;
  const minTranslate = -(itemWidth.value * (props.brand.imageUrls.length - props.visibleItems));

  // Translate value is never lower than minTranslate (right direction) and higher than maxTranslate (left direction)
  translateValue.value = Math.max(Math.min(translateValue.value, maxTranslate), minTranslate);
}
onMounted(() => {
  calculateItemWidth();
  window.addEventListener('resize', calculateItemWidth);
  console.log("Brands data:", props.brandsData)
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', calculateItemWidth);
});

let moved = ref(false)
function startDrag(event) {
  if(isMobile.value ) return
  event.preventDefault();
  isDragging.value = true;
  startX.value = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX;
  previousTranslate.value = translateValue.value;
  moved.value = false;

  document.body.classList.add('dragging');
  carouselContent.value.style.transition = 'none';

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', endDrag);
  // passive = false due to https://chromestatus.com/feature/5093566007214080 
  document.addEventListener('touchmove', onMouseMove, { passive: false });
  document.addEventListener('touchend', endDrag);
  document.addEventListener('touchcancel', endDrag);

  lastTime.value = performance.now(); // Record the start time for velocity/inertia after release
}

function onMouseMove(event) {
  if (!isDragging.value) return;
  // event.preventDefault();

  const clientX = event.type === 'touchmove' ? event.touches[0].clientX : event.clientX;
  const deltaX = clientX - startX.value;
  translateValue.value = previousTranslate.value + deltaX;
  if (Math.abs(deltaX) > 5) { // threshold to consider it a drag
    // console.log("It is a drag")
    moved.value = true;
  } else {
    // console.log("not a drag")
    moved.value = false;
  }
  if(moved.value){
    // console.log("prevent from onMouseMouve")
    event.preventDefault()
  }
  // Calculate the velocity
  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime.value;
  velocity.value = (translateValue.value - lastTranslateValue.value) / deltaTime;
  lastTranslateValue.value = translateValue.value;
  lastTime.value = currentTime;
}

function endDrag(event) {
  if (!isDragging.value) return;
  isDragging.value = false;

  console.log("Moved enddrag", moved.value)
  if (moved.value) {
    event.preventDefault(); // prevent default only if it was a drag
  } else {
  }

  document.body.classList.remove('dragging');

  // Remove the event listeners to clean up after dragging
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', endDrag);
  // passive = false due to https://chromestatus.com/feature/5093566007214080 
  document.removeEventListener('touchmove', onMouseMove, { passive: false });
  document.removeEventListener('touchend', endDrag);

  snapToNearest()
}


function snapToNearest() {
  const maxTranslate = 0; // Maximum translate value (no scrolling past the first item)
  const minTranslate = -(itemWidth.value * (props.brand.imageUrls.length - props.visibleItems)); // Minimum translate value (no scrolling past the last visible items)

  // Calculate the nearest snap position
  const snapPosition = Math.round(translateValue.value / itemWidth.value) * itemWidth.value;
  translateValue.value = Math.max(Math.min(snapPosition, maxTranslate), minTranslate);

  // Re-enable the transition for snapping
  carouselContent.value.style.transition = 'transform 0.3s ease';
}

function preventDefaultSelection(event) {
  if (isDragging.value) {
    event.preventDefault();
  }
}
</script>

<style lang="scss" scoped>
.carousel-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-animation-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: grab;
  position: relative;
}

.carousel-content {
  height: 100%;
  display: flex;
  will-change: transform; /* Hint to the browser for better performance during transitions */
  &.row {
    flex-direction: row;
    align-items: center;
  }
  &.column {
    flex-direction: column;
    justify-content: center;
  }
}
.dragging{
  .carousel-item{
    .jar-image{
      cursor: grab !important;
    }
  }
}
.carousel-item {
  flex: 0 0 25%; /* Adjust based on the number of items visible */
  text-align: center;
  color: black;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  height: 85%;
  .jar-image {
    height: 80%;
    /* Disable drag behavior on the image */
    // pointer-events: none;
    object-fit: contain;
    cursor: pointer;
    @media(min-width: 1440px){
      // width: 80%;
    }
    @media(max-width: 480px){
      // min-height: 200px;
      max-width: 100%;
    }
  }
  .name{
    font-family:"DMSans";
    font-size: 15px;
    font-weight: 400;
    text-align: center;
    color: black;
    text-transform: uppercase;
    width: 80%;
    @media(min-width: 768px) and (max-width: 1440px){
      font-size: 12px;
    }
  }
  .product-line{
    font-family:"DMSans";
    font-size: 15px;
    font-weight: 700;
    text-align: center;
    color: black;
  }
}

.fade-overflow{
  &-right, &-left{
    @media(max-width: 1024px){
      display: none;
    }
  }
}
.fade-overflow-right{
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 10%; /* Adjust for the fade effect size */
  background: linear-gradient(to right, rgba(255, 255, 255, 0) 60%, rgba(255, 255, 255, 1) 100%);
  pointer-events: none;
}
.fade-overflow-left{
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 5%; /* Adjust for the fade effect size */
  background: linear-gradient(to left, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1));
  pointer-events: none;
}
</style>