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
          <span class="link-subheading">Looking Back and Inspiring the Future</span>
        </router-link>
        <router-link class="sidebar-link" to="/product/HAA?line=Monoflorals">
          <span class="link-heading">Honey apiary academy</span>
          <span class="link-subheading">Ultra Premium Greek Honey</span>
        </router-link>
        <router-link class="sidebar-link" to="/product/Okto?line=Monoflorals">
          <!-- <span class="link-heading">Okto</span> -->
          <OktoText class="link-heading" :fontSize="36" :fontSizeMobile="24" :hoverable="true"/>
          <span class="link-subheading">Premium Greek Honey</span>
        </router-link>
        <router-link class="sidebar-link disabled" to="/">
          <span class="link-heading">
          Melculum
          <!-- <span v-if="!isMobile" style="font-size: 15px;">coming soon</span> -->
          </span>
          <span class="link-subheading">Diversity Series</span>
        </router-link>
        <router-link v-if="isMobile" class="sidebar-link" to="/all-products">
          <span class="link-heading">All products</span>
        </router-link>
    </div>
    <div class="right-side">
      <div class="sidebar-link contact-info">
        <span @click="toggleContactAccordion()" class="link-heading contact">Contact</span>
        <span class="link-info" :class="isMobile ? toggledContact ? 'toggled' : '' : ''">
          Email: <a href="mailto:info@premiumhoney.gr" target="_blank">info@premiumhoney.gr</a>
          <br/>
          Phone: <a href="tel:+302232022153">+30 22320-22153</a>
          <br/><br/>
          Address:
          <br/>
          Thavmakos - Domokos
          <br/>
          35010 GREECE
          <br/>
          Location:
          <br/>
          <a href="https://www.google.com/maps?q=39.14698616699479, 22.28284913351356" target="_blank">39.14698616699479, 22.28284913351356</a>
        </span>
      </div>
      <div v-if="isMobile" @click="toggleContactForm()" class="sidebar-link">
        <span class="link-heading">Inquire</span>
      </div>
      <router-link class="sidebar-link" to="/about-us">
        <span class="link-heading">About</span>
        <span class="link-subheading">Unveiling Our Hive: Meet our Team</span>
      </router-link>

      <div @click="toggleNewsletterModal" class="sidebar-link">
        <span class="link-newsletter">>Subscribe to our Newsletter</span>
      </div>
      <div class="sidebar-link recaptcha">
        <div class="recaptcha-disclaimer" style="text-align: center; margin-top: 10px;">
          <span class="disclaimer-text">
            This site is protected by reCAPTCHA and the Google
          </span>
          <div class="links">
            <a href="https://policies.google.com/privacy">Privacy Policy</a>
            &nbsp;and&nbsp;
            <a href="https://policies.google.com/terms">Terms of Service</a>
            &nbsp;apply.
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import OktoText from './OktoText.vue';

export default {
  name: "Sidebar",
  setup(){
    return {}
  },
}
</script>

<script setup>
import { inject, ref } from 'vue'

const { isMobile } = inject('screenSize')
const emitter = inject('emitter')

let toggledContact = ref(false)
function toggleContactAccordion(){
  if(isMobile.value){
    toggledContact.value = !toggledContact.value
  }
}
function toggleContactForm(){
  // console.log("Called toggle contact form")
  emitter.emit('toggleContactForm')
}

function toggleNewsletterModal(){
  emitter.emit('toggleNewsletterModal')
}
</script>

<style lang="scss" scoped>
.sidebar-container{
  position: fixed;
  display: flex;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  justify-content: space-around;
  align-items: center;
  color: black;
  font-size: 40px;
  z-index: 9;

  @media(min-width: 768px){
    background-image: url('@/assets/images/bg.png');
    background-repeat: no-repeat;
    background-size: cover;
  }
  .background-cover{
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
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
    
    &.contact-info{
      a{
        color: black;
        text-decoration: underline;
        @media(max-width: 768px){
          color: white;
        }
      }
    }
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
      letter-spacing: 7.18px;
      text-align: left;
      text-transform: uppercase;
      margin-bottom: 15px;
      &:hover{
        &:not(.disabled){
          // transform: scale(1.01);
          font-weight:700;
          // transition: all ease-in 0.3s;
        }
        .okt, .omega{
          font-weight: 700;
        }
      }
      &.contact{
        &:hover{
          font-weight:400;
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
      transition: height ease-in-out 0.5s, opacity ease-in-out 0.3s;
      overflow: hidden;
    }
    .link-newsletter{
      color: #000;
      font-family: "DMSans";
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
      letter-spacing: 4px;
      text-transform: uppercase;
      text-align: left;
      cursor: default;
    }
  }
  
  @media(max-width:767px){ // Mobile
    flex-direction: column;
    justify-content: center;
    .background-cover{
      background: rgba(16, 16, 16, 0.9);
    }
    .left-side, .right-side{
      width: 90%;
      height: auto;
    }
    
    .sidebar-link{
      align-items: center;
      margin-bottom: 25px !important;
      @media(max-height: 780px){
        margin-bottom: 10px !important;
      }
      
      @media(max-height: 600px){
        margin-bottom: 0px !important;
      }
      &:last-child{
        margin-bottom: 15px;
      }
      .link-heading{
        font-size: 24px;
        text-align: center;
        color: white;
        @media(max-height: 790px){
          font-size: 20px;
        }
      }
      .link-newsletter{
        color: white;
      }
      .link-subheading, .link-info{
        // display: none;
        pointer-events: none;
        opacity: 0;
        height: 0px;
      }
      &.contact-info{
        .link-info{
          &.toggled{
            opacity: 1;
            flex-direction: column;
            height: 300px;
            // min-height: 250px;
            color: white;
            pointer-events: all;
          }
        }
      }
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
.recaptcha-disclaimer{
  display:flex;
  flex-direction: column;
  width: 100%;
  margin-top: 0px;
  .disclaimer-text{
    font-family: 'DMSans';
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    color: black;
  }
  .links{
    display: flex;
    justify-content: center;
    color: black;
    font-size: 14px;
    font-family: 'DMSans';
    font-style: normal;
    font-weight: 400;
    a{
      text-decoration: underline;
      color: black;
    }
  }
  @media(max-width:768px){
    .disclaimer-text{
      color: white;
      font-size: 11px;
    }
    .links{
      color: white;
      font-size: 11px;
      a{
        text-decoration: underline;
        color: white;
      }
    }
  }
}
</style>