

<script setup>
import { onMounted, ref, watch } from 'vue'
import { allCountries } from './CountrySelect/countryList'

defineOptions({
  name: "CountrySelect"
})
const props = defineProps({
  modelValue: {
    type: String,
    required: false
  }
})
const emit = defineEmits(['update:modelValue']);

let selectedCountry = ref('')

let searchResults = ref(allCountries)
async function searchList(query){
  if (!query) {
    return [];
  }

  const normalizedQuery = query.toLowerCase();

  let resultsFirstWord = []; // first string starts with query
  let resultsOtherWord = []; // next string/s starts with query

  for (const country of allCountries) {
    const lowerCaseName = country.name.toLowerCase();
    
    if (lowerCaseName.startsWith(normalizedQuery)) {
      resultsFirstWord.push(country);
    } else {
      const parts = lowerCaseName.split(' ');
      if (parts.some(part => part.startsWith(normalizedQuery))) {
        resultsOtherWord.push(country);
      }
    }
    
  }

  if(resultsFirstWord.length){
    resultsFirstWord.sort((a, b) => a.name.localeCompare(b.name))
  }
  if(resultsOtherWord.length){
    resultsOtherWord.sort((a, b) => a.name.localeCompare(b.name))
  }

  let results = resultsFirstWord.concat(resultsOtherWord)
  return results
}
let hasBeenClicked = false
let searchTerm = ref('')
let isSearching = false;
watch(() => searchTerm.value, async (val) => {
  if (!isSearching) {
    isSearching = true
    if(!hasBeenClicked){
      isDropdownOpen.value = true;
    }
    try {
      searchResults.value = await searchList(val)
      if (!searchResults.value.length) {
        searchResults.value = allCountries
      }
    } catch (e) {
      console.error(e)
      searchResults.value = allCountries
    } finally {
      isSearching = false
    }
  }
})

let isDropdownOpen = ref(false)
function selectCountry(country){
  selectedCountry.value = country.name
  searchTerm.value = country.name
  isDropdownOpen.value = false
  hasBeenClicked = true;
  setTimeout(() => {
    hasBeenClicked = false
  }, 300)
  emit('update:modelValue', country.name)
}
function openDropdown(){
  isDropdownOpen.value = !isDropdownOpen.value
  searchResults.value = allCountries
}

</script>

<template>
  <div @mouseleave="isDropdownOpen = false" class="searchable-country-select">
    <label for="search">Country</label>
    <div class="select-container">
      <input type="text" autocomplete="off" id="search" class="search" v-model="searchTerm" placeholder="Search"/>
      <div class="dropdown-icon" @click="openDropdown()">
        <span>▼</span>
      </div>
    </div>
    <div class="dropdown" v-if="isDropdownOpen">
      <div 
        v-for="country in searchResults"
        :key="country.code"
        class="dropdown-item"
        @click="selectCountry(country)"
      >
        {{ country.name }}
        <span class="line"></span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.searchable-country-select {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  .select-container {
    display: flex;
    width: 100%;
    position: relative;
    height: 25px;
    min-height: 25px;
    background-color: #F2F2F2;
    border: 1px solid #C8C5C5 !important;
    border-radius: 0px;
    outline: none !important;
    
    .search {
      flex: 1;
      padding: 2px 6px;
      width: 100%;
      background-color: transparent;
      color: black;
      border: none!important;
      outline: none !important;
    }
    
    .dropdown-icon {
      display: flex;
      align-items: center;
      padding: 0 10px;
      height: 24px !important;
      min-height: 24px !important;
      // border: 1px solid gray;
      cursor: pointer;
      position: absolute;
      right: 0px;
      color: black;
      span {
        font-size: 12px;
      }
    }
  }
  
  .dropdown {
    position: absolute;
    width: 100%;
    max-height: 300px;
    overflow-y: auto;
    background: white;
    z-index: 10;
    top: 45px;
    box-shadow: 5px 5px 10px 3px #00000026;
    
    .dropdown-item {
      padding: 8px 12px;
      color: black;
      text-align: left;
      cursor: pointer;
      // border-bottom: 1px solid;
      
      &:hover {
        background-color: #f5f5f5;
      }
      .line{
        width: 30%;
        height: 1px;
        background-color: gray;
        margin-top: 5px;
      }
    }
  }
}
</style>