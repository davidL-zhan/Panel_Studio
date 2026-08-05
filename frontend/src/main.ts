import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// Design Token — 全局 CSS Variables
import './styles/variables.css'
import './styles/reset.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
