<script setup>
import { ref, onMounted, onBeforeUnmount, inject, watch } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../Firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const project = ref(null)
const isLoading = ref(true)
const error = ref(null)
const isAnalyzing = ref(false)
const global = inject('global')

const loadProject = async () => {
  const projectId = route.params.id
  
  if (!projectId) {
    error.value = 'ID progetto non valido'
    isLoading.value = false
    global.value.project = null
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const projectRef = doc(db, 'projects', projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      project.value = {
        id: projectSnap.id,
        ...projectSnap.data()
      }
      // Valorizza global.project con l'oggetto project
      global.value.project = project.value
    } else {
      error.value = 'Progetto non trovato'
      global.value.project = null
    }
  } catch (err) {
    console.error('Errore durante il caricamento del progetto:', err)
    error.value = 'Errore durante il caricamento del progetto'
    global.value.project = null
  } finally {
    isLoading.value = false
  }
}

const handleAnalyze = async () => {
  if (!project.value?.immagine) {
    alert('Nessuna immagine disponibile per l\'analisi')
    return
  }

  isAnalyzing.value = true
  error.value = null

  try {
    // Scarica l'immagine dall'URL Firebase Storage
    const imageResponse = await fetch(project.value.immagine)
    if (!imageResponse.ok) {
      throw new Error('Errore nel download dell\'immagine')
    }

    // Converti la risposta in Blob
    const imageBlob = await imageResponse.blob()
    
    // Converti il Blob in base64
    const reader = new FileReader()
    const base64Promise = new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1] // Rimuove il prefisso data:image/...;base64,
        resolve(base64String)
      }
      reader.onerror = reject
      reader.readAsDataURL(imageBlob)
    })
    
    const base64Image = await base64Promise
    const mimeType = imageBlob.type || 'image/jpeg'

    // Invia l'immagine come JSON (più affidabile con Netlify Functions)
    const response = await fetch('/.netlify/functions/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: base64Image,
        mimeType: mimeType
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Errore sconosciuto' }))
      throw new Error(errorData.error || `Errore: ${response.status}`)
    }

    const data = await response.json()
    console.log('Analysis result:', data)

    // Parse del risultato (potrebbe essere una stringa JSON)
    let analysisResult
    try {
      analysisResult = typeof data.result === 'string' ? JSON.parse(data.result) : data.result
    } catch (parseError) {
      // Se non è JSON valido, salva come stringa
      analysisResult = data.result
    }

    // Aggiorna il progetto con l'analysis
    if (project.value?.id) {
      const projectRef = doc(db, 'projects', project.value.id)
      await updateDoc(projectRef, {
        analysis: analysisResult
      })
      
      // Aggiorna il progetto locale
      project.value.analysis = analysisResult
      // Aggiorna anche global.project
      global.value.project = { ...project.value }
    }

  } catch (err) {
    console.error('Errore durante l\'analisi:', err)
    error.value = err.message || 'Errore durante l\'analisi dell\'immagine'
    alert(`Errore: ${error.value}`)
  } finally {
    isAnalyzing.value = false
  }
}

onMounted(() => {
  loadProject()
})

// Watch sulla route per ricaricare il progetto se cambia l'ID
watch(() => route.params.id, (newId, oldId) => {
  if (newId !== oldId) {
    loadProject()
  }
})

onBeforeUnmount(() => {
  // Resetta global.project quando il componente viene smontato
  global.value.project = null
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="isLoading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Caricamento progetto...</p>
    </div>

    <div v-else-if="error" class="text-center py-12">
      <div class="text-red-600 text-5xl mb-4">⚠️</div>
      <h2 class="text-2xl font-bold text-gray-800 mb-2">Errore</h2>
      <p class="text-gray-600 mb-6">{{ error }}</p>
    </div>

    <div v-else-if="project" class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold mb-6">{{ project.titolo || 'Progetto senza titolo' }}</h1>
      
      <div v-if="project.immagine" class="mb-8 max-h-[50vh] rounded-lg shadow-lg overflow-hidden flex items-center justify-center bg-gray-100">
        <img 
          :src="project.immagine" 
          :alt="project.titolo || 'Immagine progetto'"
          class="max-w-full max-h-full w-auto h-auto object-contain"
        />
      </div>

      <div v-if="project.note" class="mb-8">
        <h2 class="text-2xl font-semibold mb-2">Note</h2>
        <p class="text-gray-700 whitespace-pre-wrap">{{ project.note }}</p>
      </div>

      <div v-if="project.analysis" class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Analysis</h2>
        <div class="bg-gray-100 rounded-lg p-4 overflow-auto">
          <pre class="text-sm">{{ JSON.stringify(project.analysis, null, 2) }}</pre>
        </div>
      </div>

      <div v-else class="mb-8">
        <button
          @click="handleAnalyze"
          :disabled="isAnalyzing"
          class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <MagnifyingGlassIcon class="w-5 h-5" />
          <span v-if="isAnalyzing">Analizzando...</span>
          <span v-else>Analyze source image</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
pre {
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>