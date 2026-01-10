<template>
  <div v-if="show" class="flex justify-center gap-2 items-center">
    <button
      v-if="hasPreviousPage"
      @click="$emit('previous')"
      class="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer text-4xl"
    >
      ←
    </button>
    <span v-else class="px-4 py-2 text-gray-400 text-4xl">←</span>
    
    <button
      v-if="showFirstPage"
      @click="$emit('first')"
      class="px-4 py-2 text-blue-600 hover:text-blue-800 text-xl transition-colors cursor-pointer"
    >
      1st Page
    </button>
    
    <span class="py-2 text-gray-600 text-xl">
      Page {{ currentPage }} - {{ totalResults }} results
    </span>
    
    <button
      v-if="hasNextPage"
      @click="$emit('next')"
      class="py-2 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer text-4xl"
    >
      →
    </button>
    <span v-else class="py-2 text-gray-400 text-4xl">→</span>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  hasPreviousPage: {
    type: Boolean,
    default: false
  },
  hasNextPage: {
    type: Boolean,
    default: false
  },
  showFirstPage: {
    type: Boolean,
    default: false
  },
  currentPage: {
    type: Number,
    default: 1
  },
  totalResults: {
    type: Number,
    default: 0
  }
})

defineEmits(['previous', 'next', 'first'])
</script>

<style scoped>
</style>
