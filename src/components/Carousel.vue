<template>
  <div class="carousel-container">
    <button @click="prev">Prev</button>
    <TransitionGroup name="slide" tag="div" class="carousel-content">
      <div
        v-for="(item, index) in items"
        :key="item.id"
        v-show="index === currentIndex"
        class="carousel-item"
      >
        <slot :name="item.slotName">{{ item.content }}</slot>
      </div>
    </TransitionGroup>
    <button @click="next">Next</button>
  </div>
</template>


<script>
export default {
  name: "Carousel"
}
</script>
<script setup>
import { ref } from 'vue';

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
});

const currentIndex = ref(0);

const next = () => {
  currentIndex.value = (currentIndex.value + 1) % props.items.length;
};

const prev = () => {
  currentIndex.value = (currentIndex.value + props.items.length - 1) % props.items.length;
};
</script>

<style lang="scss" scoped>
.carousel-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-content {
  width: 300px;
  height: 200px;
  overflow: hidden;
  position: relative;
}

.carousel-item {
  width: 300px;
  height: 200px;
  position: absolute;
  left: 0;
  right: 0;
}

.slide-enter-active, .slide-leave-active {
  transition: transform 0.5s ease;
}

.slide-enter-from, .slide-leave-to {
  transform: translateX(100%);
}

.slide-leave-from, .slide-enter-to {
  transform: translateX(0);
}
</style>
