<script setup>
  import { defineProps, defineEmits } from 'vue'
  import { ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/vue/24/outline'
  
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
  

<template>
  <div v-if="show" class="flex justify-center gap-2 items-center py-4">
    <button
      v-if="showFirstPage"
      @click="$emit('first')"
      class=" text-blue-600 hover:text-blue-800 transition-colors cursor-pointer text-4xl"
    >
      <ChevronDoubleLeftIcon class="w-10 h-10" />
    </button>

    <button
      v-if="hasPreviousPage"
      @click="$emit('previous')"
      class=" text-blue-600 hover:text-blue-800 transition-colors cursor-pointer text-4xl"
    >
      <ChevronLeftIcon class="w-10 h-10" />
    </button>
    <span v-else class="px-4 py-2 text-gray-400 text-4xl">
      <ChevronLeftIcon class="w-10 h-10" />
    </span>

    
    <span class="py-2 text-gray-600 text-xl">
      Page {{ currentPage }} - {{ totalResults }} results
    </span>
    
    <button
      v-if="hasNextPage"
      @click="$emit('next')"
      class="py-2 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer text-4xl"
    >
      <ChevronRightIcon class="w-10 h-10" />
    </button>
    <span v-else class="py-2 text-gray-400 text-4xl">→</span>
  </div>
</template>


<style scoped>
</style>
