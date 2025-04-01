import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.scss'
import '@/assets/styles/fonts.scss'
import '@/assets/styles/form.scss'
import App from './App.vue'
import router from './router'
import components from './components'
import emitter from './helpers/emitter.js'; 

// For prod - disable on dev
// console.log = () => {};

const app = createApp(App)
const pinia  = createPinia();
app.use(router)
app.use(pinia)
//GLOBAL COMPONENTS
for (const component of components){
  app.component(component.name, component)
}

//GLOBAL VARIABLES
app.provide('emitter', emitter)

app.mount('#app')