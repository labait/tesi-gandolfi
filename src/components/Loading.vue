<!-- SCHERMATA DI CARICAMENTO -->
<script setup>
import { ref, inject } from 'vue'
const global = inject('global')
</script>

<template>
  <div class="flex items-center justify-center h-screen fixed top-0 left-0 w-full bg-white z-50">
    <div class="flex items-center justify-center gap-4 flex-col">
     <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div> 
     <p class="text-gray-600 text-2xl font-bold">{{ global.loading }}</p>

    </div>
  </div>
</template>
