
<script setup>
import { ref, onMounted, computed, watch } from 'vue'
defineOptions({
  name: 'ProductImage'
})

let props = defineProps({
  flavour: {
    type: Object,
    required: true
  },
  jarSizes: {
    type: String,
    required: true
  },
  productLine: {
    type: Object,
    required: true
  },
  brandUrlSlug: {
    type: Array,
    required: true
  },
  modelValue: {
    type: String,
    required: false
  }
})

let jarSizes = computed( ()=> props.jarSizes )
let currentJarSize = ref(null)
watch(() => jarSizes.value, (sizes) => {
  console.log("SIZE:", sizes)
  console.log("brandUrl", props.brandUrlSlug)
  if(props.brandUrlSlug && props.brandUrlSlug === 'haa'){
    currentJarSize.value = sizes[1]
  } else currentJarSize.value = sizes[1]
}, { immediate: true })
watch(() => props.flavour, async (flavour) => {
  console.log("Flavour changed:", flavour)
  await loadImage()
})

const emit = defineEmits(['update:modelValue']);
async function selectJarSize(size){
  console.log("Size selected: ", size)
  if(currentJarSize.value !== size){
    currentJarSize.value = size
    emit('update:modelValue', size)
    await loadImage()
  } else return
}

// Auto-import all images (lazy-loaded)
const images = import.meta.glob('/src/assets/images/jar-labels/**/*.png');
// console.log("Images:", images)
const imageUrl = ref(null);
async function loadImage() {
  console.log(`LoadImage ${props.brandUrlSlug}/${props.productLine.urlSlug}/${currentJarSize.value}/${props.flavour.urlSlug}.png`)
  const filePath = `/src/assets/images/jar-labels/${props.brandUrlSlug}/${props.productLine.urlSlug}/${currentJarSize.value}/${props.flavour.urlSlug}.png`;

  if (images[filePath]) {
    // console.log("actually found it")
    const module = await images[filePath]();
    imageUrl.value = module.default;
    // console.log("image URL:", imageUrl.value)
  }
};
onMounted(async () => {
  // console.log("Prop: ", props.flavour)
  // console.log("productl ine: ", props.productLine)
  // console.log("brand: ", props.jarSizes)
  await loadImage()
})


</script>

<template>
  <div class="product-image">
    <div class="product-image-container">
      <Transition name="slide" class="slide-transition" mode="out-in">
        <img :key="imageUrl" class="jar-image" :src="imageUrl" id="imageRef"/>
      </Transition>
    </div>

    <div class="size-selection">
      <button 
        v-if="jarSizes"
        v-for="size in jarSizes" 
        class="size-selection-button"
        :class="currentJarSize === size ? 'selected' : ''"
        @click="selectJarSize(size)"
      >
        {{ size }}
      </button>
    </div>

  </div>
</template>

<style lang="scss" scoped>
.product-image{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .product-image-container{
    width: 100%;
    height: 100%;
    overflow: hidden;
    mask-image: linear-gradient(to right, rgba(0, 0, 0, 0), black 15%, black 85%, rgba(0, 0, 0, 0));
    -webkit-mask-image: linear-gradient(to right, rgba(0, 0, 0, 0), black 15%, black 85%, rgba(0, 0, 0, 0));
    img{
      height: 100%;
      width: auto;
    }
  }
  .size-selection{
    display: flex;
    justify-content: center;
    width: 100%;
    // margin-top: -40px;
    z-index: 11;
    .size-selection-button{
      color: #000;
      font-family: 'DMSans';
      font-size: 16px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
      letter-spacing: 2.72px;
      text-transform: uppercase;
      background: transparent;
      outline: none !important;
      border: none !important;
      &:hover, &:active{
        font-weight: 700;
        transition: font-weight ease-in-out 0.15s;
      }
      &.selected{
        font-weight: 700;
        // background: red;
      }
    }
    .size-selection-button:not(:last-child){
      margin-right: 20px;
    }
  }
}
/* Transition */
.slide-enter-active, .slide-leave-active {
  transition: transform 0.5s, opacity 0.5s;
}

.slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}
.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.slide-enter-to {
  transform: translateX(0);
  opacity: 1;
}

</style>