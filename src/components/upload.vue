<template>
  <div class="flex flex-col items-center justify-center  p-8">
    <div
      class="w-full max-w-2xl border-2 border-dashed rounded-lg p-12 text-center transition-colors"
      :class="[
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50',
        hasImage ? 'border-green-400 bg-green-50' : ''
      ]"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileSelect"
      />
      
      <div v-if="!imagePreview" class="space-y-4">
        <svg
          class="mx-auto h-16 w-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <div>
          <p class="text-lg font-medium text-gray-700">
            Drag an image here or click to select
          </p>
          <p class="text-sm text-gray-500 mt-2">
            PNG, JPG, GIF up to 10MB
          </p>
        </div>
      </div>
      
      <div v-else class="space-y-4">
        <img
          :src="imagePreview"
          alt="Image preview"
          class="max-h-64 mx-auto rounded-lg shadow-lg"
        />
        <p class="text-sm text-gray-600">{{ imageName }}</p>
      </div>
    </div>

    <button
      v-if="hasImage"
      @click="analyze"
      :disabled="isAnalyzing"
      class="mt-8 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span v-if="!isAnalyzing">Analyze Image</span>
      <span v-else>Analyzing...</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const fileInput = ref(null)
const isDragging = ref(false)
const imagePreview = ref(null)
const imageName = ref('')
const imageFile = ref(null)
const isAnalyzing = ref(false)

const hasImage = computed(() => imagePreview.value !== null)

const handleDragOver = (e) => {
  isDragging.value = true
}

const handleDragLeave = (e) => {
  isDragging.value = false
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files.length > 0) {
    processFile(files[0])
  }
}

const handleFileSelect = (e) => {
  const files = e.target.files
  if (files.length > 0) {
    processFile(files[0])
  }
}

const processFile = (file) => {
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file')
    return
  }

  imageName.value = file.name
  imageFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const triggerFileInput = () => {
  if (!imagePreview.value) {
    fileInput.value?.click()
  }
}

const analyze = async () => {
  if (!imageFile.value) {
    console.error('No image selected')
    return
  }

  isAnalyzing.value = true

  try {
    // Create FormData to send the image
    const formData = new FormData()
    formData.append('image', imageFile.value)

    // Call Netlify serverless function
    const response = await fetch('/.netlify/functions/analyze', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Output:', data)
    
  } catch (error) {
    console.error('Error during analysis:', error)
  } finally {
    isAnalyzing.value = false
  }
}
</script>

<style scoped>
</style>