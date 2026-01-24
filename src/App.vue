<script setup>
import { ref, provide, onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'

import { auth, db } from './Firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

import Nav from './components/Nav.vue'
import ProjectForm from './components/ProjectForm.vue'
import Loading from './components/Loading.vue'
import LightBox from './components/LightBox.vue'
import LightboxGrid from './components/LightboxGrid.vue' //PROVAAAAA

const router = useRouter()
const projectFormRef = ref(null)

// Global object containing all shared states
const global = ref({
  debug: false,
  loading: null,
  account: null,
  project: null,
  lightbox: {
    show: false,
    imageUrl: '',
    layout: 'grid' // 'grid' | 'map' PROVAAAAA
  }
})



// GESTIONE ACCOUNT FIREBASE
const ensureAccount = async (uid) => {
  if (!uid) {
    global.value.account = null
    return null
  }

  try {
    const accountRef = doc(db, 'accounts', uid)
    const accountSnap = await getDoc(accountRef)

    if (accountSnap.exists()) {
      // Account exists, load it
      global.value.account = {
        id: accountSnap.id,
        ...accountSnap.data()
      }
    } else {
      // Account doesn't exist, create it
      const newAccount = {
        uid: uid,
        bookmarks: [],
        roles: []
      }
      
      await setDoc(accountRef, newAccount)
      
      // Load the newly created account
      global.value.account = {
        id: accountRef.id,
        ...newAccount
      }
    }

    return global.value.account
  } catch (error) {
    console.error('Error loading/creating account:', error)
    global.value.account = null
    return null
  }
}

// AUTENTCAZIONE
onMounted(() => {
  // global.debug = true if query param debug is present
  if (window.location.search.includes('debug')) {
    global.value.debug = true
  }


  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User logged in, ensure account exists and load it
      await ensureAccount(user.uid)
    } else {
      // User not logged in, reset account
      global.value.account = null
    }
  })
})

// Expose global object via provide
provide('global', global)

// Function to open project modal
const openProjectModal = () => {
  projectFormRef.value?.openModal()
}

// Expose function to open modal via provide
provide('openProjectModal', openProjectModal)

// GESTIONE LIGHTBOX
const openLightbox = (imageUrl) => {
  global.value.lightbox.show = true
  global.value.lightbox.imageUrl = imageUrl
}

// Expose function to open lightbox via provide
provide('openLightbox', openLightbox)

// Function to close lightbox
const closeLightbox = () => {
  global.value.lightbox.show = false
  global.value.lightbox.imageUrl = ''
}

// NAVIGAZIONE ALL'HOMEPAGE
const goToHomepage = () => {
  // Always navigate to Homepage, bypassing guard that redirects to /projects
  router.push({ name: 'Homepage', query: { force: 'true' } })
}

// HANDLER EVENTO SALVATAGGIO PROGETTO
const handleProjectSaved = () => {
  // Event emitted when a project is saved
  // Emit custom event to notify other components
  window.dispatchEvent(new CustomEvent('project-saved'))
}

// BOTTONI GRIGLIE O MAPPA
lightboxLayout: 'grid' | 'map'


</script>

<!-- LA SCEHRMATA -->
<template>
  <Loading v-if="global.loading" />
  <div class="min-h-screen">
    <main class="container mx-auto px-4 py-8">
      <Nav />
      <h1 
  @click="goToHomepage"
  class="mb-8 font-bold text-6xl md:text-[8vw] text-center mt-10 cursor-pointer hover:opacity-80 transition-opacity"
>
  prisma
</h1>

<!-- PROVAAAAA-->
<div class="flex justify-center gap-4 mb-8">
  <button
    @click="global.lightbox.layout = 'grid'"
    :class="[
      'px-4 py-2 rounded-full text-sm font-semibold transition',
      global.lightbox.layout === 'grid'
        ? 'bg-black text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    ]"
  >
    Grid
  </button>

  <button
    @click="global.lightbox.layout = 'map'"
    :class="[
      'px-4 py-2 rounded-full text-sm font-semibold transition',
      global.lightbox.layout === 'map'
        ? 'bg-black text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    ]"
  >
    Map
  </button>
</div>

<LightboxGrid />
<!-- PROVAAAAA-->
    
      <pre v-if="global.debug" class="mb-8 container mx-auto overflow-x-auto">{{ global }}</pre>
      <RouterView />
      <!-- Hidden ProjectForm, used only for modal -->
      <ProjectForm ref="projectFormRef" @project-saved="handleProjectSaved" />
      <!-- LightBox component for image zoom -->
      <LightBox 
        :show="global.lightbox.show" 
        :image-url="global.lightbox.imageUrl"
        @close="closeLightbox"
      />
    </main>
  </div>
</template>

<style scoped>

</style>
