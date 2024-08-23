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
              </div>
              <div class="form-group">
                <label for="lastName">Last Name</label>
                <input type="text" id="lastName" v-model="form.lastName" required>
              </div>
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" v-model="form.email" required>
            </div>
            <div class="form-group">
              <label for="subject">Subject</label>
              <input type="subject" id="subject" v-model="form.subject" required>
            </div>
            <div class="form-group">
              <label for="message">Message</label>
              <textarea id="message" v-model="form.message" required></textarea>
            </div>
            <div class="button-recaptcha">
              <button class="submit-button" type="submit">Submit</button>
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

<script>
  export default {
    name: "ContactForm"
  }
</script>

<script setup>
import { reactive, ref, inject, onMounted, nextTick } from 'vue';

const emitter = inject('emitter')
const { isMobile } = inject('screenSize')

//Recaptcha
const siteKey = ref('6LeduiYqAAAAAM0sVYQ7IRkiObV6HU5w-ZPFkLbQ');

//Form
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  subject: '',
  message: ''
});
async function handleSubmit() {
  grecaptcha.ready(async () => {
    grecaptcha.execute(siteKey.value, {action: 'submit'}).then(async (captchaToken) => {
      await submitForm(captchaToken);
    }).catch(error => {
      console.error('reCAPTCHA execution failed:', error);
      alert('reCAPTCHA verification failed. Please try again.');
    });
  });
}

async function submitForm(captchaToken) {
  const formData = {
    ...form,
    captchaToken
  };

  try {
    const response = await fetch('https://api.premiumhoney.gr/send-email', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      alert('Email sent successfully');
      setTimeout(() => {
        emitter.emit('toggleContactForm');
      }, 1500);
    } else {
      alert('Failed to send email. Please try again.');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    alert('Error sending email');
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
</style>