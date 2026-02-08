<!---PROVAAAAAAA GRIGLIE-->
<script setup>
import { ref, onMounted } from 'vue'

/* refs DOM */
const canvasRef = ref(null)
const viewportRef = ref(null)

/* state */
const images = ref([])
const zoomLevel = ref(1)
const dragging = ref(false)
const moved = ref(false)

let startX = 0
let startY = 0
let initialLeft = 0
let initialTop = 0

/* crea immagini */
const items = Array(20).fill().map( (i, index) => {
  return {
    "image": `https://picsum.photos/800/600?p=${index}`
  }
})
console.log(items)

/* DRAG */
const startDrag = (e) => {
  dragging.value = true
  moved.value = false
  startX = e.clientX
  startY = e.clientY
  initialLeft = canvasRef.value.offsetLeft
  initialTop = canvasRef.value.offsetTop
}

const onDrag = (e) => {
  if (!dragging.value) return

  const dx = e.clientX - startX
  const dy = e.clientY - startY

  if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved.value = true

  canvasRef.value.style.left = `${initialLeft + dx}px`
  canvasRef.value.style.top = `${initialTop + dy}px`
}

const endDrag = () => {
  dragging.value = false
  setTimeout(() => (moved.value = false), 10)
}

/* ZOOM */
const zoomIn = () => {
  if (zoomLevel.value < 2.5) zoomLevel.value += 0.1
}
const zoomOut = () => {
  if (zoomLevel.value > 0.4) zoomLevel.value -= 0.1
}

/* LIGHTBOX */
const selectedImage = ref(null)
const openLightbox = (src) => {
  if (moved.value) return
  selectedImage.value = src
}
const closeLightbox = () => {
  selectedImage.value = null
}
</script>

<template>
  <div
    ref="viewportRef"
    class="viewport"
    @mousedown="startDrag"
    @mousemove="onDrag"
    @mouseup="endDrag"
  >
    <div
      ref="canvasRef"
      class="canvas"
      :style="{ transform: `scale(${zoomLevel})` }"
    >
      <div
        v-for="img in images"
        :key="img"
        class="image-box"
        @click="openLightbox(img)"
      >
        <img :src="img" class="gallery-image" />
      </div>
    </div>
  </div>

  <!-- CONTROLLI -->
  <div class="controls btn-header1">
    <button @click="zoomIn">+</button>
    <button @click="zoomOut">−</button>
  </div>

  <!-- LIGHTBOX -->
  <div
    v-if="selectedImage"
    class="overlay"
    @click.self="closeLightbox"
  >
    <img :src="selectedImage" />
  </div>
</template>
