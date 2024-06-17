import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import '@/assets/styles/fonts.scss'
import App from './App.vue'
import router from './router'
import components from './components'
import emitter from './helpers/emitter.js'; 

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