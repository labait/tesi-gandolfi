<!-- HEADER BOTTONI -->
<script setup>
import { ref, onMounted, inject, defineProps } from 'vue'
import { useRouter } from 'vue-router'
import { auth, googleProvider } from '../Firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { PlusIcon, Squares2X2Icon, ArrowRightStartOnRectangleIcon } from '@heroicons/vue/24/outline'
import DialogBox from './DialogBox.vue'

const props = defineProps({
  isProjectsView: {
    type: Boolean,
    default: false
  }
})

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
    // Redirect to homepage after successful login
    router.push({ name: 'Homepage' })
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
    router.push({ name: 'Homepage' })
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
  <div v-if="!user" class="flex items-center">
    <!-- BOTTONE LOGIN GOOGLE -->
    <button
      @click="loginWithGoogle" 
      class="btn-header1"
    >
      <span>Connect with Google</span>
    </button>
  </div>
  <div v-else class="flex flex-row items-center gap-3">
    <!-- BOTTONE NUOVO PROGETTO (sempre visibile) -->
    <button
      v-if="openProjectModal"
      @click="openProjectModal"
      class="btn-header1"
    >
      <PlusIcon class="w-4 h-4" />
      <span class="hidden lg:inline">New Project</span>
    </button>

    <!-- BOTTONE VAI AI PROGETTI (nascosto in ProjectsView) -->
    <button
      v-if="!isProjectsView"
      @click="goToProjects" 
      class="btn-header1"
    >
      <Squares2X2Icon class="w-4 h-4" />
      <span class="hidden lg:inline">My Projects</span>
    </button>
    
    <!-- BOTTONE LOGOUT (solo in ProjectsView) -->
    <button
      v-if="isProjectsView"
      @click="handleLogoutClick"
      class="btn-header1"
    >
      <ArrowRightStartOnRectangleIcon class="w-4 h-4" />
      <span class="hidden lg:inline">Logout</span>
    </button>
  </div>
  
  <!-- DialogBox PER CONFERMA LOGOUT-->
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