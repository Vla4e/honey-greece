<template>
  <div v-if="isMobile" class="mobile-header">
    HELLENIC <br/> PREMIUM HONEY
    <!-- {{ tabDimensions }} -->
  </div>
  <div class="tab-container" :class="currentClickedTab ? `tab-container-clicked-${currentClickedTab}`: 'no-clicked-tab'">
    <Tab
    class='order-target-1'
    :tabId="1"
    :tabTitle="tabTitles[0]"
    :tabText="oktoConfig.brandDescriptionShort"
    :brand="oktoConfig.brand"
    :productLines="oktoConfig.productLines"
    />
    <Tab 
    class='order-target-2'
    :tabId="2"
    :tabTitle="tabTitles[1]"
    :tabText="HAAConfig.brandDescriptionShort"
    :brand="HAAConfig.brand"
    :productLines="HAAConfig.productLines"
    :line="tab2Line"
    />
    <Tab 
    class='order-target-3'
    :tabId="3" 
    :tabTitle="tabTitles[2]"
    :tabText="tabTexts[2]"
    :brand="'Melculum'"
    :productLines="tab3Series"
    :line="tab3Line"
    line="Melculum"
    />
  </div>
</template>

<script>
import Tab from "@/components/Tabs/Tab.vue"
import { inject, ref, onMounted, onUnmounted } from 'vue';

import brandConfigs from "@/assets/brand-information/index.js"

export default {
  components: { Tab },
  setup(){
    const { isMobile } = inject('screenSize')
    let HAAConfig = brandConfigs['HAA']
    let oktoConfig = brandConfigs['Okto']

    let currentClickedTab = ref(null)
    let emitter = inject('emitter')


    let tabDimensions = ref({
      tab1: '33.33%',
      tab2: '33.33%',
      tab3: '33.33%'
    });

    function adjustTabDimensions(activeTabId) {
      console.log("Activetabid", activeTabId);
      let defaultDimension = 33.33; // Default dimension for all tabs when none is active
      let activeDimension = 50; // Dimension for active tab
      let inactiveDimension = 25; // Dimension for inactive tabs
      let dimensionType = isMobile.value ? 'height' : 'width'; // Determine dimension type based on mobile status
      console.log("Dimensiontype", dimensionType)
      // Check if the clicked tab is already active, if so, reset all to default
      if (currentClickedTab.value === activeTabId) {
          // Reset all tabs to default state
          tabDimensions.value = {
              tab1: `${defaultDimension}%`,
              tab2: `${defaultDimension}%`,
              tab3: `${defaultDimension}%`
          };
          // Reset the current clicked tab tracker
          currentClickedTab.value = null;
          console.log("Should reset currentclicked", currentClickedTab.value)
      } else {
          // Update current clicked tab
          currentClickedTab.value = activeTabId;

          // Determine if an active tab ID is provided and valid
          let isActiveValid = ["HAA", "Okto", "Melculum"].includes(activeTabId);
          console.log("ISactive valid", isActiveValid)
          console.log("ActiveHeight", isActiveValid && activeTabId === "HAA");
          tabDimensions.value = {
              tab1: `${isActiveValid && activeTabId === "Okto" ? activeDimension : (isActiveValid ? inactiveDimension : defaultDimension)}%`,
              tab2: `${isActiveValid && activeTabId === "HAA" ? activeDimension : (isActiveValid ? inactiveDimension : defaultDimension)}%`,
              tab3: `${isActiveValid && activeTabId === "Melculum" ? activeDimension : (isActiveValid ? inactiveDimension : defaultDimension)}%`
          };
      }

      // Apply dimensions to style dynamically
      const tabs = document.querySelectorAll('.tab');
      tabs.forEach((tab, index) => {
          tab.style[dimensionType] = tabDimensions.value[`tab${index + 1}`];
      });
  }


    onMounted(() => {
      emitter.on('toggleClickedTab', (event) => {
        adjustTabDimensions(event.brand)
        console.log("TAB EVENT", event.brand)
        // if(currentClickedTab.value === event.brand){
        //   currentClickedTab.value = 0
        // } else {
        //   currentClickedTab.value = event.brand
        // }
      })
    })
    onUnmounted(() => {
      emitter.off('toggleClickedTab')
    })
    
    let tabTitles = [
      `Premium Greek Honey`,
      `Ultra Premium Greek Honey`,
      `Coming soon`,
    ]
    let tabTexts = [
      `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad.`,
      `At Honey Academy Apiary, our ultra premium brand, we uphold the highest standards of quality and craftsmanship. Utilizing advanced technical procedures, we meticulously select a strictly limited number of cells, transporting them to locations of particular picomorphism within the vegetation. This dedication to precision ensures that each jar embodies the pinnacle of excellence, delivering an extraordinary honey experience that delights the most discerning palates.`,
      `Our creative team at Hellenic Premium Honey never rests. We're brimming with innovative ideas, and soon, we'll introduce Melculum, our Diversity Series. Get ready for the wildest combinations designed for all honey lovers. Remember, honey is more than just a spread - you'll be amazed.`
    ]

    let tab3Series = ['Mono Floral series', 'Multi Floral series', 'All products']

    return { 
      HAAConfig, 
      oktoConfig, 
      tabTexts, 
      tabTitles,
      tab3Series, 
      currentClickedTab,
      isMobile,
      tabDimensions,
    }
  }
}
</script>

<style lang="scss" scoped>
  .tab-container {
    display: flex;
    flex-direction: row;
    max-width: 100vw;
    // @media(min-width: 767px){
    //   min-height: 100vh;
    // }
    width: 100%;
    height: 100%;
    // grid-template-columns: 1fr 1fr 1fr;
    transition: all ease-in 0.3s;

    // Mobile
    @media (max-width: 767px) {
      // grid-template-columns: 1fr;
      // grid-template-rows: 1fr 1fr 1fr;
      flex-direction: column;
      // grid-row-gap: 5px;
      flex-grow: 1;
      &-clicked {
        // &-HAA {
        //   grid-template-rows: 1.70fr 0.65fr 0.65fr;
        // }
        // &-Okto {
        //   grid-template-rows: 0.65fr 1.70fr 0.65fr;
        // }
        // &-melculum {
        //   grid-template-rows: 0.65fr 0.65fr 1.70fr;
        // }
      }

      .order-target{
        &-1{
          order: 2
        }
        &-2{
          order: 1;
        }
        &-3{
          order: 3;
        }
      }
    }

    // Tablets
    @media (min-width: 768px) {
      &-clicked {
        &-Okto {
          grid-template-columns: 1.70fr 0.65fr 0.65fr;
        }
        &-HAA {
          grid-template-columns: 0.65fr 1.70fr 0.65fr;
        }
        &-Melculum {
          grid-template-columns: 0.65fr 0.65fr 1.70fr;
        }
      }
    }

  }
  .mobile-header{
    display: flex;
    // width: 100%;
    // height: 20%;
    align-items: flex-end;
    font-family: "DMSans";
    font-size: 32px;
    font-weight: 700;
    line-height: 34px;
    text-align: left;
    color: #0000001A;
    padding-left: 2.5%;
    margin-bottom: 15px;
    margin-top: 15px;
  }
</style>