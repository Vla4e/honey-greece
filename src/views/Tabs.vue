<template>
  <div class="tab-container" :class="currentClickedTab ? `tab-container-clicked-${currentClickedTab}`: 'no-clicked-tab'">
    <Tab 
    :tabId="1" 
    :tabTitle="tabTitles[0]"
    :tabText="oktoConfig.brandDescriptionShort"
    :brand="oktoConfig.brand"
    :productLines="oktoConfig.productLines"
    line="Okto"
    logoSource="pages/tabs/tab1.png"/>
    <Tab 
    :tabId="2" 
    :tabTitle="tabTitles[1]"
    :tabText="HAAConfig.brandDescriptionShort"
    :brand="HAAConfig.brand"
    :productLines="HAAConfig.productLines"
    :line="tab2Line"
    line="HAA"
    logoSource="pages/tabs/tab2.png"/>
    <Tab 
    :tabId="3" 
    :tabTitle="tabTitles[2]"
    :tabText="tabTexts[2]"
    :brand="'Melculum'"
    :productLines="tab3Series"
    :line="tab3Line"
    line="Melculum"
    logoSource="pages/tabs/tab3.png"/>
  </div>
</template>

<script>
import Tab from "@/components/Tabs/Tab.vue"
import { inject, ref } from 'vue';

import brandConfigs from "@/assets/brand-information/index.js"

export default {
  components: { Tab },
  setup(){

    let HAAConfig = brandConfigs['HAA']
    let oktoConfig = brandConfigs['Okto']
    let currentClickedTab = ref(null)
    let emitter = inject('emitter')
    emitter.on('toggleClickedTab', (event) => {
      console.log("TAB EVENT", event.tabId)
      if(currentClickedTab.value === event.tabId){
        currentClickedTab.value = 0
      } else {
        currentClickedTab.value = event.tabId
      }
    })

    let tabTitles = [
      `Ultra Premium Greek Honey`,
      `Ultra Premium Greek Honey`,
      `Coming soon`,
    ]
    let tabTexts = [
      `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad.`,
      `At Honey Academy Apiary, our ultra premium brand, we uphold the highest standards of quality and craftsmanship. Utilizing advanced technical procedures, we meticulously select a strictly limited number of cells, transporting them to locations of particular picomorphism within the vegetation. This dedication to precision ensures that each jar embodies the pinnacle of excellence, delivering an extraordinary honey experience that delights the most discerning palates.`,
      `Our creative team at Hellenic Premium Honey never rests. We're brimming with innovative ideas, and soon, we'll introduce Melculum, our Diversity Series. Get ready for the wildest combinations designed for all honey lovers. Remember, honey is more than just a spread - you'll be amazed.`
    ]

    let tab1Series = ['Mono Floral series','Multi Floral series','All Products']
    let tab2Series = ['Blend series', 'Mono Floral series', 'All Products']
    let tab3Series = ['Mono Floral series', 'Multi Floral series', 'All products']

    return { HAAConfig, oktoConfig, tabTexts, tabTitles, tab1Series, tab2Series, tab3Series, currentClickedTab }
  }
}
</script>

<style lang="scss" scoped>
  .tab-container{
    display: grid;
    max-width: 100vw !important;
    width: 100vw !important;
    height: 100vh !important;
    height: 600px;
    grid-template-columns: 1fr 1fr 1fr;
    transition: all ease-in 0.3s;
    &-clicked{
      &-1{
        grid-template-columns: 1.70fr 0.65fr 0.65fr;
      }
      &-2{
        grid-template-columns: 0.65fr 1.70fr 0.65fr;
      }
      &-3{
        grid-template-columns: 0.65fr 0.65fr 1.70fr;
      }
    }
  }
</style>