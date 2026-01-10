<script setup>
import { ref, onMounted, inject, onUnmounted } from 'vue'
import { auth, db } from '../Firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import List from '../components/List.vue'

const user = ref(null)
const projects = ref([])
const isLoading = ref(false)

const global = inject('global')

const loadProjects = async (userId) => {
  if (!userId) {
    projects.value = []
    return
  }

  isLoading.value = true
  try {
    // Query to get only the current user's projects
    const q = query(
      collection(db, 'projects'),
      where('uid', '==', userId)
    )
    
    const querySnapshot = await getDocs(q)
    
    // Transform projects into objects with title, image and id
    projects.value = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.titolo || '',
        image: data.immagine || '',
        alt: data.titolo || 'Project'
      }
    })
  } catch (error) {
    console.error('Error loading projects:', error)
    projects.value = []
  } finally {
    isLoading.value = false
  }
}

const handleItemDeleted = (deletedItemId) => {
  // Remove deleted project from local list
  projects.value = projects.value.filter(item => item.id !== deletedItemId)
  // Reload projects to ensure list is synchronized
  if (user.value) {
    loadProjects(user.value.uid)
  }
}

// Function to reload projects when a new project is saved
const refreshProjects = () => {
  if (user.value) {
    loadProjects(user.value.uid)
  }
}

// Listener for custom project-saved event
const handleProjectSaved = () => {
  refreshProjects()
}

  onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
    if (currentUser) {
      loadProjects(currentUser.uid)
    } else {
      projects.value = []
    }
  })
  
  // Listen for custom project-saved event emitted from App.vue
  window.addEventListener('project-saved', handleProjectSaved)
})

onUnmounted(() => {
  window.removeEventListener('project-saved', handleProjectSaved)
})
</script>

<template>
  <div>
    <div class="text-4xl font-bold mb-6">List of Projects</div>
    <div v-if="user" class="mt-8">
      <div v-if="isLoading" class="text-center py-8">
        <p class="text-gray-600">Loading projects...</p>
      </div>
      <div v-else-if="projects.length > 0">
        <List 
          :items="projects" 
          :allow-delete="true"
          :allow-bookmark="true"
          :allow-add="true"
          @item-deleted="handleItemDeleted"
        />
      </div>
      <div v-else class="text-center py-8">
        <p class="text-gray-600">No projects found. Create your first project!</p>
      </div>
    </div>
    <div v-else class="mt-8 text-center py-8">
      <p class="text-gray-600">Please log in to see your projects</p>
    </div>
  </div>
</template>


<style scoped>
</style>
