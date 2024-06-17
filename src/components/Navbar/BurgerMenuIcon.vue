<template>
    <div @click="toggleMenu()" :class="menuOpened ? 'active': ''" class="menu-icon">
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
    </div>
</template>
<script>
export default {
  name: 'BurgerMenuIcon'
}
</script>
<script setup>
import { ref, inject, onMounted, onUnmounted } from 'vue';
let emitter = inject('emitter')
let menuOpened = ref(false)
function toggleMenu() {
  console.log("TOGGLING")
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
    width: 40px; /* Width of the hamburger menu */
    height: 30px; /* Total height of the hamburger menu */
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    cursor: pointer;
    z-index: 20000;
}

.bar {
    height: 2px;
    width: 100%;
    background-color: var(--navbar-color);
    transition: transform 0.4s ease, opacity 0.4s ease, width 0.4s ease;
    &:nth-child(1), &:nth-child(3){
      width: 80%;
      margin: auto;
    }
}

.menu-icon.active .bar:nth-child(1) {
    transform: translateY(8px) rotate(45deg);
    width: 100% !important;
    margin: none !important;
}

.menu-icon.active .bar:nth-child(2) {
    opacity: 0;
    transform: translateX(-100%);
}

.menu-icon.active .bar:nth-child(3) {
    transform: translateY(-8px) rotate(-45deg);
    width: 100% !important;
    margin: none !important;
}

</style>