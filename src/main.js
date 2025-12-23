import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

// Handle Firebase action codes in URL on app load
const urlParams = new URLSearchParams(window.location.search)
const mode = urlParams.get('mode')
const oobCode = urlParams.get('oobCode')

// If there's an action code in the URL, redirect to the auth action handler
if (mode && oobCode && window.location.pathname !== '/auth/action') {
  router.replace({
    path: '/auth/action',
    query: { mode, oobCode, continueUrl: urlParams.get('continueUrl') }
  })
}

createApp(App).use(router).mount('#app')