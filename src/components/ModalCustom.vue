
<script>
  export default {
    name: "ModalCustom"
  }
</script>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

let showModal = ref(false)
function toggleModal(){
  console.log("TogglingModal", showModal.value)
  showModal.value = !showModal.value
}

let email = ref('')
function subscribeToNewsletter(){
  console.log("attempting subscription with:", email.value)
}
</script>

<template>
  <div v-if="showModal" class="modal-container">
    <div class="modal-content">

      <div class="text-container">
        <span class="heading">
          Subscribe to our newsletter!
        </span>
        <span class="subheading">
          If you want to fill your days with wonderful flavours.
        </span>
      </div>

      <div class="input-container">
        <input id="email" type="email" v-model="email" placeholder="Type..."/>
        <button @click="subscribeToNewsletter">Subscribe</button>
      </div>

      <svg @click="toggleModal()" class="close-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6L18 18M6 18L18 6" stroke="#131313" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>

    </div>
  </div>
</template>

<style lang="scss" scoped>
.modal-container{
  padding: 20px;
  max-width: 35%;
  min-height: 250px;
  display: flex;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 4;
  background-color: white;
  border-radius: 12px;
  .modal-content{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    flex-grow: 1;
    .text-container{
      width: 80%;
      display: flex;
      flex-direction: column;
      align-items: center;
      .heading{
        font-size:24px;
        color: black;
        margin-bottom: 15px;
      }
      .subheading{
        font-size:20px;
        color: black;
        margin-bottom: 15px;
      }
    }
    .input-container{
      display: flex;
      flex-direction: row;
      width: 80%;
      margin-left: auto;
      margin-right: auto;
      background: gray;
      border-radius: 8px;
      height: 40px;
      input{
        box-sizing: border-box;
        background: none;
        width: 100%;
        color: white;
        outline: none;
        border: none;
        font-size: 16px;
        border-radius: 8px 0px 0px 8px;
        padding: 5px 10px;
        height: 100%;
        max-height: 100%;
      }
      button{
        background: none;
        outline: none;
        border: none;
        color: white;
        font-size: 14px;
        font-weight: 700;
        border-radius: 0px 8px 8px 0px;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 5px 10px;
        height: 100%;
        max-height: 100%;
      }
    }
    .close-icon{
      width: 24px;
      height: 24px;
      position: absolute;
      top: 0%;
      right: 0%;
      z-index:2;
      color: black;
      stroke: black;
      fill: black;
    }
  }
}
</style>