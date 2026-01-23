<!-- FINESTRA NUOVO PROGETTO-->
<template>
    <!-- Modale -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 class="text-2xl font-bold mb-6">New Project</h2>

        <form @submit.prevent="saveProject" class="space-y-6">
          <!-- Project Title (required) -->
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
              Project Title <span class="text-red-500">*</span>
            </label>
            <input
              id="title"
              v-model="formData.title"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project title"
            />
          </div>

          <!-- Notes (optional) -->
          <div>
            <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              v-model="formData.notes"
              rows="4"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project notes (optional)"
            ></textarea>
          </div>

          <!-- Image Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Reference Image
            </label>
            <div
              class="w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors"
              :class="[
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50',
                imagePreview ? 'border-green-400 bg-green-50' : ''
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
          </div>

          <!-- Buttons -->
          <div class="flex justify-end gap-4 pt-4">
            <button
              type="button"
              @click="closeModal"
              class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSaving || !formData.title"
              class="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="!isSaving">Save</span>
              <span v-else>Saving...</span>
            </button>
          </div>
        </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineExpose } from 'vue'
import { auth, db, storage } from '../Firebase'
import { collection, addDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const emit = defineEmits(['project-saved'])

const isModalOpen = ref(false)
const isDragging = ref(false)
const imagePreview = ref(null)
const imageName = ref('')
const imageFile = ref(null)
const isSaving = ref(false)
const fileInput = ref(null)

const formData = ref({
  title: '',
  notes: ''
})

const openModal = () => {
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  // Reset form
  formData.value = {
    title: '',
    notes: ''
  }
  imagePreview.value = null
  imageName.value = ''
  imageFile.value = null
}

// Expose openModal method to be called from outside
defineExpose({
  openModal
})

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

const saveProject = async () => {
  if (!formData.value.title) {
    return
  }

  const currentUser = auth.currentUser
  if (!currentUser) {
    alert('You must be logged in to create a project')
    return
  }

  isSaving.value = true

  try {
    let imageUrl = null

    // If there's an image, upload it to Firebase Storage
    if (imageFile.value) {
      try {
        // Generate a unique filename
        const timestamp = Date.now()
        const fileName = `${timestamp}_${imageFile.value.name}`
        const imageRef = storageRef(storage, `projects/${currentUser.uid}/${fileName}`)
        
        // Upload the file
        await uploadBytes(imageRef, imageFile.value)
        
        // Get the download URL
        imageUrl = await getDownloadURL(imageRef)
        console.log('Image uploaded successfully:', imageUrl)
      } catch (storageError) {
        console.error('Error during image upload:', storageError)
        // If there's an error with image upload, continue without image
        alert('Error during image upload. The project will be saved without image.')
      }
    }

    // Create the project in Firestore
    const projectData = {
      uid: currentUser.uid,
      titolo: formData.value.title,
      note: formData.value.notes || '',
      immagine: imageUrl || '',
      createdAt: new Date()
    }

    await addDoc(collection(db, 'projects'), projectData)

    // Emit event to notify parent component
    emit('project-saved')
    
    // Close modal
    closeModal()
    
    alert('Project created successfully!')
  } catch (error) {
    console.error('Error during project save:', error)
    alert(`Error during project save: ${error.message}`)
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
</style>
