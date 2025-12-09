<script setup>
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { auth, googleProvider } from './Firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'

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
  } catch (error) {
    console.error('Errore durante il login:', error)
  }
}

const logout = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Errore durante il logout:', error)
  }
}
</script>

<template>
  <div class="min-h-screen">
    <!-- Header con autenticazione -->
    <header class="relative w-full">
      <div class="absolute top-4 right-4 z-10">
        <div v-if="!user" class="flex items-center">
          <button
            @click="loginWithGoogle"
            class="cursor-pointer px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Connettiti con Google
          </button>
        </div>
        <div v-else class="flex items-center gap-3">
          <img
            referrerpolicy="no-referrer"
            :src="user.photoURL"
            :alt="user.displayName"
            class="w-10 h-10 rounded-full border-2 border-gray-300 cursor-pointer"
          />
          <button
            @click="logout"
            class="cursor-pointer px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Esci
          </button>
        </div>
      </div>
    </header>

    <main class="container mx-auto">
      <h1 class="text-4xl font-bold text-[8vw] text-center mt-10">nofomo</h1>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>

</style>
