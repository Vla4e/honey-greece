<template>
  <div class="contact-container">
    <div class="contact-container-bordered">
      <div class="white-box-cover">
        <div class="gray-line"/>
      </div>
      <div class="left-side">
        <div class="header-container">
          <h1 class="header-text">Contact Us</h1>
          <p class="subheader-text">Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit, Sed Do Eiusmod Tempor Incididunt Ut Labore Et Dolore Magna Aliqua. Ut Enim Ad</p>
        </div>
      </div>
      <div class="right-side">
        <div class="contact-card">
          <form class="contact-form" @submit.prevent="handleSubmit">
            <div class="form-groups-row">
              <div class="form-group">
                <label for="firstName">First Name</label>
                <input type="text" id="firstName" v-model="form.firstName" required>
              </div>
              <div class="form-group">
                <label for="lastName">Last Name</label>
                <input type="text" id="lastName" v-model="form.lastName" required>
              </div>
            </div>
            <div class="form-group">
              <label for="subject">Subject</label>
              <input type="subject" id="subject" v-model="form.subject" required>
            </div>
            <div class="form-group">
              <label for="message">Message</label>
              <textarea id="message" v-model="form.message" required></textarea>
            </div>
            <button class="submit-button" type="submit">Submit</button>
          </form>
        </div>
      </div>
      <!-- close icon (X) -->
      <svg @click="toggleContactForm" class="close-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6L18 18M6 18L18 6" stroke="#131313" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
</template>

<script>
  export default {
    name: "ContactForm"
  }
</script>

<script setup>
import { reactive, ref, inject } from 'vue';
const emitter = inject('emitter')

const form = reactive({
  firstName: '',
  lastName: '',
  subject: '',
  message: ''
});

function handleSubmit() {
  // Using mailto protocol to open the default mail application
  const subject = form.subject;
  const body = `
    First Name: ${form.firstName}
    Last Name: ${form.lastName}
    Message: ${form.message}
  `;
  
  const mailtoLink = `mailto:info@premiumhoney.gr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink; // This will open the user's default email client
  setTimeout(()=> {
    emitter.emit('toggleContactForm')
  }, 1500)
}

function toggleContactForm(){
  emitter.emit('toggleContactForm')
}

</script>

<style lang="scss" scoped>
.contact-container{
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  background: white;
  z-index: 12;
  .contact-container-bordered{
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: 95%;
    height: 95%;
    margin: auto;
    border-right: 1px solid #A7A7A7;
    border-top: 1px solid #A7A7A7;
    border-bottom: 1px solid #A7A7A7;
    border-left: 1px solid #A7A7A7;
    position: relative;
    .close-icon {
      width: 36px;
      height: 36px;
      fill: none;
      stroke: black;
      stroke-width: 1px;
      position: absolute;
      top: 2%;
      right: 2%;
      cursor: pointer;
    }
    .white-box-cover{
      position: absolute;
      top: 50%;
      left: -5px;
      transform: translateY(-50%);
      background-color: white;
      z-index: 13;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      height: 25%;
      width: 10%;
      padding-left: 10px;
      .gray-line{
        background-color: #A7A7A7;
        height: 1px;
        width: 90%;
      }
    }
    .left-side{
      height: 100%;
      width: 50%;
      color: #131313;
      font-family: 'DMSans';
      text-align: left;
      display: flex;
      align-items: center;
      justify-content: center;
      .header-container{
        max-width: 60%;
        .header-text{
          font-weight: 700;
          text-transform: uppercase;
          margin: 0;
          font-size: 40px;
        }
        .subheader-text{
          font-weight: 400;
          font-size: 14px;
        }
      }
    }
    .right-side{
      width: 40%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      .contact-card{
        // height: 70%;
        box-shadow: 5px 5px 10px 3px #00000026;
        padding: 5%;
        .contact-form{
          display: flex;
          flex-direction: column;
          height: 100%;
          .form-group{
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            flex: 1;
            margin: 5px;
            label{
              font-family: 'DMSans';
              font-weight: 700;
              text-transform: uppercase;
              color: #131313;
              text-align: start;
            }
            input{
              min-height: 40px;
            }
            textarea{
              min-height: 200px;
              resize: none;
            }
            input, textarea{
              width: 100%;
              box-sizing: border-box;
              background-color: #F2F2F2;
              border: 1px solid #C8C5C5;
              color: #131313;
              &:active, &:focus{
                border-radius: 0px !important;
                outline: none !important;
              }
            }
          }
          .form-groups-row{
            display: flex;
            justify-content: space-between;
          }
          .submit-button{
            width: 25%;
            font-family: 'DMSans';
            font-size: 25px;
            color: #131313;
            text-transform: uppercase;
            background: none;
            padding: 15px;
            border-radius: 0px;
            &:hover{
              border-color: #131313;
            }
          }
        }
      }
    }
  }
}
</style>