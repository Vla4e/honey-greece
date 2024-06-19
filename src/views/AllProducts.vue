<template>
  <div class="all-products-page">
    <div v-for="(brand,idx)  of brands" :key="idx" class="row">
      <div class="brand-info-container">
        <span class="heading">
          Honey Apiary Academy
        </span>
        <span class="subheading">
          Ultra Premium Greek Honey
        </span>
        <span class="description">
         Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
        </span>
        <router-link :to="`/product/${brand.name}`" class="explore-link">
          <span>Explore complete range</span>
          <img :src="rightArrow" class="arrow"/>
        </router-link>
      </div>
      <Carousel
        class="carousel"
        :brand="brand"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, toRaw, inject } from 'vue';
import rightArrow from '@/assets/pages/all-products/right-arrow.svg'

let emitter = inject('emitter')
emitter.emit('switchTextColor')
const imageModules = import.meta.glob('@/assets/images/jar-labels/**/*.png', {eager: true});
let categorizedImageUrls;

async function fillCategorizedImageUrls(){
  //Fill categorizedImageUrls with paths to images
  let imageUrls = {}
  let allImageUrls = {}
  Object.keys(imageModules).forEach(path => {
    let splitPath = path.split('/');
    
    let brand = splitPath[5];
    let line = splitPath[6];
    let size = splitPath[7];
  
    if (!imageUrls[brand]) {
      imageUrls[brand] = {};
      allImageUrls[brand] = [];
    }
  
    if (!imageUrls[brand][line]) {
      imageUrls[brand][line] = {};
    }
    if (!imageUrls[brand][line][size]) {
      imageUrls[brand][line][size] = [];
    }
  
    imageUrls[brand][line][size].push(path);
    if(size === '300g'){
      allImageUrls[brand].push(path)
    }
  })
  return {imageUrls, allImageUrls}
}




const carouselItems = [
  { id: 1, slotName: 'item1', content: 'First Item: Welcome to the Carousel!' },
  { id: 2, slotName: 'item2', content: 'Second Item: Enjoy your ride.' },
  { id: 3, slotName: 'item3', content: "Third Item: Don't forget to check all our features." },
  { id: 4, slotName: 'item4', content: 'Fourth Item: Last one, hope you had fun!' },
  { id: 5, slotName: 'item4', content: 'F Item: Last one, hope you had fun!' },
  { id: 6, slotName: 'item4', content: 'S Item: Last one, hope you had fun!' },
  { id: 7, slotName: 'item4', content: 'SE Item: Last one, hope you had fun!' }
];
let brands = ref([])
onMounted(async () => {
  let imageUrls = await fillCategorizedImageUrls()
  categorizedImageUrls = imageUrls.allImageUrls
  brands.value = [
    {
      name: 'haa',
      carouselItems: carouselItems,
      imageUrls: categorizedImageUrls['haa']
    },
    {
      name: 'okto',
      carouselItems: carouselItems,
      imageUrls: categorizedImageUrls['okto']
    }
  ]
});


</script>

<style lang="scss" scoped>
.all-products-page{
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  .row{
    display: flex;
    justify-content: space-between;
    align-items: center;
    .brand-info-container{
      width: 25%;
      display: flex;
      flex-direction: column;
      .heading{
        font-family: "DMSans";
        font-size: 24px;
        font-weight: 700;
        text-align: left;
        width: 100%;
        color: black;
        margin-bottom: 5px;
      }
      .subheading{
        font-family: "DMSans";
        font-size: 20px;
        font-weight: 400;
        text-align: justify;
        width: 100%;
        color: black;
        margin-bottom: 10px;
      }
      .description{
        font-family: "DMSans";
        font-size: 14px;
        font-weight: 400;
        text-align: left;
        width: 100%;
        color: black;
        margin-bottom: 20px;
      }
      .explore-link{
        display: flex;
        align-items: center;
        // justify-content: space-between;
        width: 100%;
        span{
          font-family: "DMSans";
          font-size: 14px;
          font-weight: 700;
          text-align: left;
          color: black;
          margin-right: 10px;
        }
        .arrow{
          width: 20px;
        }
      }
    }
    .carousel{
      width: 75%;
    }
  } 
}
</style>