<template>
  <div class="all-products-page">
    <div v-if="isMobile"  class="mobile-selection">
      <span class="selection-description">
        Discover our complete range of products
      </span>
      <div class="selection">
        <div 
          v-for="(brand, idx) of brands" 
          :key="idx" 
          class="item"
          :class="currentlySelectedBrand === brand.name ? 'selected' : ''"
          @click="currentlySelectedBrand = brand.name"
        >
          {{ brand.fullName }}
        </div>
      </div>
    </div>
    <template v-for="( brand, idx )  of brands">
      <KeepAlive>
        <div 
          class="brand"
          v-if="computeVisibility(brand.name)"
          :key="idx"
        >
          <div v-if="!isMobile" class="brand-info-container">
            <span class="heading">
              {{ brand.fullName }}
            </span>
            <span class="subheading">
              {{ brand.name === 'haa' ? 'Ultra ' : '' }}Premium Greek Honey
            </span>
            <span class="description">
              {{ brand.brandDescription }}
            </span>
            <router-link :to="`/product/${brand.name === 'haa' ? 'HAA' : 'Okto'}`" class="explore-link">
              <span>Explore complete range</span>
              <img :src="rightArrow" class="arrow"/>
            </router-link>
          </div>
          <Carousel
            class="carousel"
            :brand="brand"
            :brandsData="matchedData"
          />
          <router-link v-if="isMobile" :to="`/product/${brand.name === 'haa' ? 'HAA' : 'Okto'}`" class="explore-link">
            <span>Explore complete range</span>
            <img :src="rightArrow" class="arrow"/>
          </router-link>
        </div>
      </KeepAlive>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, toRaw, inject, computed } from 'vue';
import rightArrow from '@/assets/pages/all-products/right-arrow.svg'
import brandConfigs from '@/assets/brand-information/index.js'


let haaConfig = brandConfigs['HAA']
let oktoConfig = brandConfigs['Okto']
// console.log("Brandconf", brandConfigs)

let emitter = inject('emitter')
emitter.emit('switchTextColor')

const imageModules = import.meta.glob('@/assets/images/jar-labels/**/*.png', {eager: true});
let imagePaths = Object.keys(imageModules).map((path) => {
  return path
})
let categorizedImageUrls;
let matchedData = {
  "haa" : [],
  "okto": []
};

async function fillCategorizedImageUrls(){
  //Fill categorizedImageUrls with paths to images
  let imageUrls = {}
  let allImageUrls = {}
  let infoObject = {}
  console.log("Matched Data:", matchedData)
  Object.values(imageModules).forEach((path, idx) => {
    let splitPath = imagePaths[idx].split('/');
    console.log("Splitpath", splitPath)
    let brand = splitPath[5];
    let line = splitPath[6];
    let size = splitPath[7];
    let flavour = splitPath[8];
    // console.log("Current brand", brand)
    // if (!imageUrls[brand]) {
    //   imageUrls[brand] = {};
    //   allImageUrls[brand] = [];
    // }
  
    // if (!imageUrls[brand][line]) {
    //   imageUrls[brand][line] = {};
    // }
    // if (!imageUrls[brand][line][size]) {
    //   imageUrls[brand][line][size] = [];
    // }
  
    // imageUrls[brand][line][size].push({
    //   path,
    //   flavour: flavour.split('.')[0]
    // });
    console.log("Size:", size)
    let flavourData = findFlavourData(brand, line, flavour);
    if (flavourData) {
      if(size === '300g'){
        console.log("!size matched", brand)
        if(matchedData[brand] && brand !== 'okto'){
          console.log("brand is HAA")
          matchedData[brand].push({
            path: path.default,
            flavourData: flavourData,
            line: line
          });
        }
      } else if (size === '450g'){
        console.log("!size 450 matched", brand)
        if(matchedData[brand] && brand === 'okto'){
          console.log("brand is Okto")
          matchedData[brand].push({
            path: path.default,
            flavourData: flavourData,
            line: line
          });
        }
      }
    }
    if(size === '300g'){
      if(allImageUrls[brand]){
        allImageUrls[brand].push({
          path: path.default,
          flavour: flavour.split('.')[0],
          line: line
        })
      } else {
        allImageUrls[brand] = []
        allImageUrls[brand].push({
          path: path.default,
          flavour: flavour.split('.')[0],
          line: line
        })
      }
    }
  })
  
  // console.log('tempObjArr', infoObject)
  // console.log("MATCHED DATA", matchedData)
  return {allImageUrls, infoObject}
}
// Helper function to find flavour data from brandConfigs based on brand, line, and flavour slug
function findFlavourData(brandSlug, lineSlug, flavourSlug) {
  let brandConfig = [];
  // console.log("config lineslug", lineSlug)
  if(brandSlug==='haa'){
    brandConfig = haaConfig
  } else {
    brandConfig = oktoConfig
  }
  if (!brandConfig) return null;
  // console.log("BRANDCONFIG:", brandConfig.brand)
  // console.log("lineSLug:", lineSlug)

  if((lineSlug === 'monoflorals' && brandConfig.brand === 'HAA') || (lineSlug === 'multiflorals' && brandConfig.brand === 'Okto')) return;

  let lineConfig = brandConfig.brandProductLines[lineSlug.charAt(0).toUpperCase() + lineSlug.slice(1)];
  // console.log("LINE CONFIG CALLED:", lineConfig.name)
  let lineName = lineConfig.name
  if (!lineConfig) return null;

  let flavour = lineConfig.flavours.find(f => f.urlSlug === flavourSlug.split('.')[0]);
  if(flavour){
    let dataObject = {
      flavour,
      lineName
    }
    return dataObject; // Return the flavour object or null if not found
  } else return null
}

const { isMobile } = inject('screenSize')
let currentlySelectedBrand = ref('haa')
function computeVisibility(brandName) {
  // console.log("COMPUTING VISIBILITY", brandName, toRaw(currentlySelectedBrand.value), toRaw(isMobile.value))
  if(isMobile.value){
    return currentlySelectedBrand.value === brandName; // return function to pass brand.name argument into
  } else return true
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
  // console.log("IMAGEURLS", imageUrls)
  categorizedImageUrls = imageUrls.allImageUrls
  brands.value = [
    {
      name: 'haa',
      fullName: 'Honey Apiary Academy',
      brandDescription: 'At Honey Academy Apiary, our ultra-premium brand maintains top-tier quality and craftsmanship. Through advanced procedures, we meticulously select limited cells, transporting them to prime vegetation areas. This precision guarantees each jar represents excellence, delivering an extraordinary honey experience for discerning palates.',
      carouselItems: carouselItems,
      imageUrls: categorizedImageUrls['haa']
    },
    {
      name: 'okto',
      fullName: 'Oktώ',
      brandDescription: `Oktώ stands as our esteemed premium brand, known for its exceptional quality and unwavering commitment to excellence. Focused on superior taste and consistency, Oktώ offers a range of premium honey selections, each embodying the hallmark of quality and authenticity synonymous with Hellenic Premium Honey.`,
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
  max-height: 90%;
  .mobile-selection{
    box-shadow: 1px 1px 10px 1px #0000001A;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    .selection-description{
      display: flex;
      align-items: center;
      width: 90%;
      margin: auto;
      // justify-content: flex-start;
      font-family: "DMSans";
      font-size: 20px;
      font-weight: 700;
      line-height: 26.04px;
      letter-spacing: 0.1em;
      color: black;
      text-align: left;
      flex-grow: 1;
    }
    .selection{
      display: flex;
      justify-content: space-around;
      width: 90%;
      margin: auto;
      margin-bottom: 15px;
      .item{
        color: black;
        font-family: "DMSans";
        font-size: 13px;
        font-weight: 400;
        transition: font-weight 0.25s ease;
        &.selected{
          font-weight: 700;
        }
      }
    }
    
    @media(min-width: 768px){
      display: none;
    }
  }
  .brand{
    display: flex;
    justify-content: space-between;
    align-items: center;
    @media(min-width: 768px){
      height: 50%;
    }
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
      

      .okto-heading{
        .okt{
          font-family: "DMSans";
          font-size: 24px !important;
          font-weight: 700;
          text-align: left;
          width: 100%;
          color: black !important;
        }
        .omega{
          font-family: "DMSans";
          font-size: 24px !important;
          font-weight: 700;
          text-align: left;
          width: 100%;
          font-size: calc(24px*1.22) !important;
          color: black !important;
        }
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
    }
    .carousel{
      width: 75%;
      height: 100%;
    }
  }
  
  .explore-link{
    display: flex;
    align-items: center;
    // justify-content: space-between;
    width: 100%;
    @media(max-width: 767px){
      align-self: center;
      margin-top: 40px;
      margin-bottom: 25px;
      justify-content: center;
    }
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
    transition: letter-spacing 0.3s ease;
    &:hover{
      letter-spacing: 2px;
    }
  }
    
  @media(max-width: 767px){
    justify-content: flex-start;
    .brand{
      flex-direction: column;
      .brand-info-container{
        width: 100%;
      }
      .carousel-container{
        .carousel-animation-container{
          .carousel-content{
            .carousel-item{
              background-color: red;
              .jar-image{
                width: auto;
                height: 20%;
              }
            }
          }
        }
      }
    }
  }
}
</style>