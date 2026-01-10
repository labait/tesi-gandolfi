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
    // Query per ottenere solo i progetti dell'utente corrente
    const q = query(
      collection(db, 'projects'),
      where('uid', '==', userId)
    )
    
    const querySnapshot = await getDocs(q)
    
    // Trasforma i progetti in oggetti con title, image e id
    projects.value = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.titolo || '',
        image: data.immagine || '',
        alt: data.titolo || 'Progetto'
      }
    })
  } catch (error) {
    console.error('Errore durante il caricamento dei progetti:', error)
    projects.value = []
  } finally {
    isLoading.value = false
  }
}

const handleItemDeleted = (deletedItemId) => {
  // Rimuovi il progetto eliminato dalla lista locale
  projects.value = projects.value.filter(item => item.id !== deletedItemId)
  // Ricarica i progetti per assicurarsi che la lista sia sincronizzata
  if (user.value) {
    loadProjects(user.value.uid)
  }
}

// Funzione per ricaricare i progetti quando un nuovo progetto viene salvato
const refreshProjects = () => {
  if (user.value) {
    loadProjects(user.value.uid)
  }
}

// Listener per l'evento custom project-saved
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
  
  // Ascolta l'evento custom project-saved emesso da App.vue
  window.addEventListener('project-saved', handleProjectSaved)
})

onUnmounted(() => {
  window.removeEventListener('project-saved', handleProjectSaved)
})
</script>

<template>
  <div>
    <h1>Projects</h1>
    <div v-if="user" class="mt-8">
      <div v-if="isLoading" class="text-center py-8">
        <p class="text-gray-600">Caricamento progetti...</p>
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
        <p class="text-gray-600">Nessun progetto trovato. Crea il tuo primo progetto!</p>
      </div>
    </div>
    <div v-else class="mt-8 text-center py-8">
      <p class="text-gray-600">Effettua il login per vedere i tuoi progetti</p>
    </div>
  </div>
</template>


<style scoped>
</style>
