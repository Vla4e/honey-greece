import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Router from './router/index.js'
import components from './components/index.js'
console.log("Comps", components)
const app = createApp(App)
app.use(Router)
for (const component of components){
  console.log("CMOP", component)
  app.component(component.name, component)
}
app.mount('#app')