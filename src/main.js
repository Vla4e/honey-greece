import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Router from './router/index.js'
import components from './components'
import globalFunctions from './helpers/globalFunctions.js'
import mitt from 'mitt';

const emitter = mitt();

const app = createApp(App)

app.use(Router)

//expose components globally
for (const component of components){
  app.component(component.name, component)
}

//GLOBAL VARIABLES
app.provide('emitter', emitter)
app.provide('useImage', globalFunctions.useImage)

app.mount('#app')