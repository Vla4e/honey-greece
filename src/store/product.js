// store/productStore.js
import { defineStore } from 'pinia'

export const useProductStore = defineStore('productStore', {
  name: "product",

  state: () => ({
    currentProductLine: {
      name: null,
      urlSlug: ''
    },
    currentFlavour: {
      name: null,
      urlSlug: ''
    },
    selectedBrand: {
      name: null,
      urlSlug: ''
    }
  }),
  getters: {
    getProductLineSlug: (state) => {
      // console.log("productLine getter", state.currentProductLine.urlSlug)
      return state.currentProductLine.urlSlug
    },
    getFlavourSlug: (state) => {
      // console.log("flavour getter", state.currentFlavour.urlSlug)
      return state.currentFlavour.urlSlug
    },
    getBrandSlug: (state) => {
      // console.log("brand getter", state.selectedBrand.urlSlug)
      return state.selectedBrand.urlSlug
    },
    getBrandObject: (state) => {
      return state.selectedBrand
    }
  },
  actions: {
    setProductLine(productLine) {
      // console.log('set ProductLine', productLine)
      this.currentProductLine.urlSlug = productLine.urlSlug
      this.currentProductLine.name = productLine.name
    },
    setFlavour(flavour) {
      // console.log('set Flavour', flavour)
      this.currentFlavour.urlSlug = flavour.urlSlug
      this.currentFlavour.name = flavour.name
    },
    setBrand(brand) {
      // console.log('set Brand', brand)
      this.selectedBrand.urlSlug = brand.urlSlug
      this.selectedBrand.name = brand.name
    }
  }
})
