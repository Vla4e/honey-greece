import { defineStore } from 'pinia';

export const useNavbarStore = defineStore({
  id: 'navbar',
  state: () => ({
    showNavbar: true,
    floating: false
  }),
  getters: {
    getNavbarStatus: (state) => {
      return state.showNavbar
    },
    getNavbarFloating: (state) => {
      console.log("getting status", state.floating)
      return state.floating
    }
  },
  actions: {
    changeNavbarStatus(value){
      // console.log("CHANGING STATUS", value)
      this.showNavbar = value
    },
    changeNavbarFloating(value){
      console.log("CHANGING STATUS", value)
      this.floating = value
    }
  }
})