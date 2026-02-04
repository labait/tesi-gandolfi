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
// import LightboxGrid from './components/LightboxGrid.vue' //PROVAAAAA
import Gallery from './components/Gallery.vue' //PROVAAAAA

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

<!-- LOGO PRISMA/HEADER-->
<template>
  <Loading v-if="global.loading" />
<header
  class="fixed top-0 left-0 w-full z-50 background"
>
  <div
    class="mx-auto flex items-center relative px-4 py-2"
  >
    <!-- LOGO -->
    <div
      @click="goToHomepage"
      class="cursor-pointer flex items-center relative z-10"
    >
      <!-- Desktop -->
      <img
        src="/logo_prisma_definitivo.svg"
        alt="Prisma Logo"
        class="hidden sm:block h-15 w-auto"
      />
      <!-- Mobile -->
      <img
        src="/logo_rid_prisma.svg"
        alt="Prisma Rid Logo"
        class="block sm:hidden h-15 w-auto"
      />
    </div>

    <!-- BOTTONI -->
    <Nav class="absolute left-1/2 -translate-x-1/2" />

  </div>
</header>
<main class="pt-20">
  <RouterView />
</main>






<Gallery />
    
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

</template>



<style scoped>
.background {
  @apply 
    bg-[rgb(245,246,239)]
  
}
</style>
