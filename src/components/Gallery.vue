<!-- PROVAAAAA -->
 <script setup>
import { ref, inject } from 'vue'

const openLightbox = inject('openLightbox')

// modalità: "grid" | "map"
const layoutMode = ref('grid')

// esempio immagini
const images = [
  '/img/1.jpg',
  '/img/2.jpg',
  '/img/3.jpg',
  '/img/4.jpg'
]
</script>

<template>
  <!-- BOTTONI MODALITÀ -->
  <div class="flex gap-4 justify-center mb-8">
    <button
      @click="layoutMode = 'grid'"
      :class="layoutMode === 'grid' ? 'bg-black text-white' : 'bg-gray-200'"
      class="px-4 py-2 rounded"
    >
      Griglia
    </button>

    <button
      @click="layoutMode = 'map'"
      :class="layoutMode === 'map' ? 'bg-black text-white' : 'bg-gray-200'"
      class="px-4 py-2 rounded"
    >
      Mappa
    </button>
  </div>

  <!-- MODALITÀ 1: GRID -->
  <div
    v-if="layoutMode === 'grid'"
    class="grid grid-cols-2 md:grid-cols-3 gap-6"
  >
    <img
      v-for="img in images"
      :key="img"
      :src="img"
      class="cursor-pointer rounded shadow hover:scale-105 transition"
      @click="openLightbox(img)"
    />
  </div>

  <!-- MODALITÀ 2: MAPPA -->
  <div
    v-else
    class="relative w-full h-[80vh] border overflow-hidden"
  >
    <img
      v-for="(img, i) in images"
      :key="img"
      :src="img"
      class="absolute w-48 cursor-pointer shadow-lg"
      :style="{
        top: `${20 + i * 15}%`,
        left: `${10 + i * 20}%`
      }"
      @click="openLightbox(img)"
    />
  </div>
</template>
