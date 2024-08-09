import { defineStore } from 'pinia';

export const useNavbarStore = defineStore({
  id: 'navbar',
  state: () => ({
    showNavbar: true,
    floating: false,
    navbarColor: {
      desktop: 'black',
      mobile: 'black'
    }
  }),
  getters: {
    getNavbarStatus: (state) => {
      return state.showNavbar
    },
    getNavbarFloating: (state) => {
      // console.log("getting status", state.floating)
      return state.floating
    },
    getNavbarColor: (state) => {
      // console.log("NavbarColor", state.navbarColor)
      return state.navbarColor
    }
  },
  actions: {
    changeNavbarStatus(value){
      // // console.log("CHANGING STATUS", value)
      this.showNavbar = value
    },
    changeNavbarFloating(value){
      // console.log("CHANGING STATUS", value)
      this.floating = value
    },
    setNavbarColor(obj){
      this.navbarColor = obj
    }
  }
})