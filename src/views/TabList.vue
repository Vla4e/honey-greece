<template>
  <div class="tab-container">
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
export default {
  components: { Tab },
  setup(){
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
    return {tabTexts, tabTitles, tab1Series, tab2Series, tab3Series}
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
  }
</style>