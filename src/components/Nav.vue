<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth, googleProvider } from '../Firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'

const router = useRouter()
const user = ref(null)

onMounted(() => {
  // Ascolta i cambiamenti dello stato di autenticazione
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
  })
})

const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider)
    // Redirect to profile after successful login
    router.push('/profile')
  } catch (error) {
    console.error('Errore durante il login:', error)
    let errorMessage = 'Errore durante il login'
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Login annullato. Riprova.'
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Popup bloccato. Abilita i popup per questo sito.'
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Errore di connessione. Controlla la tua connessione internet.'
    } else if (error.code === 'auth/invalid-action-code') {
      errorMessage = 'Il link di autenticazione non è valido o è scaduto.'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    alert(errorMessage)
  }
}

const logout = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Errore durante il logout:', error)
  }
}

const goToProfile = () => {
  router.push('/profile')
}
</script>

<template>
  <nav class="flex items-center justify-center gap-4 py-4">
    <div v-if="!user" class="flex items-center">
      <button
        @click="loginWithGoogle"
        class="cursor-pointer px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Connettiti con Google
      </button>
    </div>
    <div v-else class="flex items-center gap-3">
      <button
        @click="goToProfile"
        class="cursor-pointer px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Profile
      </button>
      <img
        v-if="false"
        referrerpolicy="no-referrer"
        :src="user.photoURL"
        :alt="user.displayName"
        class="w-10 h-10 rounded-full border-2 border-gray-300 cursor-pointer"
      />
      <button
        @click="logout"
        class="cursor-pointer px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Esci
      </button>
    </div>
  </nav>
</template>

<style scoped>
</style>

