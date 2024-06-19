<template>
<div class="about-page">
  <h1 id="floating-heading" class="floating-heading">Antonios' Team</h1>
  <div class="image-grid">
    <div id="textContainer" class="text-container">
      <span class="name">{{ currentlySelected.name }}</span>
      <span class="description">{{ currentlySelected.text }}</span>
    </div>
    <div
      v-for="(person, index) in personnel"
      :key="index"
      class="image-item"
      :class="currentlySelected.name === person.name ? 'selected' : ''"
      @click="selectPerson(person, index)"
    >
      <slot :name="index">
        <!-- <span class="role">owner</span> -->
        <img 
        :src="person.url" 
        :draggable="false"
        :id="`image${index}`"
        class="image" 
        />
        <span class="name">{{ person.name.toUpperCase() }}</span>
      </slot>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const imageModules = import.meta.glob('@/assets/pages/about/*.png', {eager: true});
let personnelTexts = {
  'antonios': `Antonios, the company owner and our visionary leader, exemplifies dedication by tirelessly accompanying our driver and beekeepers on their journeys, overseeing operations, and making crucial decisions to optimize honey production and create the finest natural blends. His unwavering commitment and hands-on approach are the driving force behind our company's success.`,
  'christos': `Christos, our dedicated and experienced beekeeper from the region of Fthiotida, meticulously tends to our hives, ensuring the finest quality honey straight from nature's bounty.`,
  'klion': `Klion, our diligent beekeeper, plays a crucial role in maintaining the excellence of our honey production, embodying dedication and expertise in every hive.`,
  'kostas': `Kostas, our dedicated driver, expertly navigates the diverse landscapes of Greece, transporting our beehives hundreds of kilometers to ensure they reach optimal floral sources for the finest honey flavors. His commitment to precision and efficiency enables us to harvest the best honey from each region's abundant flora.`,
  'eleni': `Eleni, the heart of our company, tirelessly coordinates all purchasing activities and oversees the seamless progression of sales from inception to completion. We are deeply grateful for her unwavering dedication and invaluable contributions to our team.`,
  'vaia': ` Vaia, our meticulous artisan, fills each jar with precision and crafts our delectable spreads in our small kitchen, ensuring every jar is handled with the utmost care and attention to detail. We are proud of her dedication to maintaining the highest standards of quality in every step of our production process.`
}
let personnel = Object.keys(imageModules).map((path) => {
  let splitPath = path.split('/')
  let name = splitPath[5].substring(0, splitPath[5].length-4)
  return {
    name,
    url: path,
    text: personnelTexts[name]
  }
})

let largeImagePositionReference = null;
let currentlySelected = ref({})
let currentlySelectedIdx = ref(0)
let currentlyRunning = false
function selectPerson(person, idx){
  if(currentlyRunning) return
  if(currentlySelected.value.name !== person.name){
    currentlyRunning = true;
    setTimeout(() => {
      currentlyRunning = false
    }, 500)
    currentlySelected.value = person
    currentlySelectedIdx.value = idx
    calculateTextPosition()
  }
}

function calculateTextPosition() {
  const largeImage = document.getElementById(`image${currentlySelectedIdx.value}`);
  const textContainer = document.getElementById('textContainer');

  let smallImage;
  let leftHalf = (currentlySelectedIdx.value + 1) > (personnel.length / 2) ? false : true;
  if (leftHalf) {
      smallImage = document.getElementById(`image${currentlySelectedIdx.value + 1}`);
      textContainer.style.transform = "translateX(50%)"
    } else {
      smallImage = document.getElementById(`image${currentlySelectedIdx.value - 1}`);
      textContainer.style.transform = "translateX(-50%)"
  }
  
  textContainer.style.opacity = 0;
  textContainer.style.transition = 'none';
  setTimeout(() => {
    textContainer.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
    textContainer.style.transform = "translateX(0%)"
    textContainer.style.opacity = 1; 
  }, 500)

  setTimeout(()=> {

    const largeImageRect = largeImage.getBoundingClientRect();

    const textRectTop = largeImage.top;
    textContainer.style.top = `${textRectTop}px`;

    if (leftHalf) {
      const textRectLeft = largeImageRect.right + 25;
      textContainer.style.top = `${textRectTop}px`;
      textContainer.style.right = '';
      textContainer.style.left = `${textRectLeft}px`;
      textContainer.style.alignItems = 'flex-start'
      textContainer.children[1].style.textAlign = 'left';
    } else {
      const textRectRight = window.innerWidth - largeImageRect.left + 25;
      textContainer.style.left = '';
      textContainer.style.right = `${textRectRight}px`
      textContainer.style.alignItems = 'flex-end'
      textContainer.children[1].style.textAlign = 'right';
    }
    if(!largeImagePositionReference){
      console.log("SETTING LARGEIMAGEPOSREF")
      largeImagePositionReference = largeImageRect
      const floatingHeading = document.getElementById('floating-heading')
      floatingHeading.style.left = `${largeImageRect.left}px`;
      // console.log("FH", floatingHeading.style)
    }
  }, 500)

  
}

onMounted( async () => {
  currentlySelected.value = personnel[0]
  await nextTick()
  calculateTextPosition()
  window.addEventListener('resize', calculateTextPosition);
})
onUnmounted(() => {
  window.removeEventListener('resize', calculateTextPosition)
})

</script>

<style lang="scss" scoped>
.about-page{
  display: flex;
  align-items: flex-end;
  padding-bottom: 30px;
  .floating-heading{
    font-family: "DMSans";
    font-size: 100px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-align: left;
    text-transform: uppercase;
    color: #0000001A;
    margin: 0px !important;
    position: absolute;
    top: 15%;
    // left: 5%;
  }
  .image-grid{
    width: 100%;
    display: flex;
    .image-item{
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      width: 14%;
      position: relative;
      transition: width 0.3s ease-in-out;
      .name{
        color: black;
        font-size: 16px;
        font-family: "DMSans";
        font-weight: 400;
        font-style: normal;
        align-self: flex-start;
      }

      &.selected{
        width: 30%;
        .image{
          &:hover{
            transform: scale(1);
          }
        }
      }

      .image{
        width: 100%;
        cursor: pointer;
        transition: transform 0.2s ease-in-out;
        transform-origin: bottom left;
        &:hover{
          transform: scale(1.05);
        }
      }


      &:not(:last-child){
        margin-right: 25px;
      }
    }
    .text-container{
      position: absolute;
      width: 40%;
      // top: 20%;
      // left: 30%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      // transition: opacity 0.5s ease-in;
      .name{
        color: black;
        text-transform: uppercase;
        text-align: left;
        font-weight: 700;
        margin-bottom: 10px;
      }
      .description{
        color: black;
        text-align: left;
      }
    }
  }
}
</style>