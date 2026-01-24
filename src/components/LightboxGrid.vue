<!-- PROVAAAAAA-->
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
  if (event.target === event.currentTarget) {
    handleClose()
  }
}

// ESC key
let escapeHandler = null

watch(() => props.show, (isShowing) => {
  if (isShowing) {
    escapeHandler = (event) => {
      if (event.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', escapeHandler)
  } else {
    window.removeEventListener('keydown', escapeHandler)
    escapeHandler = null
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', escapeHandler)
})
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 flex items-center justify-center z-50"
    :style="{ backgroundColor: 'rgb(61, 61, 58)' }"
    @click="handleOverlayClick"
  >
    <div class="relative w-full h-full flex items-center justify-center">
      
      <!-- Close button -->
      <button
        @click="handleClose"
        class="absolute top-6 right-6 p-2 rounded-full shadow-md transition hover:opacity-80"
        :style="{ backgroundColor: 'rgb(244, 241, 229)' }"
        title="Close"
      >
        <XMarkIcon class="w-6 h-6 text-gray-800" />
      </button>

      <!-- Image -->
      <img
        v-if="imageUrl"
        :src="imageUrl"
        alt="Zoomed image"
        class="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
      />
    </div>
  </div>
</template>

<style scoped>
  
</style>