<template>
  <div class="tab-container" :class="currentClickedTab ? `tab-container-clicked-${currentClickedTab}`: 'no-clicked-tab'">
    <Tab 
    :tabId="1" 
    :tabTitle="tabTitles[0]"
    :tabText="tabTexts[0]"
    :series="tab1Series"
    logoSource="pages/tabs/tab1.png"/>
    <Tab 
    :tabId="2" 
    :tabTitle="tabTitles[1]"
    :tabText="tabTexts[1]"
    :series="tab2Series"
    logoSource="pages/tabs/tab2.png"/>
    <Tab 
    :tabId="3" 
    :tabTitle="tabTitles[2]"
    :tabText="tabTexts[2]"
    :series="tab3Series"
    logoSource="pages/tabs/tab3.png"/>
  </div>
</template>

<script>
import Tab from "@/components/Tabs/Tab.vue"
import { inject, ref } from 'vue';
export default {
  components: { Tab },
  setup(){
    let currentClickedTab = ref(null)
    let emitter = inject('emitter')
    emitter.on('toggleClickedTab', (event) => {
      // console.log("TAB EVENT", event)
      currentClickedTab.value = event.tabId
    })

    let tabTitles = [
      `Ultra Premium Greek Honey`,
      `Ultra Premium Greek Honey`,
      `Ultra Premium Greek Honey`,
    ]
    let tabTexts = [
      `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad.`,
      `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad.`,
      `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad.`
    ]
    let tab1Series = ['Mono Floral series','Multi Floral series','All Products']
    let tab2Series = ['Blend series', 'Mono Floral series', 'All Products']
    let tab3Series = ['Mono Floral series', 'Multi Floral series', 'All products']

    return {tabTexts, tabTitles, tab1Series, tab2Series, tab3Series, currentClickedTab}
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
    transition: all ease-in 0.3s 0.6s;
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