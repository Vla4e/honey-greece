<template>
  <div class="product-page-container">
    <span class="floating-text">
      {{ selectedSubCategory.name }}
    </span>

    <div class="series-selection">
      <div
        class="series-item"
        v-for="(category, idx) in mainCategories"
        :class="selectedCategory === category ? 'selected' : ''"
        @click="selectCategory(category)"
        :key="idx"
      >
        {{ category }}
        <div
          class="stylish-pointer"
          :style="selectedCategory === category ? 'display: flex;' : 'display: none;'"
        >
          <img :src="pointerLine" class="pointer-line" />
          <img :src="pointerCircle" class="pointer-circle" />
        </div>
      </div>
      <div class="selected-description">
        <!-- <h1 class="description-heading">{{ selectedSubCategory.name }}</h1> -->
        <h2 class="description-subheading">{{ selectedSubCategory.tagline }}</h2>
        <span class="description-text">{{ selectedSubCategory.description }}</span>
        <div class="technical-sheet">
          Technical Sheet <img :src="downloadIcon" class="download-sheet" />
        </div>
      </div>
    </div>

    <div class="product-viewer">
      <ProductScene />
    </div>

    <div class="blend-selection">
      <!-- <span class="main-categories"></span> -->
      <span
        class="blend"
        :class="seriesItem.name === selectedSubCategory.name ? 'selected' : ''"
        v-for="(seriesItem, idx) in selectedCategoryArray"
        :key="idx"
        @click="selectSubcategory(seriesItem)"
      >
        {{ seriesItem.name }}
        <div
          class="stylish-pointer-left"
          :style="
            seriesItem.name === selectedSubCategory.name
              ? 'display: flex;'
              : 'display: none;'
          "
        >
          <img :src="pointerCircle" class="pointer-circle" />
          <img :src="pointerLine" class="pointer-line" />
        </div>
      </span>
    </div>
  </div>
</template>

<script>
import ProductScene from "../components/ProductScene.vue";
import { watch, onMounted, ref, computed } from "vue";
import downloadIcon from "@/assets/pages/product-page/download-icon.png";
import jarMockup from "@/assets/pages/product-page/jar-mockup.png";
import pointerLine from "@/assets/pages/product-page/pointer-line.svg";
import pointerCircle from "@/assets/pages/product-page/pointer-circle.svg";
export default {
  components: { ProductScene },
  setup() {
    let blends = [
      {
        name: "Honey Afficionado Blend No 14",
        tagline: "Collected in Greece",
        description: `"Honey Afficionado, a super-premium honey crafted from a blend of top honey varieties, it boasts a distinctive ""honey"" flavor that is bold and robust.
Sourced from pristine environments, Honey Afficionado is a celebration of purity and quality, with a smooth texture and mesmerizing golden hue.
Available in 300g and 150g jars,"
`,
      },
      {
        name: "Forest Blend No 4",
        tagline: "Collected in Greece",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad`,
      },
      {
        name: "Mediterranean Blend No7",
        tagline: "Ultra Premium Honey",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad`,
      },
      {
        name: "Nature's Blend",
        tagline: "Ultra Premium Honey",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad`,
      },
      {
        name: "Master Blender's Selection Limited Reserve",
        tagline: "Ultra Premium Honey",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad`,
      },
    ];
    let monoFlorals = [
      {
        name: "Oak Limited Reserve",
        tagline: "Ultra Premium Honey",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad`,
      },
      {
        name: "Thyme Limited Reserve",
        tagline: "Ultra Premium Honey",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad`,
      },
      {
        name: "Cotton Blossom Limited Reserve",
        tagline: "Ultra Premium Honey",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad`,
      },
      {
        name: "Fir Limited Reserve",
        tagline: "Ultra Premium Honey",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad`,
      },
      {
        name: "Pinewood Limited Reserve",
        tagline: "Ultra Premium Honey",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad`,
      },
    ];
    let mainCategories = ["Blends", "Monoflorals"];
    //Default to first array entry
    let selectedCategory = ref("Blends");
    let selectedCategoryArray = ref(blends);
    // console.log("SELECTEDCATARRAY", selectedCategoryArray.value);
    let selectedSubCategory = ref(selectedCategoryArray.value[0]);
    // console.log("SELECTEDSUBCAT", selectedSubCategory.value);
    function selectCategory(value) {
      // console.log("SVALUE", value);
      if (value !== selectedCategory.value) {
        selectedCategory.value = value;
        if (value === "Blends") {
          selectedCategoryArray.value = blends;
          selectedSubCategory.value = blends[0];
        } else {
          selectedCategoryArray.value = monoFlorals;
          selectedSubCategory.value = monoFlorals[0];
        }
      }
    }
    function selectSubcategory(value) {
      // console.log("VALUE", value);
      selectedSubCategory.value = value;
    }
    return {
      blends,
      monoFlorals,
      selectedCategory,
      selectedCategoryArray,
      selectedSubCategory,
      mainCategories,
      downloadIcon,
      jarMockup,
      pointerCircle,
      pointerLine,
      selectCategory,
      selectSubcategory,
    };
  },
};
</script>

<style lang="scss" scoped>
.main-categories {
  border: 1px solid gray;
  width: 1000px !important;
  position: absolute;
}
.product-page-container {
  position: relative;
  // display: flex;
  // width: 100%;
  justify-content: space-between;
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 1fr 1fr 1fr;
  flex-grow: 0 !important;
  margin-top: 5vh !important;
  .floating-text {
    z-index: 1;
    color: rgba(0, 0, 0, 0.1);
    font-family: "DMSans";
    font-size: 60px;
    font-style: normal;
    font-weight: 700;
    letter-spacing: 6px;
    text-transform: uppercase;
    white-space: nowrap;
    position: absolute;
    left: 0%;
    top: 0%;
    animation: fadeIn 0.5s;
    -webkit-animation: fadeIn 5s;
    -moz-animation: fadeIn 5s;
    -o-animation: fadeIn 5s;
    -ms-animation: fadeIn 5s;
  }
  .blend-selection {
    // width: calc(100vw/3);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    align-self: center;
    .blend {
      position: relative;
      .stylish-pointer-left {
        position: absolute;
        right: 100%; /* Move to the right end of the sibling */
        transform: translateX(50%); /* Center horizontally */
        top: 50%; /* Center vertically (optional) */
        transform: translateY(-50%);
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: auto;
        .pointer-line {
          width: 100px;
        }
        .pointer-circle {
        }
      }
    }
  }
  .series-selection {
    // position: absolute;
    // top: 30%;
    // right: 25%;
    // max-height: 20%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    .series-item {
      position: relative;
      .stylish-pointer {
        position: absolute;
        left: 100%; /* Move to the right end of the sibling */
        transform: translateX(-50%); /* Center horizontally */
        top: 50%; /* Center vertically (optional) */
        transform: translateY(-50%);
        display: flex;
        justify-content: center;
        align-items: center;
        .pointer-line {
          width: 400px;
        }
        .pointer-circle {
        }
      }
    }
  }
  .series-selection,
  .blend-selection {
    margin-top: 10vh;
    .blend,
    .series-item {
      color: #000;
      font-family: "DMSans";
      font-size: 16px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
      letter-spacing: 2.72px;
      text-transform: uppercase;
      transition: font-size 0.15s ease;
      text-align: left;
      min-height: 25px;
      cursor: pointer;
      z-index: 6;
      &:hover {
        font-size: 17px;
      }
      &.selected {
        font-size: 19px;
        font-weight: 700;
        letter-spacing: 3.23px;
      }
    }
  }
  .selected-description {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: start;
    // align-self: flex-end;
    // padding-bottom: 10%;
    .description-heading {
      color: #000;
      font-family: "DMSans";
      font-size: 35px;
      font-style: normal;
      font-weight: 700;
      letter-spacing: 3px;
      // text-transform: uppercase;
      min-height: 110px;
    }
    .description-subheading {
      color: #000;
      font-family: "DMSans";
      font-size: 24px;
      font-style: normal;
      font-weight: 400;
      letter-spacing: 2.6px;
      text-transform: capitalize;
    }
    .description-text {
      color: #000;
      font-family: "DMSans";
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      letter-spacing: 1.4px;
    }
    .technical-sheet {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;
      color: #000;
      font-family: "DMSans";
      font-size: 20px;
      font-style: normal;
      font-weight: 400;
      letter-spacing: 1.2px;
      text-transform: capitalize;
      margin-top: 15px;
      .download-sheet {
        width: 20px;
        height: 20px;
        margin-left: 15px;
        cursor: pointer;
        transition: all ease-in-out 0.2s;
        &:hover{
          width: 22px;
          height: 22px;
        }
      }
    }
  }
  .product-viewer {
    position: relative;
    // width: 40%;
    display: flex;
    height: 100%;
    z-index: 5;
    margin-top: 5vh;
    // align-self: center;
    .product-image {
      max-height: 60vh;
    }
  }
}
@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
