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
        :class="carouselDirection === 'row' ? 'row' : 'column'"
        :style="{ transform: `translateX(${translateValue}px)` }"
      >
        <div
          v-for="(image, index) in brand.imageUrls"
          :key="index"
          class="carousel-item"
        >
          <slot :name="index">
            <img :src="image" class="jar-image" :draggable="false"/>
            <span class="name">master blender selection</span>
            <span class="product-line">Blend Series</span>
          </slot>
        </div>
      </div>
      <div class="fade-overflow-left"></div>
      <div class="fade-overflow-right"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Carousel"
}
</script>

<script setup>
import { ref, onMounted, onBeforeUnmount, watchEffect } from 'vue';

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
  }
});

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
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', calculateItemWidth);
});

function startDrag(event) {
  event.preventDefault();
  isDragging.value = true;
  startX.value = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX;
  previousTranslate.value = translateValue.value;

  // document.body.classList.add('dragging');
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
  event.preventDefault();

  const clientX = event.type === 'touchmove' ? event.touches[0].clientX : event.clientX;
  const deltaX = clientX - startX.value;
  translateValue.value = previousTranslate.value + deltaX;

  // Calculate the velocity
  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime.value;
  velocity.value = (translateValue.value - lastTranslateValue.value) / deltaTime;
  lastTranslateValue.value = translateValue.value;
  lastTime.value = currentTime;
}

function endDrag() {
  if (!isDragging.value) return;
  isDragging.value = false;

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
  overflow: hidden;
  cursor: grab;
  position: relative;
}

.carousel-content {
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

.carousel-item {
  flex: 0 0 25%; /* Adjust based on the number of items visible */
  text-align: center;
  color: black;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .jar-image {
    width: 100%;
    /* Disable drag behavior on the image */
    pointer-events: none;
  }
  .name{
    font-family:"DMSans";
    font-size: 15px;
    font-weight: 400;
    text-align: center;
    color: black;
    text-transform: uppercase;
    width: 80%;
  }
  .product-line{
    font-family:"DMSans";
    font-size: 15px;
    font-weight: 700;
    text-align: center;
    color: black;
  }
}

.fade-overflow-right{
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 10%; /* Adjust for the fade effect size */
  background: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1));
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