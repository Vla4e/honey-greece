import { defineStore } from 'pinia';

export const useGlobalStore = defineStore({
  id: 'global',
  state: () => ({
    playAnimationOnEnter: false //PAOE
  }),
  getters: {
    getAnimationFlag: (state) => {
      return this.playAnimationOnEnter
    }
  },
  actions: {
    changeAnimationFlag(value){
      // console.log("CHANGING ANIMATION FLAG VALUE", value)
      this.playAnimationOnEnter = value
    }
  }
})