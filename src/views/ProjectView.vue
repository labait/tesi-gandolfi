<script setup>
import { ref, onMounted, onBeforeUnmount, inject, watch, computed } from 'vue'
import { useRoute } from 'vue-router'

import { db } from '../Firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import Search from '../components/Search.vue'
import List from '../components/List.vue'

const route = useRoute()
const project = ref(null)
const error = ref(null)
const isAnalyzing = ref(false)
const global = inject('global')
const openLightbox = inject('openLightbox')

const search_text = computed(() => {
  return project.value?.analysis?.search_text || null
})

// Function to check if an image is bookmarked in the account
const isBookmarked = (item) => {
  if (!global.value?.account?.bookmarks || !item.image) {
    return false
  }
  return global.value.account.bookmarks.includes(item.image)
}

// Function to check if an image is already in the related array of the project
const isAdded = (item) => {
  if (!project.value?.related || !item.image) {
    return false
  }
  return project.value.related.includes(item.image)
}

// Function to reload account from Firebase
const reloadAccount = async (accountId) => {
  try {
    const accountRef = doc(db, 'accounts', accountId)
    const accountSnap = await getDoc(accountRef)

    if (accountSnap.exists()) {
      global.value.account = {
        id: accountSnap.id,
        ...accountSnap.data()
      }
      return global.value.account
    } else {
      console.error('Account not found')
      return null
    }
  } catch (error) {
    console.error('Error reloading account:', error)
    return null
  }
}

// Handle bookmark event from Search component
const handleItemBookmarked = async (item) => {
  if (!global.value?.account?.id || !item.image) {
    return
  }

  try {
    const accountRef = doc(db, 'accounts', global.value.account.id)
    const currentBookmarks = global.value.account.bookmarks || []
    
    // Check if image is already bookmarked
    const isAlreadyBookmarked = currentBookmarks.includes(item.image)
    
    let updatedBookmarks
    if (isAlreadyBookmarked) {
      // Remove bookmark
      updatedBookmarks = currentBookmarks.filter(url => url !== item.image)
    } else {
      // Add bookmark
      updatedBookmarks = [...currentBookmarks, item.image]
    }
    
    // Update Firestore
    await updateDoc(accountRef, {
      bookmarks: updatedBookmarks
    })
    
    // Reload account from Firebase and update global.account
    await reloadAccount(global.value.account.id)
    
    console.log('Bookmarks updated successfully')
  } catch (error) {
    console.error('Error updating bookmarks:', error)
    alert('Error updating bookmarks')
  }
}

// Handle add event from Search component
const handleItemAdded = async (item) => {
  if (!project.value?.id || !item.image) {
    return
  }

  try {
    const projectRef = doc(db, 'projects', project.value.id)
    const currentRelated = project.value.related || []
    
    // Check if image is already in related
    const isAlreadyRelated = currentRelated.includes(item.image)
    
    let updatedRelated
    if (isAlreadyRelated) {
      // Remove from related
      updatedRelated = currentRelated.filter(url => url !== item.image)
    } else {
      // Add to related
      updatedRelated = [...currentRelated, item.image]
    }
    
    // Update Firestore
    await updateDoc(projectRef, {
      related: updatedRelated,
      updatedAt: new Date().toISOString()
    })
    
    // Update local project
    project.value.related = updatedRelated
    // Update global.project as well
    global.value.project = { ...project.value }
    
    console.log('Related images updated successfully')
  } catch (error) {
    console.error('Error updating related images:', error)
    alert('Error updating related images')
  }
}

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

    // Add timestamp to analysis
    const analysisWithTimestamp = {
      ...analysisResult,
      analyzedAt: new Date().toISOString()
    }

    // Update project with analysis on Firebase
    if (project.value?.id) {
      const projectRef = doc(db, 'projects', project.value.id)
      await updateDoc(projectRef, {
        analysis: analysisWithTimestamp,
        updatedAt: new Date().toISOString()
      })
      
      // Update local project
      project.value.analysis = analysisWithTimestamp
      // Update global.project as well
      global.value.project = { ...project.value }
      
      console.log('Analysis saved successfully to Firebase')
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

const relatedImages = computed(() => {
  return project.value?.related.map(image => ({
    id: image,
    image: image,
    alt: 'Related image'
  })) || []
})

// Handle zoom event from Search and List components
const handleItemZoom = (item) => {
  if (item.image && openLightbox) {
    openLightbox(item.image)
  }
}
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
          class="cursor-pointer px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <MagnifyingGlassIcon class="w-5 h-5" />
          <span v-if="isAnalyzing">Analyzing...</span>
          <span v-else>Analyze source image</span>
        </button>
      </div>
    </div>

    <div v-if="relatedImages.length > 0" class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Related images</h2>
      <List 
        :items="relatedImages" 
        :allow-bookmark="true" 
        :allow-add="true"
        :allow-zoom="true"
        :is-bookmarked-fn="isBookmarked" 
        :is-add-fn="isAdded" 
        @item-bookmarked="handleItemBookmarked" 
        @item-added="handleItemAdded"
        @item-zoom="handleItemZoom"
      />
    </div>

    <div v-if="project && project.analysis" class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Analysis</h2>
      <div class="mb-8">
        <template v-for="key in Object.keys(project.analysis)">
          <h3 class="text-lg font-semibold">{{ key.replace('_', ' ').charAt(0).toUpperCase() + key.replace('_', ' ').slice(1) }}</h3>
          <p class="text-gray-700 whitespace-pre-wrap mb-2">{{ project.analysis[key] }}</p>
        </template>
      </div>
      <pre v-if="global.debug" class="text-md overflow-x-auto max-w-full max-h-[50vh] overflow-y-auto">{{ JSON.stringify(project.analysis, null, 2) }}</pre>
    </div>

    <div v-if="project?.analysis.colors" class="mb-8">
      <h2 class="text-2xl font-semibold mb-2">Color palette</h2>
      <div class="flex flex-wrap gap-2">
        <div v-for="color in project.analysis.colors.split(',').map(color => color.trim())" :key="color" class="flex items-center gap-2 flex-col">
          <div class="w-20 h-20 rounded-xl" :style="{ backgroundColor: color }"></div>
          <span>{{ color }}</span>
        </div>
      </div>
    </div>

    <div>
      <h2 class="text-2xl font-semibold mb-4">Search images</h2>
      <div v-if="search_text" class="mb-8"> 
        <Search 
          :auto-search="true" 
          :initial-query="project.analysis.search_text"
          :allow-bookmark="true"
          :allow-add="true"
          :allow-zoom="true"
          :is-bookmarked-fn="isBookmarked"
          :is-add-fn="isAdded"
          @item-bookmarked="handleItemBookmarked"
          @item-added="handleItemAdded"
          @item-zoom="handleItemZoom"
        />
      </div>
      <div v-else>
        Analyze the source image to get inspiration for your search.
      </div>
    </div>

  </div>
</template>

<style scoped>

</style>