<template>
  <div v-if="showSidebar" class="sidebar-container">
    <button class="small-button mr-2" @click="toggleSidebar">TESTME</button>
    {{isSidebarOpen}} {{showSidebar}}
    <button class="small-button mr-2" @click="increment">
      {{ count }}
    </button>
  </div>
</template>

<script>
import { inject, ref, watch } from 'vue';
export default {
  name: "Sidebar",
  setup(){
    let count = ref(0)
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
  position: fixed;
  display: flex;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  background: #eae8e440;
  justify-content: center;
  color: black;
  font-size: 40px;
  z-index: 10;
}
</style>