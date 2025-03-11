<template>
    <div @click="toggleMenu()" :class="menuOpened ? 'active': ''" class="menu-icon">
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
    </div>
</template>


<script setup>
import { ref, inject, onMounted, onUnmounted } from 'vue';
defineOptions({
  name: 'BurgerMenuIcon'
})

let emitter = inject('emitter')
let menuOpened = ref(false)
function toggleMenu() {
  // console.log("TOGGLING")
  menuOpened.value = !menuOpened.value
}
onMounted(()=>{
  emitter.on('toggleSidebarRoute', ()=>{
    menuOpened.value = false;
  })
})
onUnmounted(()=>{
  emitter.off('toggleSidebarRoute')
})
</script>

<style lang="scss" scoped>
.menu-icon {
    width: 50px !important;
    height: 50px !important;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: 20000;
}

.bar {
    height: 2px;
    width: 80%;
    background-color: var(--navbar-color);
    transition: transform 0.4s ease, opacity 0.4s ease, width 0.4s ease;
    margin-bottom: 7px;
    &:nth-child(1), &:nth-child(3){
      width: 60%;
    }
    &:nth-child(3){
      margin-bottom: 0px;
    }
}

.menu-icon.active .bar:nth-child(1) {
    transform:  translateY(11px) rotate(45deg);
    // width: 100% !important;
    margin: 0 !important;
}

.menu-icon.active .bar:nth-child(2) {
    opacity: 0;
    transform: translateX(-100%);
}

.menu-icon.active .bar:nth-child(3) {
    transform: rotate(-45deg);
    // width: 100% !important;
    margin: 0 !important;
}

</style>