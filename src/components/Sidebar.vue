<template>
  <div class="sidebar-container">
    <div class="background-cover">
    </div>
    <div class="x-icon-container">
      <img :src="closeIcon" @click="toggleSidebar" class="x-icon"/>
    </div>
    <div class="left-side">
        <router-link class="sidebar-link" to="/">
          <span class="link-heading">History</span>
        </router-link>
        <router-link class="sidebar-link" to="/">
          <span class="link-heading">Honey apiary academy</span>
          <span class="link-subheading">Ultra Premium Greek Honey</span>
        </router-link>
        <router-link class="sidebar-link" to="/">
          <span class="link-heading">Okto</span>
          <span class="link-subheading">Premium Greek Honey</span>
        </router-link>
        <router-link class="sidebar-link" to="/">
          <span class="link-heading">Melculum</span>
          <span class="link-subheading">Diversity Series</span>
        </router-link>
    </div>
    <div class="right-side">
      <div class="sidebar-link">
        <span class="link-heading">Contact</span>
        <span class="link-info">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</span>
      </div>
      <router-link class="sidebar-link" to="/">
        <span class="link-heading">About</span>
      </router-link>
    </div>
  </div>
</template>

<script>
import { inject, ref, watch } from 'vue';
import closeIcon from '@/assets/images/x-icon.svg'
export default {
  name: "Sidebar",
  setup(){
    let emitter = inject('emitter')
    let showSidebar = ref(false);
    function toggleSidebar(){
      emitter.emit('toggleSidebar')
    }
    emitter.on('toggleSidebar', (e) => {
      console.log('heard and triggered', showSidebar.value)
      showSidebar.value = !showSidebar.value
      console.log('CHANGED VALUE', showSidebar.value)
    })
    return { showSidebar, toggleSidebar, closeIcon}
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
  background-image: url('@/assets/images/bg.png');
  background-repeat: no-repeat;
  background-size: cover;
  justify-content: center;
  align-items: center;
  color: black;
  font-size: 40px;
  z-index: 10;
  .background-cover{
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vw;
    background: rgba(255, 255, 255, 0.60);
    z-index: 11;
  }
  .left-side, .right-side{
    height: 50%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    z-index: 12;
  }
  .left-side{
    width: 45%;
  }
  .right-side{
    width: 30%;
  }
  .sidebar-link{
    display: flex;
    flex-direction: column;
    &:not(:last-child){
      margin-bottom: 40px;
    }
    :hover{
      transform: scale(1.1);
      transition: all ease-in-out 0.3s;
    }
    .link-heading{
      color: #000;
      font-family: "DMSans";
      font-size: 36px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
      letter-spacing: 9.18px;
      text-align: left;
      text-transform: uppercase;
    }
    .link-subheading{
      color: #000;
      font-family: "DMSans";
      font-size: 20px;
      font-style: normal;
      font-weight: 700;
      line-height: normal;
      letter-spacing: 4px;
      text-transform: uppercase;
      text-align: left;
    }
    .link-info{
      color: #000;
      font-family: "DMSans";
      font-size: 20px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
      text-transform: capitalize;
      text-align: left;
    }
  }
}
.x-icon-container{
  position: absolute;
  top: 2%;
  left: 2%;
  z-index: 12;
  cursor: pointer;
  :hover{
    transform: scale(1.1);
    transition: all ease-in-out 0.3s;
  }
  .x-icon{
    width: 50px;
    height: 50px;
  }
}
</style>