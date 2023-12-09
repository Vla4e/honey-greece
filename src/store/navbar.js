import { defineStore } from 'pinia';

export const useNavbarStore = defineStore({
  id: 'navbar',
  state: () => ({
    showNavbar: true
  }),
  getters: {
    getNavbarStatus: (state) => {
      return this.showNavbar
    }
  },
  actions: {
    changeNavbarStatus(value){
      // console.log("CHANGING STATUS", value)
      this.showNavbar = value
    }
  }
})