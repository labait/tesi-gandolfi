<script setup>
import { ref, onMounted } from 'vue'
import { auth, db } from '../Firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import ProjectForm from '../components/ProjectForm.vue'
import List from '../components/List.vue'

const user = ref(null)
const projects = ref([])
const isLoading = ref(false)

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
    
    // Trasforma i progetti in oggetti con title e image
    projects.value = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
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

onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
    if (currentUser) {
      loadProjects(currentUser.uid)
    } else {
      projects.value = []
    }
  })
})
</script>

<template>
  <div>
    <h1>Profile</h1>
    <div v-if="user" class="mt-6 flex justify-center">
      <ProjectForm @project-saved="loadProjects(user.uid)" />
    </div>
    <div v-if="user" class="mt-8">
      <div v-if="isLoading" class="text-center py-8">
        <p class="text-gray-600">Caricamento progetti...</p>
      </div>
      <div v-else-if="projects.length > 0">
        <List :items="projects" />
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