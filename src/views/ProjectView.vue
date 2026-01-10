<script setup>
import { ref, onMounted, onBeforeUnmount, inject, watch } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../Firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const project = ref(null)
const error = ref(null)
const isAnalyzing = ref(false)
const global = inject('global')

const loadProject = async () => {
  const projectId = route.params.id
  global.value.loading = 'Loading project...'
  if (!projectId) {
    error.value = 'Invalid project ID'
    global.value.project = null
    return
  }
  error.value = null

  try {
    const projectRef = doc(db, 'projects', projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      project.value = {
        id: projectSnap.id,
        ...projectSnap.data()
      }
      // Populate global.project with the project object
      global.value.project = project.value
    } else {
      error.value = 'Project not found'
      global.value.project = null
    }
  } catch (err) {
    console.error('Error loading project:', err)
    error.value = 'Error loading project'
    global.value.project = null
  } finally {
    global.value.loading = null
  }
}

const handleAnalyze = async () => {
  if (!project.value?.immagine) {
    alert('No image available for analysis')
    return
  }

  isAnalyzing.value = true
  error.value = null
  global.value.loading = 'Analyzing image...'
  try {
    // Send image URL to Netlify function
    // The function will download the image server-side (no CORS issues)
    const response = await fetch('/.netlify/functions/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageUrl: project.value.immagine
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      const errorMessage = errorData.error || `Error: ${response.status}`
      const errorHint = errorData.hint || ''
      throw new Error(errorMessage + (errorHint ? `\n\n${errorHint}` : ''))
    }

    const data = await response.json()
    console.log('Analysis result:', data)

    // Parse result (might be a JSON string)
    let analysisResult
    try {
      analysisResult = typeof data.result === 'string' ? JSON.parse(data.result) : data.result
    } catch (parseError) {
      // If not valid JSON, save as string
      analysisResult = data.result
    }

    // Update project with analysis
    if (project.value?.id) {
      const projectRef = doc(db, 'projects', project.value.id)
      await updateDoc(projectRef, {
        analysis: analysisResult
      })
      
      // Update local project
      project.value.analysis = analysisResult
      // Update global.project as well
      global.value.project = { ...project.value }
    }

  } catch (err) {
    console.error('Error during analysis:', err)
    error.value = err.message || 'Error during image analysis'
    alert(`Error: ${error.value}`)
  } finally {
    isAnalyzing.value = false
    global.value.loading = false
  }
}

onMounted(() => {
  loadProject()
})

// Watch route to reload project if ID changes
watch(() => route.params.id, (newId, oldId) => {
  if (newId !== oldId) {
    loadProject()
  }
})

onBeforeUnmount(() => {
  // Reset global.project when component is unmounted
  global.value.project = null
})
</script>

<template>
  <div class="container mx-auto">
    <div v-if="error" class="text-center py-12">
      <div class="text-red-600 text-5xl mb-4">⚠️</div>
      <h2 class="text-2xl font-bold text-gray-800 mb-2">Error</h2>
      <p class="text-gray-600 mb-6">{{ error }}</p>
    </div>

    <div v-else-if="project" class="">
      <h1 class="text-4xl font-bold mb-6">
        {{ project.titolo || 'Untitled Project' }}
      </h1>
      
      <div v-if="project.immagine" class="mb-8 max-h-[50vh] rounded-lg shadow-lg overflow-hidden flex items-center justify-center bg-gray-100">
        <img 
          :src="project.immagine" 
          :alt="project.titolo || 'Project image'"
          class="max-w-full max-h-full w-auto h-auto object-contain"
        />
      </div>

      <div v-if="project.note" class="mb-8">
        <h2 class="text-2xl font-semibold mb-2">Notes</h2>
        <p class="text-gray-700 whitespace-pre-wrap">{{ project.note }}</p>
      </div>

      <div class="mb-8 flex justify-center">
        <button
          @click="handleAnalyze"
          :disabled="isAnalyzing"
          class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <MagnifyingGlassIcon class="w-5 h-5" />
          <span v-if="isAnalyzing">Analyzing...</span>
          <span v-else>Analyze source image</span>
        </button>
      </div>
    </div>

    <div v-if="project && project.analysis" class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Analysis</h2>
      <pre v-if="global.debug" class="text-md overflow-x-auto max-w-full max-h-[50vh] overflow-y-auto">{{ JSON.stringify(project.analysis, null, 2) }}</pre>
    </div>

  </div>
</template>

<style scoped>

</style>