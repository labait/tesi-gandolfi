<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { auth, googleProvider } from '../Firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { PlusIcon, Squares2X2Icon, ArrowRightStartOnRectangleIcon } from '@heroicons/vue/24/outline'
import DialogBox from './DialogBox.vue'

const router = useRouter()
const user = ref(null)
const openProjectModal = inject('openProjectModal')

// DialogBox state for logout confirmation
const showLogoutDialog = ref(false)

onMounted(() => {
  // Listen for authentication state changes
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
  })
})

const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider)
    // Redirect to projects after successful login
    router.push('/projects')
  } catch (error) {
    console.error('Error during login:', error)
    let errorMessage = 'Error during login'
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Login cancelled. Please try again.'
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Popup blocked. Please enable popups for this site.'
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Connection error. Please check your internet connection.'
    } else if (error.code === 'auth/invalid-action-code') {
      errorMessage = 'The authentication link is invalid or expired.'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    alert(errorMessage)
  }
}

const handleLogoutClick = () => {
  // Show confirmation dialog instead of logging out directly
  showLogoutDialog.value = true
}

const confirmLogout = async () => {
  showLogoutDialog.value = false
  try {
    await signOut(auth)
    // Navigate to home page after logout
    router.push({ name: 'Homepage', query: { force: 'true' } })
  } catch (error) {
    console.error('Error during logout:', error)
    alert('Error during logout. Please try again.')
  }
}

const cancelLogout = () => {
  showLogoutDialog.value = false
}

const goToProjects = () => {
  router.push('/projects')
}
</script>

<template>
  <nav class=" flex items-center justify-center gap-4 py-4 mb-8">
    <div v-if="!user" class="flex items-center w-full sm:w-auto">
      <button
        @click="loginWithGoogle"
        class="cursor-pointer px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto whitespace-nowrap"
      >
        Connect with Google
      </button>
    </div>
    <div v-else class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
      <!-- New Project Button (first element) -->
      <button
        v-if="openProjectModal"
        @click="openProjectModal"
        class="cursor-pointer px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap"
      >
        <PlusIcon class="w-5 h-5" />
        <span>New Project</span>
      </button>
      
      <button
        @click="goToProjects"
        class="cursor-pointer px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap"
      >
        <Squares2X2Icon class="w-5 h-5" />
        <span>My Projects</span>
      </button>
      <img
        v-if="false"
        referrerpolicy="no-referrer"
        :src="user.photoURL"
        :alt="user.displayName"
        class="w-10 h-10 rounded-full border-2 border-gray-300 cursor-pointer"
      />
      <button
        @click="handleLogoutClick"
        class="cursor-pointer px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap"
      >
        <ArrowRightStartOnRectangleIcon class="w-5 h-5" />
        <span>Logout</span>
      </button>
    </div>
  </nav>
  
  <!-- DialogBox for logout confirmation -->
  <DialogBox
    :show="showLogoutDialog"
    title="Confirm Logout"
    message="Are you sure you want to logout?"
    @confirm="confirmLogout"
    @cancel="cancelLogout"
  />
</template>

<style scoped>
</style>

