import { defineStore } from 'pinia';

export const useGlobalStore = defineStore({
  id: 'global',
  state: () => ({
    playAnimationOnEnter: false,
    showLoadingScreen: false,
    loadingProgress: 0,
  }),
  getters: {
    getAnimationFlag: (state) => {
      return this.playAnimationOnEnter
    },
    getLoadingScreenFlag: (state) => {
      return this.showLoadingScreen
    },
    getLoadingProgress: (state) => {
      return this.loadingProgress
    }
  },
  actions: {
    changeAnimationFlag(value){
      // console.log("CHANGING ANIMATION FLAG VALUE", value)
      this.playAnimationOnEnter = value
    },
    setLoadingScreenFlag: (value) => {
      this.showLoadingScreen = value
    },
    setLoadingProgress: (value) => {
      this.loadingProgress = value
    }
  }
})