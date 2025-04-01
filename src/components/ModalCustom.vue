
<script>
  export default {
    name: "ModalCustom"
  }
</script>
<script setup>
import { ref, reactive, watch, onMounted, onUnmounted, inject } from 'vue';

import { validateForm } from '../helpers/Form/validations';
import { getCaptchaToken } from '../helpers/Form/captcha';

import { newsletterManager } from '../helpers/Modal/localStorage';

const props = defineProps({
  showModal: {
    type: Boolean,
    required: false,
    default: false
  }
})
const emitter = inject('emitter');


//Get initial value (creates new ref with initial value of props.showModal)
let showModal = ref(props.showModal)

function closeModal(){
  console.log("TogglingModal", showModal.value)
  showModal.value = false
  newsletterManager.dismissModal()
}

//Form
let form = reactive({
  email: '',
  firstName: '',
  lastName: '',
  location: '',
  customerType: 'consumer',
  companyName: '',
  phoneNumber: '',
  website: ''
});


let validationResult = reactive({
  email: {
    invalid: false,
    message: ''
  },
  firstName: {
    invalid: false,
    message: ''
  },
  lastName: {
    invalid: false,
    message: ''
  },
  location: {
    invalid: false,
    message: ''
  },
  companyName: {
    invalid: false,
    message: ''
  },
  phoneNumber: {
    invalid: false,
    message: ''
  }
})
async function validateInputs(){
  Object.keys(validationResult).forEach(key => {
    validationResult[key].invalid = false;
    validationResult[key].message = '';
  });

  const { isValid, errors } = validateForm(form);

  if (!isValid) {
    Object.entries(errors).forEach(([field, message]) => {
      console.log("f,m", field,message)
      if (message && validationResult[field]) {
        validationResult[field].invalid = true;
        validationResult[field].message = message;
      }
    });
    console.log("Valres", validationResult)
    return false;
  } else return true
}

let isSubmitting = ref(false)
let isSubscribed = ref(false)

watch(() => props.showModal, (newValue) => {
  if(newValue === true){
    isSubscribed.value = false
  }
  showModal.value = newValue  
}, { immediate: true })

async function subscribeToNewsletter() {
  isSubmitting.value = true;

  try {
    const validity = await validateInputs();
    if (!validity) {
      throw new Error('Invalid inputs');
    }

    const captchaToken = await getCaptchaToken();

    const formData = {
      ...form,
      captchaToken
    };

    const response = await fetch('https://api.premiumhoney.gr/subscribe', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      isSubscribed.value = true;
      newsletterManager.markAsSubscribed();
    } else {
      throw new Error('Subscription request was not successful');
    }

  } catch (error) {
    console.error('Subscription failed:', error);
    alert(error.message || 'Subscription failed, please try again.');
  } finally {
    isSubmitting.value = false;
  }
}


onMounted(()=>{
  console.log("SHOWMODALVAL local onMOunted", showModal.value)
  emitter.on('toggleNewsletterModal', ()=>{
    newsletterManager.shouldShowModal(null, true) // (route, forceShowModal)
    showModal.value = true;
  })
})
</script>

<template>
  <div v-if="showModal" class="modal-container">
    <div class="modal-content">
      <div class="white-overlay top"/>
      <div class="white-overlay right"/>
      <div class="white-overlay bottom"/>
      <div class="white-overlay left"/>

      <Transition name="slide" mode="out-in">
        <div v-if="!isSubscribed" class="modal-form">
          <div class="text-container">
            <span class="heading">
              Newsletter
            </span>
            <span class="text">
              stay in the buzz, get the sweetest updates.
            </span>
          </div>

          <div class="form-container">
            <form class="contact-form" @submit.prevent="subscribeToNewsletter">

              <div class="form-group form-group-small">
                <label for="email">Email</label>
                <input type="email" id="email" v-model="form.email">
                <span v-if="validationResult.email.invalid" class="validation">{{ validationResult.email.message }}</span>
              </div>


              <div class="form-group radio-group form-group-small">
                <div class="radio-container">
                  <label for="consumer">
                    Private
                  </label>
                  <input 
                    type="radio" 
                    class="radio"
                    id="consumer"
                    value="consumer"
                    v-model="form.customerType"
                  >
                </div>

                <div class="radio-container">
                  <label for="business">
                    Business
                  </label>
                  <input 
                    type="radio" 
                    class="radio"
                    id="business"
                    value="business"
                    v-model="form.customerType"
                  >
                </div>
              </div>

              <!-- BUSINESS ONLY -->
              <Transition name="expand">
                <div v-show="form.customerType === 'business'" class="business-form">
                  <div class="form-groups-row">
                    <div class="form-group form-group-small">
                      <label for="firstName">First Name</label>
                      <input type="text" autocomplete="off" id="firstName" v-model="form.firstName">
                      <span v-if="validationResult.firstName.invalid" class="validation">{{ validationResult.firstName.message }}</span>
                    </div>
                    <div class="form-group form-group-small">
                      <label for="lastName">Last Name</label>
                      <input type="text" autocomplete="off" id="lastName" v-model="form.lastName">
                      <span v-if="validationResult.lastName.invalid" class="validation">{{ validationResult.lastName.message }}</span>
                    </div>
                  </div>
                  
                  <div class="form-group form-group-small">
                    <CountrySelect v-model="form.location"/>
                  </div>

                  <div class="form-group form-group-small">
                    <label for="company">Company Name</label>
                    <input type="text" autocomplete="off" id="company" v-model="form.companyName">
                    <span v-if="validationResult.companyName.invalid" class="validation">{{ validationResult.companyName.message }}</span>
                  </div>
                  
                  <div class="form-group form-group-small">
                    <label for="phoneNumber">Phone Number</label>
                    <input 
                      type="tel" 
                      id="phoneNumber" 
                      minlength="8"
                      maxlength="20"
                      v-model="form.phoneNumber"
                    >
                    <span v-if="validationResult.phoneNumber.invalid" class="validation">{{ validationResult.phoneNumber.message }}</span>
                  </div>
                  
                  <div class="form-group form-group-small">
                    <label for="website">Website</label>
                    <input type="text" autocomplete="off" id="website" v-model="form.website">
                  </div>
                </div>
              </Transition>

              <div class="button-recaptcha">
                <button 
                  @click="subscribeToNewsletter" 
                  :disabled="isSubmitting" 
                  :class="isSubmitting ? 'disabled' : ''"
                  class="submit-button submit-button-small" 
                  type="submit"
                >
                Subscribe
                </button>
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

            </form>

            <!-- <button @click="subscribeToNewsletter">Subscribe</button> -->

          </div>
        </div>
        
        <div v-else class="subscribed-panel">
          <span class="heading">
              Subscription successful
            </span>
            <span class="text">
              thank you.
            </span>
            <span class="text">
              Have questions? Ask them at
              <br/>
              <a href="mailto:info@premiumhoney.gr" target="_blank">info@premiumhoney.gr</a>
            </span>
        </div>
      </Transition>

      <svg @click="closeModal()" class="close-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6L18 18M6 18L18 6" stroke="#131313" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>

    </div>
  </div>
</template>

<style lang="scss" scoped>
.modal-container{
  padding: 15px;
  max-width: 25%;
  min-height:300px;
  display: flex;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 4;
  background-color: white;
  box-shadow: 5px 5px 10px 3px #00000026;
  width: 25%;
  z-index: 11;
  overflow:hidden;
  @media(max-width: 450px){
    width: 80%;
    max-width: 80%;
    min-height:300px;
  }
  // border-radius: 12px;
  .modal-content{
    width: 90%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    flex-grow: 1;
    border-right: 1px solid #A7A7A7;
    border-top: 1px solid #A7A7A7;
    border-bottom: 1px solid #A7A7A7;
    border-left: 1px solid #A7A7A7;
    .white-overlay{
      position: absolute;
      background-color: white;
      &.top{
        height: 4px;
        width: 95%;
        top: -2px;
        right: 0;
      }
      &.bottom{
        height: 4px;
        width: 95%;
        bottom: -2px;
        left: 0;
      }
      &.left{
        height: 95%;
        width: 4px;
        bottom: 0;
        left: -2px;
      }
      &.right{
        height: 95%;
        width: 4px;
        top: 0;
        right: -2px;
      }
    }
    .modal-form{
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
      min-width: 90%;
      padding: 20px;
      border: none !important;
      .business-form{
        display: flex;
        flex-direction: column;
        width: 100%;
      }
      .text-container{
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        .heading{
          font-size:20px;
          font-weight: 700;
          color: black;
          margin-bottom: 0px;
          font-family: "DMSans";
        }
        .text{
          font-size:14px;
          color: black;
          margin-bottom: 15px;
          font-family: "DMSans";
        }
      }
      .form-container{
        display: flex;
        flex-direction: column;
        width: 100%;
        .contact-form{
          display: flex;
          flex-direction: column;
          border-color: gray;
          border: none !important;
          .button-recaptcha{
            flex-direction: column;
            .submit-button{
              font-size: 14px;
              margin-bottom: 0px;
              width: auto;
              &.disabled{
                opacity: 0.7;
              }
            }
          }
          .form-group{
            display: flex;
            flex-direction: column;
            width: 85%;
            margin-bottom: 5px;
            margin-top: 5px;
            margin-right: auto;
            margin-left: auto;
            @media(max-width: 450px){
              width: 100%;
            }
          }
          .form-groups-row{
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            width: 85%;
            margin-right: auto;
            margin-left: auto;
            @media(max-width: 450px){
              width: 100%;
            }
            .form-group{
              width: 45%;
              &:not(:last-child){
                margin-right: 15px;
              }
            }
          }
          .radio-group{
            flex-direction: row;
            justify-content: space-around;
            label {
                  font-size: 12px;
                  font-weight: 400;
                }
    
                input {
                  -webkit-appearance: none;
                  -moz-appearance: none;
                  appearance: none;
                  min-height: 15px;
                  width: 15px;
                  margin: 0 15px 0 0;
                  box-sizing: border-box;
                  background-color: #F2F2F2;
                  border: 1px solid #C8C5C5;
                  outline: none;
                  cursor: pointer;
                  display: flex;
                  justify-content: center;
                  align-items: center;
    
                  &::after {
                    content: "";
                    width: 7px; 
                    height: 7px;
                    background-color: transparent;
                  }
    
                  &:checked::after {
                    background-color: black;
                  }
    
                  &:active {
                    border: 1px solid #131313;
                  }
                }
          }
        }
      }
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
    cursor: pointer;
    &:hover{
      transform: scale(105%)
    }
  }
}
.subscribed-panel{
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  .heading{
    font-size:20px;
    font-weight: 700;
    color: black;
    margin-bottom: 0px;
    font-family: "DMSans";
  }
  .text{
    font-size:14px;
    color: black;
    margin-bottom: 15px;
    font-family: "DMSans";
    &:last-child{
      margin-top: 20px;
    }
  }
}

// Expand animation
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
  opacity: 1;
  transform: translateY(0);
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-20px);
  overflow: hidden;
}

.business-form .form-group {
  transition: opacity 0.2s ease;
  transition-delay: 0.1s;
}

.expand-enter-from .form-group,
.expand-leave-to .form-group {
  opacity: 0;
}

//slide transition
.slide-enter-active, .slide-leave-active{
  transition: transform 0.5s ease-out;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-enter-to{
  transform: translateX(0%);
}

.slide-leave-from {
  transform: translateX(0%);
}
.slide-leave-to {
  transform: translateX(-100%);
}
</style>