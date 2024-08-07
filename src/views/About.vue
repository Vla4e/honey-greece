<template>
<div class="about-page">
  <h1 v-if="!isMobile" id="floating-heading" class="floating-heading">Antonios' Team</h1>
  <div v-else class="hero-section">
    <h1 class="hero-heading">
      Hellenic
      <br/>
      Premium Honey
    </h1>
    <p class="hero-text">
      Allow us the pleasure of introducing the remarkable individuals who comprise our esteemed team, 
      each contributing their unique expertise and passion to our collective endeavor.
    </p>
  </div>
  <h2 v-if="isMobile" class="team-heading">Our Esteemed Team</h2>
  <div class="image-grid">
    <div v-if="!isMobile" id="textContainer" class="text-container">
      <span class="name">{{ currentlySelected.name }}</span>
      <span class="description">{{ currentlySelected.text }}</span>
    </div>
    <div
      v-for="(person, index) in personnel"
      :key="index"
      class="image-item"
      :class="[currentlySelected.name === person.name ? 'selected' : '', `image-item-${person.name}`]"
      @click="selectPerson(person, index)"
    >
      <slot :name="index">
        <!-- <span class="role">owner</span> -->
        <img 
          v-if="!isMobile"
          :src="person.url" 
          :draggable="false"
          :id="`image${index}`"
          class="image" 
        />
        <span 
          v-if="!isMobile"
          class="name"
        >
          {{ person.name.toUpperCase() }}
        </span>

        <div v-if="isMobile" class="image-section">
          <img 
            :src="person.url" 
            :draggable="false"
            :id="`image${index}`"
            class="image" 
          />
          <div :class="person.name"  class="floating-container">
            <span class="name">{{ person.name }}</span>
            <span class="role" v-html="person.role"></span>
          </div>
        </div>
        <div v-if="isMobile" class="text-container">
          <span class="description">{{ person.text }}</span>
        </div>

      </slot>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, inject } from 'vue';

const { isMobile } = inject('screenSize')

const imageModules = import.meta.glob('@/assets/pages/about/*.png', {eager: true});
let personnelTexts = {
  'antonios': `Antonios, the company owner and our visionary leader, exemplifies dedication by tirelessly accompanying our driver and beekeepers on their journeys, overseeing operations, and making crucial decisions to optimize honey production and create the finest natural blends. His unwavering commitment and hands-on approach are the driving force behind our company's success.`,
  'christos': `Christos, our dedicated and experienced beekeeper from the region of Fthiotida, meticulously tends to our hives, ensuring the finest quality honey straight from nature's bounty.`,
  'klion': `Klion, our diligent beekeeper, plays a crucial role in maintaining the excellence of our honey production, embodying dedication and expertise in every hive.`,
  'kostas': `Kostas, our dedicated driver, expertly navigates the diverse landscapes of Greece, transporting our beehives hundreds of kilometers to ensure they reach optimal floral sources for the finest honey flavors. His commitment to precision and efficiency enables us to harvest the best honey from each region's abundant flora.`,
  'eleni': `Eleni, the heart of our company, tirelessly coordinates all purchasing activities and oversees the seamless progression of sales from inception to completion. We are deeply grateful for her unwavering dedication and invaluable contributions to our team.`,
  'vaia': ` Vaia, our meticulous artisan, fills each jar with precision and crafts our delectable spreads in our small kitchen, ensuring every jar is handled with the utmost care and attention to detail. We are proud of her dedication to maintaining the highest standards of quality in every step of our production process.`
}
let personnelRoles = {
  'antonios': `company<br/>owner`,
  'christos': `beekeeper`,
  'klion': `beekeeper`,
  'kostas': `dedicated<br/>driver`,
  'eleni': `heart of<br/>our company`,
  'vaia': `meticulous<br/>artisan`
}
let personnel = Object.keys(imageModules).map((path) => {
  let splitPath = path.split('/')
  let name = splitPath[5].substring(0, splitPath[5].length-4)
  return {
    name,
    url: path,
    text: personnelTexts[name],
    role: personnelRoles[name]
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
  if(!textContainer) return;
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
  @media(max-width: 767px){
    width: 85%;
    margin: auto;
    display: flex;
    flex-direction: column;
    .hero-section{
      display: flex;
      flex-direction: column;
      .hero-heading{
        font-family: "DMSans";
        font-size: 15px;
        font-weight: 700;
        text-align: left;
        color: black;
      }
      .hero-text{
        font-family: "DMSans";
        font-size: 13px;
        font-weight: 400;
        text-align: left;
        color: black;
      }
    }

    .team-heading{
      font-family: "DM Serif";
      font-size: 32px;
      font-weight: 400;
      text-align: left;
      color: black;
      margin-bottom: 50px;
      align-self: flex-start;
    }

    .image-grid{
      flex-direction: column;
      .image-item{
        display: flex;
        flex-direction: column;
        width: 100% !important;
        margin-bottom: 40px;

        .image{
          width: 60%;
          // margin-bottom: 15px;
          z-index: 1;
        }
        .text-container{
          width: 100%;
          position: static;
        }
        .image-section{
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
          margin-bottom: 15px;
          .floating-container{
            display: flex;
            height: 100%;
            position: absolute;
            bottom: 0;
            z-index: 3;
            align-items: flex-end;
            .name, .role{
              font-family: "DMSans";
              text-align: left;
              line-height: 45px;
              writing-mode: vertical-rl;
              transform: rotate(180deg);
              color: #F0F4F5;
              text-transform: uppercase;
              word-break: break-word;
              text-align: left;
            }
            .name{
              font-size: 42px;
              font-weight: 700;
              align-self: flex-end;
            }
            .role{
              font-size: 36px;
              font-weight: 400;
            }
          }
        }
        &-antonios{
          .image{
            align-self: flex-end;
          }
          .text-container{
            .description{
              text-align: right;
            }
          }
        }

        &-christos{
          .image{
            align-self: center;
          }
          .text-container{
            .description{
              text-align: right;
            }
          }
          .floating-container{
            right: 0;
          }
        }

        &-klion{
          .image{
            align-self: center;
          }
          .text-container{
            .description{
              text-align: left;
            }
          }
        }

        &-eleni{
          .image{
            align-self: flex-end;
          }
          .text-container{
            .description{
              text-align: right;
            }
          }
        }

        &-kostas{
          .image{
            align-self: center;
            margin-right: 20%;
          }
          .text-container{
            .description{
              text-align: left;
            }
          }
          .floating-container{
            right: 0;
          }
        }
        
        &-vaia{
          .image{
            align-self: flex-start;
          }
          .text-container{
            .description{
              text-align: left;
            }
          }
          .floating-container{
            right: 0;
          }
        }
      }
    }
  }
}
</style>