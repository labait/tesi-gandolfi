<!-- BOX IMMAGINI-->
<script setup>
import { defineProps, defineEmits, watch, onBeforeUnmount, ref } from 'vue'
import { XMarkIcon, PlusIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    default: ''
  },
  projects: {
    type: Array,
    default: () => []
  },
  isSearchResult: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'add-image'])

const selectedProjectId = ref(null)
const showProjectDropdown = ref(false)

const handleClose = () => {
  emit('close')
}

const handleOverlayClick = (event) => {
  // Close only if clicking on the overlay itself, not on the image container
  if (event.target === event.currentTarget) {
    handleClose()
  }
}

const handleAddImage = (projectId) => {
  emit('add-image', {
    imageUrl: props.imageUrl,
    projectId: projectId
  })
  showProjectDropdown.value = false
  selectedProjectId.value = null
}

// Close on Escape key
let escapeHandler = null

watch(() => props.show, (isShowing) => {
  if (isShowing) {
    escapeHandler = (event) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', escapeHandler)
  } else {
    if (escapeHandler) {
      window.removeEventListener('keydown', escapeHandler)
      escapeHandler = null
    }
  }
})

onBeforeUnmount(() => {
  if (escapeHandler) {
    window.removeEventListener('keydown', escapeHandler)
  }
})
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-white/90  flex items-center justify-center z-50"
    @click="handleOverlayClick"
  >
    <div class="relative max-w-[80vw] max-h-[80vh] flex items-center justify-center">
      <!-- Close button -->
      <button
        @click="handleClose"
        class="absolute top-4 right-4 z-10 p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md cursor-pointer"
        title="Close"
      >
        <XMarkIcon class="w-4 h-4 text-[rgb(41,42,42)]" />
      </button>

      <!-- Add to project button (only for search results) -->
      <div v-if="isSearchResult && projects.length > 0" class="absolute top-4 left-4 z-10">
        <div class="relative">
          <button
            @click="showProjectDropdown = !showProjectDropdown"
            class="p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md cursor-pointer flex items-center gap-2"
            title="Add image to project"
          >
            <PlusIcon class="w-4 h-4 text-[rgb(41,42,42)]" />
          </button>

          <!-- Dropdown menu -->
          <div
            v-if="showProjectDropdown"
            class="absolute top-12 left-0 bg-white rounded-lg shadow-xl z-20 min-w-max"
          >
            <p class="px-3 py-2 text-xs font-semibold text-gray-600 border-b">Add to project:</p>
            <button
              v-for="project in projects"
              :key="project.id"
              @click="handleAddImage(project.id)"
              class="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-gray-700 first:rounded-t-lg last:rounded-b-lg"
            >
              {{ project.title }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Image container -->
      <div class="max-w-full max-h-full flex items-center justify-center">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          alt="Zoomed image"
          class="max-w-full max-h-[100vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .bg-black {
    background-color: rgb(61, 61, 58);
  }
  .bg-white {
    background-color: rgb(245, 246, 239);
  }
</style>