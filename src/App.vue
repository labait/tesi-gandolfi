<script setup>
import { ref, provide, onMounted, computed } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'

import { auth, db } from './Firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'

import Nav from './components/Nav.vue'
import ProjectForm from './components/ProjectForm.vue'
import Loading from './components/Loading.vue'
import LightBox from './components/LightBox.vue'
import Search from './components/Search.vue'
import List from './components/List.vue'
import ListPagination from './components/ListPagination.vue'


const router = useRouter()
const route = useRoute()
const projectFormRef = ref(null)

// Computed property to check if we're in ProjectsView
const isProjectsView = computed(() => route.name === 'Projects')

// Computed property to check if we're in ProjectView
const isProjectView = computed(() => route.name === 'Project')

// Computed property to check if we're viewing search results
const isSearchResult = computed(() => !isProjectsView.value && !isProjectView.value)

// Global object containing all shared states
const global = ref({
  debug: false,
  loading: null,
  account: null,
  project: null,
  searchResults: [],
  projects: [],
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

// Function to load user's projects
const loadUserProjects = async (userId) => {
  if (!userId) {
    global.value.projects = []
    return
  }

  try {
    const q = query(
      collection(db, 'projects'),
      where('uid', '==', userId)
    )
    const querySnapshot = await getDocs(q)
    
    global.value.projects = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.titolo || '',
        image: data.immagine || '',
        alt: data.titolo || 'Project',
        related: data.related || []
      }
    })
    
    console.log('Projects loaded:', global.value.projects)
  } catch (error) {
    console.error('Error loading projects:', error)
    global.value.projects = []
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
      // Load user's projects for the add-to-project dropdown
      await loadUserProjects(user.uid)
    } else {
      // User not logged in, reset account
      global.value.account = null
      global.value.projects = []
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

// Handle search results from header Search component
const handleSearchResults = (results) => {
  global.value.searchResults = results
}

// Handle adding image to project from LightBox
const handleAddImageToProject = async (data) => {
  try {
    const { imageUrl, projectId } = data
    
    if (!projectId || !imageUrl) {
      alert('Invalid image or project selection')
      return
    }

    global.value.loading = 'Adding image to project...'

    // Update the project in Firestore
    const projectRef = doc(db, 'projects', projectId)
    // Get current project data
    const projectSnap = await getDoc(projectRef)
    
    if (projectSnap.exists()) {
      const projectData = projectSnap.data()
      const currentRelated = projectData.related || []
      
      // Check if image is already in related
      if (!currentRelated.includes(imageUrl)) {
        const updatedRelated = [...currentRelated, imageUrl]
        
        // Update Firestore with timestamp
        await updateDoc(projectRef, {
          related: updatedRelated,
          updatedAt: new Date().toISOString()
        })
        
        console.log('Image added successfully to project:', projectId)
        
        // Update global projects list
        const projectIndex = global.value.projects.findIndex(p => p.id === projectId)
        if (projectIndex !== -1) {
          global.value.projects[projectIndex].related = updatedRelated
        }
        
        // Update global.project if it's the currently viewed project
        if (global.value.project && global.value.project.id === projectId) {
          global.value.project.related = updatedRelated
        }
        
        // Dispatch custom event to notify ProjectView to reload if needed
        window.dispatchEvent(new CustomEvent('image-added-to-project', { detail: { projectId } }))
        
        global.value.loading = null
        alert('Image added to project successfully!')
        closeLightbox()
      } else {
        global.value.loading = null
        alert('This image is already in the project')
      }
    } else {
      global.value.loading = null
      alert('Project not found')
    }
  } catch (error) {
    console.error('Error adding image to project:', error)
    global.value.loading = null
    alert(`Error adding image to project: ${error.message}`)
  }
}

// NAVIGAZIONE ALL'HOMEPAGE
const goToHomepage = () => {
  // Navigate to Homepage
  router.push({ name: 'Homepage' })
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
    class="mx-auto flex items-center justify-between px-4 py-2 gap-4"
  >
    <!-- LOGO (sinistra) -->
    <div
      @click="goToHomepage"
      class="cursor-pointer flex items-center flex-shrink-0"
    >
      <!-- Desktop -->
      <img
        src="/logo_prisma_definitivo.svg"
        alt="Prisma Logo"
        class="hidden sm:block h-20 w-auto"
      />
      <!-- Mobile -->
      <img
        src="/logo_rid_prisma.svg"
        alt="Prisma Rid Logo"
        class="block sm:hidden h-20 w-auto"
      />
    </div>

    <!-- BARRA DI RICERCA (centro) -->
    <div v-if="!isProjectsView && !isProjectView" class="flex-1 max-w-2xl mx-4">
      <Search 
        :show-in-header="true"
        :allow-bookmark="false"
        :allow-add="false"
        :allow-zoom="true"
        :auto-search="true"
        initial-query="helvetica red poster"
        @search-results="handleSearchResults"
      />
    </div>

    <!-- BOTTONI (destra) -->
    <Nav :is-projects-view="isProjectsView" />

  </div>
</header>

<main class="pt-32">
  <RouterView />
</main>

<!-- ProjectForm Modal -->
<ProjectForm ref="projectFormRef" @project-saved="handleProjectSaved" />

<!-- LightBox for image zoom -->
<LightBox 
  :show="global.lightbox.show" 
  :image-url="global.lightbox.imageUrl"
  :projects="global.projects"
  :is-search-result="isSearchResult"
  @close="closeLightbox"
  @add-image="handleAddImageToProject"
/>


</template>



<style scoped>
.background {
  @apply 
    bg-[rgb(245,246,239)]
  
}
</style>