<template>
  <div class="sidebar-container">
    <button @click="toggleSidebar">TESTME</button>
    {{isSidebarOpen}}
    <button @click="count++">
      {{ count }}
    </button>
  </div>
</template>

<script>
import { inject, ref, watch } from 'vue';
export default {
  name: "Sidebar",
  setup(){
    const count = ref(0)
    let emitter = inject('emitter')
    let showSidebar = ref(false);
    const isSidebarOpen = ref(false);


    function increment() {
      // .value is needed in JavaScript
      count.value++
    }
    function toggleSidebar(){
      console.log("calledfunc")
      showSidebar.value = !showSidebar.value
    }
    emitter.on('toggleSidebar', (e) => {
      console.log('heard and triggered', showSidebar.value)
      showSidebar.value = !showSidebar.value
      console.log('CHANGED VALUE', showSidebar.value)
    })
    return { showSidebar, toggleSidebar, isSidebarOpen, increment, count }
  },
  watch: {
    showSidebar:{
      // immediate: true,
      handler: (val) => {
        console.log("VAL", val)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebar-container{
  display: flex;
  width: 100vw !important;
  height: 100vw !important;
  background: #eae8e440;
  justify-content: center;
  color: black;
  font-size: 40px;
}
</style>