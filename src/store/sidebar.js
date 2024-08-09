import { defineStore } from 'pinia';

export const useSidebarStore = defineStore({
  id: 'Sidebar',
  state: () => ({
    showSidebar: false,
  }),
  getters: {
    getSidebarStatus: (state) => {
      return state.showSidebar
    },
  },
  actions: {
    setSidebarStatus(value){
      // console.log("CHANGING STATUS", value)
      this.showSidebar = value
    },
  }
})