<!-- BOX IMMAGINI-->
<script setup>
import { defineProps, defineEmits, watch, onBeforeUnmount } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}

const handleOverlayClick = (event) => {
  // Close only if clicking on the overlay itself, not on the image container
  if (event.target === event.currentTarget) {
    handleClose()
  }
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
    class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    @click="handleOverlayClick"
  >
    <div class="relative max-w-[80vw] max-h-[80vh] flex items-center justify-center">
      <!-- Close button -->
      <button
        @click="handleClose"
        class="absolute top-4 right-4 z-10 p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md cursor-pointer"
        title="Close"
      >
        <XMarkIcon class="w-6 h-6 text-gray-800" />
      </button>
      
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
