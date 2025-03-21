<template>
  <div class="contact-container">
    <div class="contact-container-bordered">
      <div class="white-box-cover">
        <div class="gray-line"/>
      </div>
      <div v-if="!isMobile" class="left-side">
        <div class="header-container">
          <h1 class="header-text">Contact Us</h1>
          <p class="subheader-text">We're always happy to hear from you! Whether you have a question or feedback, feel free to reach out. Your thoughts and inquiries are important to us, and we're here to assist you in any way we can.</p>
        </div>
      </div>
      <div class="right-side">
        <div class="contact-card">
          <form class="contact-form" @submit.prevent="handleSubmit">
            <div class="form-groups-row">
              <div class="form-group">
                <label for="firstName">First Name</label>
                <input type="text" id="firstName" v-model="form.firstName" required>
                <span v-if="validationResult.firstName.invalid" class="validation">{{ validationResult.firstName.message }}</span>
              </div>
              <div class="form-group">
                <label for="lastName">Last Name</label>
                <input type="text" id="lastName" v-model="form.lastName" required>
                <span v-if="validationResult.lastName.invalid" class="validation">{{ validationResult.lastName.message }}</span>
              </div>
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" v-model="form.email" required>
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
            
            <Transition name="expand">
              <div v-show="form.customerType === 'business'" class="business-form">
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
                    <CountrySelect v-model="form.location"/>
                  </div>

              </div>
            </Transition>

            <div class="form-group">
              <label for="subject">Subject</label>
              <input type="subject" id="subject" v-model="form.subject" required>
            </div>
            <div class="form-group">
              <label for="message">Message</label>
              <textarea id="message" v-model="form.message" required></textarea>
            </div>
            
            <div class="form-group newsletter">
              <input id="newsletter" type="checkbox" v-model="form.newsletter"/>
              <label for="newsletter">Also subscribe to our newsletter.</label>
            </div>

            <div class="button-recaptcha">
              <button class="submit-button" :class="isSubmitting ? 'disabled': ''" :disabled="isSubmitting" type="submit">Submit</button>
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
        </div>
      </div>
      <!-- close icon (X) -->

      <svg @click="toggleContactForm" class="close-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6L18 18M6 18L18 6" stroke="#131313" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
</template>


<script setup>
import { reactive, ref, inject, onMounted, nextTick, watch } from 'vue';

import { getCaptchaToken } from '../../helpers/Form/captcha';
import { validateForm } from '../../helpers/Form/validations';

defineOptions({
  name: 'ContactForm'
})

const emitter = inject('emitter')
const { isMobile } = inject('screenSize')

//Form
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  subject: '',
  message: '',
  newsletter: false,
  customerType: 'consumer',
  companyName: '',
  phoneNumber: '',
  location: ''
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
watch(() => form.newsletter, (val) => {
  console.log("Val:", val)
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
async function handleSubmit() {
  console.log("Attempting submission")
  isSubmitting.value = true;
  
  const validity = await validateInputs()
  if(!validity) return
  
  let captchaToken = await getCaptchaToken();
  await submitForm(captchaToken);
  console.log("Will return value to false/allow submission")
  isSubmitting.value = false;
}

async function submitForm(captchaToken) {
  const formData = {
    ...form,
    captchaToken
  };

  // http://localhost:3000/send-email
  // https://api.premiumhoney.gr/send-email
  try {
    const response = await fetch('http://localhost:3000/send-email', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData)
    });
    console.log("Resp from sendMail:", response)
    if (response.ok) {
      alert('Email sent successfully');
      setTimeout(() => {
        emitter.emit('toggleContactForm');
      }, 1500);
      return
    } else {
      alert('Failed to send email. Please try again.');
      return
    }
  } catch (error) {
    console.error('Error sending email:', error);
    alert('Error sending email');
    return
  }
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
      top: 0%;
      right: 0%;
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
              font-size: 14px;
            }
            input{
              min-height: 25px;
            }
            textarea{
              min-height: 130px;
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
            &.newsletter{
              display: flex;
              flex-direction: row;
              // justify-content: center;
              align-items: center;
              margin-bottom: 10px;
              
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
                  // Optional: style for when user clicks down
                  border: 1px solid #131313;
                }
              }
            }
          }
          .form-groups-row{
            display: flex;
            justify-content: space-between;
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
          .submit-button{
            width: 30%;
            font-family: 'DMSans';
            font-size: 22px;
            color: #131313;
            text-transform: uppercase;
            background: none;
            padding: 10px;
            border-radius: 0px;
            // margin-top: 15px;
            &:hover{
              border-color: #131313;
            }
            &.disabled{
              opacity: 0.7;
            }
          }
        }
      }
    }
  }
}
@media(max-width: 768px){
  .contact-container{
    &-bordered{
      width: 100%;
      height: 100%;
      border: none !important;
    }
    .white-box-cover{
      display: none !important;
    }
    .right-side{
      width: 100% !important;
      .contact-card{
        box-shadow: none !important;
        .contact-form{
          .form-group{
            width: 100% !important;
          }
          .form-groups-row{
            flex-direction: column;
          }
        }
      }
      .submit-button{
        width: 40% !important;
        align-self: center;
      }
    }
  }
}

.button-recaptcha{
  display: flex;
  width: 100%;
  align-items: center;
  margin: 5px;
  .recaptcha-disclaimer{
    display:flex;
    flex-direction: column;
    width: 100%;
    margin-top: 0px;
    .disclaimer-text{
      font-size: 12px;
      color: black;
    }
    .links{
      display: flex;
      justify-content: center;
      color: black;
      font-size: 12px;
      a{
        text-decoration: underline;
        color: black;
      }
    }
  }
  @media(max-width:768px){
    flex-direction: column;
    .recaptcha-disclaimer{
      .disclaimer-text{
        font-size:11px;
      }
      .links{
        font-size:11px;
      }
    }
    .submit-button{
      padding: 10px;
    }
  }
}

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
</style>