<!-- PROVAAAAAA-->
<script setup>
import { inject } from 'vue'

const global = inject('global')

// immagini di esempio (poi le collegherai ai progetti veri)
const images = [
  { id: 1, thumb: '/img/1.jpg', url: '/img/1.jpg', x: 100, y: 150 },
  { id: 2, thumb: '/img/2.jpg', url: '/img/2.jpg', x: 400, y: 300 },
  { id: 3, thumb: '/img/3.jpg', url: '/img/3.jpg', x: 700, y: 200 }
]

const openLightbox = (url) => {
  global.lightbox.show = true
  global.lightbox.imageUrl = url
}
</script>

<template>
  <!-- PROPOSTA 1: GRID CLASSICA -->
  <div
    v-if="global.lightbox.layout === 'grid'"
    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
  >
    <div
      v-for="img in images"
      :key="img.id"
      class="cursor-pointer"
      @click="openLightbox(img.url)"
    >
      <img
        :src="img.thumb"
        class="rounded-lg shadow-md hover:scale-105 transition"
      />
    </div>
  </div>

  <!-- PROPOSTA 2: MAP / SPAZIALE -->
  <div
    v-else
    class="relative w-full h-[80vh] bg-gray-100 overflow-hidden"
  >
    <div
      v-for="img in images"
      :key="img.id"
      class="absolute cursor-pointer"
      :style="{ top: img.y + 'px', left: img.x + 'px' }"
      @click="openLightbox(img.url)"
    >
      <img
        :src="img.thumb"
        class="w-40 rounded-lg shadow-lg hover:scale-105 transition"
      />
    </div>
  </div>
</template>
