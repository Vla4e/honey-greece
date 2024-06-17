<template>
  <div class="sidebar-container">
    <div class="background-cover">
    </div>
    <!-- <div class="x-icon-container">
      <img :src="closeIcon" @click="toggleSidebar" class="x-icon"/>
    </div> -->
    <div class="left-side">
        <router-link class="sidebar-link" to="/history">
          <span class="link-heading">History</span>
        </router-link>
        <router-link class="sidebar-link" to="/product/HAA?line=Blends">
          <span class="link-heading">Honey apiary academy</span>
          <span class="link-subheading">Ultra Premium Greek Honey</span>
        </router-link>
        <router-link class="sidebar-link" to="/product/Okto?line=Blends">
          <span class="link-heading">Okto</span>
          <span class="link-subheading">Premium Greek Honey</span>
        </router-link>
        <router-link class="sidebar-link disabled" to="/">
          <span class="link-heading">Melculum</span>
          <span class="link-subheading">Diversity Series</span>
        </router-link>
    </div>
    <div class="right-side">
      <div class="sidebar-link disabled">
        <span class="link-heading">Contact</span>
        <span class="link-info">
          Email: <a href="mailto:info@premiumhoney.gr" target="_blank">info@premiumhoney.gr</a>
          <br/>
          Phone: +30 22320-22153
          <br/><br/>
          Address:
          <br/>
          Thavmakos - Domokos
          <br/>
          35010 GREECE
          <br/>
          Location:
          <br/>
          39.14698616699479, 22.28284913351356
        </span>
      </div>
      <router-link class="sidebar-link disabled" to="/about">
        <span class="link-heading">About</span>
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: "Sidebar",
  setup(){
    return {}
  },
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
  justify-content: space-around;
  align-items: center;
  color: black;
  font-size: 40px;
  z-index: 12;
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
    max-height: 60%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    z-index: 12;
  }
  .left-side{
    width: 45%;
  }
  .right-side{
    width: 35%;
  }
  .sidebar-link{
    display: flex;
    flex-direction: column;
    &.disabled{
      pointer-events: none !important;
      color: #13131370 !important;
    }
    &:not(:last-child){
      margin-bottom: 40px;
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
      margin-bottom: 15px;
      &:hover{
        &:not(.disabled){
        // transform: scale(1.01);
        font-weight:700;
        // transition: all ease-in 0.3s;
        }
      }
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
      cursor: default;
    }
    .link-info{
      color: #000;
      font-family: "DMSans";
      font-size: 18px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
      text-transform: none;
      text-align: left;
      max-width: 60%;
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
    transform: scale(1.1) translateX(300%);
    transition: all ease-in-out 0.3s;
  }
  .x-icon{
    width: 45px;
    height: 45px;
    cursor: pointer;
  }
}
</style>