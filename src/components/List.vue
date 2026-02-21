<!-- SEZIONE ELEMENTI SALVATI -->
<script setup>
import { ref, inject, defineProps, defineEmits, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import DialogBox from './DialogBox.vue'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/vue/24/solid'
import { BookmarkIcon as BookmarkIconOutline } from '@heroicons/vue/24/outline'
import { TrashIcon, MapIcon, Squares2X2Icon } from '@heroicons/vue/24/outline'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  allowDelete: {
    type: Boolean,
    default: false
  },
  allowBookmark: {
    type: Boolean,
    default: false
  },
  allowAdd: {
    type: Boolean,
    default: false
  },
  isBookmarkedFn: {
    type: Function,
    default: null
  },
  isAddFn: {
    type: Function,
    default: null
  },
  allowZoom: {
    type: Boolean,
    default: false
  },
  hideViewModeToggle: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'item-deleted',
  'item-added',
  'item-bookmarked',
  'item-zoom'
])

const router = useRouter()
const global = inject('global')

// Modalità visualizzazione
const viewMode = ref('grid') // 'grid' o 'map'

// Stato per drag and drop della mappa
const canvasRef = ref(null)
const viewportRef = ref(null)
const isDragging = ref(false)
const dragMoved = ref(false)
const zoomLevel = ref(1.5)

let dragStartX = 0
let dragStartY = 0
let canvasStartX = 0
let canvasStartY = 0

// Posizioni delle immagini nella mappa (disposte in griglia a alveare)
// Track screen width to adjust layout on small (smartphone) screens
const screenWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
onMounted(() => {
  const onResize = () => { screenWidth.value = window.innerWidth }
  window.addEventListener('resize', onResize)
  // keep reference to removal function
  onUnmounted(() => window.removeEventListener('resize', onResize))
})

const imagePositions = computed(() => {
  const cols = Math.ceil(Math.sqrt(props.items.length))
  const rows = Math.ceil(props.items.length / cols)

  const isMobile = screenWidth.value <= 640 // smartphone breakpoint

  // Spaziatura per layout a alveare
  const baseSpacingX = 100 / (cols + 0.5)
  const baseSpacingY = 100 / (rows + 0.1)
  // Su mobile: mantiene un po' più di spazio orizzontale ma riduce lo spazio verticale
  const spacingMultiplierX = isMobile ? 6 : 1
  const spacingMultiplierY = isMobile ? 0.8 : 1
  // Aumenta lo spazio tra gli elementi (più evidente su desktop)
  const spacingBoost = isMobile ? 1 : 3
  const spacingX = baseSpacingX * spacingMultiplierX * spacingBoost
  const spacingY = baseSpacingY * spacingMultiplierY * spacingBoost

  return props.items.map((item, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)

    // Layout a alveare: le righe dispari sono sfalsate
    const xOffset = row % 2 === 1 ? spacingX * 0.5 : 0
    const x = spacingX * (col + 1) + xOffset
    const y = spacingY * (row + 1)
    const size = isMobile ? 140 : 180 // rimpicciolisci leggermente su smartphone

    return {
      ...item,
      x: x,
      y: y,
      size: size,
      rotation: 0
    }
  })
})

// Funzioni drag
const startDrag = (e) => {
  if (viewMode.value !== 'map') return
  isDragging.value = true
  dragMoved.value = false
  dragStartX = e.clientX
  dragStartY = e.clientY
  
  if (canvasRef.value) {
    const transform = window.getComputedStyle(canvasRef.value).transform
    if (transform && transform !== 'none') {
      const matrix = new DOMMatrix(transform)
      canvasStartX = matrix.m41
      canvasStartY = matrix.m42
    } else {
      canvasStartX = 0
      canvasStartY = 0
    }
  }
}

const onDrag = (e) => {
  if (!isDragging.value || viewMode.value !== 'map') return
  
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  
  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
    dragMoved.value = true
  }
  
  if (canvasRef.value && viewportRef.value) {
    const newX = canvasStartX + dx
    const newY = canvasStartY + dy
    
    // Limita lo spostamento ai bordi dello schermo
    const viewportWidth = viewportRef.value.offsetWidth
    const viewportHeight = viewportRef.value.offsetHeight
    const canvasWidth = viewportWidth * zoomLevel.value
    const canvasHeight = viewportHeight * zoomLevel.value
    
    // Calcola i limiti
    const maxX = 0
    const minX = viewportWidth - canvasWidth
    const maxY = 0
    const minY = viewportHeight - canvasHeight
    
    // Applica i limiti
    const boundedX = Math.max(minX, Math.min(maxX, newX))
    const boundedY = Math.max(minY, Math.min(maxY, newY))
    
    canvasRef.value.style.transform = `translate(${boundedX}px, ${boundedY}px) scale(${zoomLevel.value})`
  }
}

const endDrag = () => {
  isDragging.value = false
  setTimeout(() => {
    dragMoved.value = false
  }, 50)
}

// Funzioni zoom
const handleWheel = (e) => {
  if (viewMode.value !== 'map') return
  e.preventDefault()
  
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.max(0.5, Math.min(3, zoomLevel.value + delta))
  zoomLevel.value = newZoom
  
  if (canvasRef.value && viewportRef.value) {
    const transform = window.getComputedStyle(canvasRef.value).transform
    let translateX = 0
    let translateY = 0
    
    if (transform && transform !== 'none') {
      const matrix = new DOMMatrix(transform)
      translateX = matrix.m41
      translateY = matrix.m42
    }
    
    // Applica limiti
    const viewportWidth = viewportRef.value.offsetWidth
    const viewportHeight = viewportRef.value.offsetHeight
    const canvasWidth = viewportWidth * newZoom
    const canvasHeight = viewportHeight * newZoom
    
    const maxX = 0
    const minX = viewportWidth - canvasWidth
    const maxY = 0
    const minY = viewportHeight - canvasHeight
    
    const boundedX = Math.max(minX, Math.min(maxX, translateX))
    const boundedY = Math.max(minY, Math.min(maxY, translateY))
    
    canvasRef.value.style.transform = `translate(${boundedX}px, ${boundedY}px) scale(${newZoom})`
  }
}

const zoomIn = () => {
  zoomLevel.value = Math.min(3, zoomLevel.value + 0.2)
  updateCanvasTransform()
}

const zoomOut = () => {
  zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.2)
  updateCanvasTransform()
}

const resetView = () => {
  zoomLevel.value = 1
  if (canvasRef.value) {
    canvasRef.value.style.transform = 'translate(0px, 0px) scale(1)'
  }
}

const updateCanvasTransform = () => {
  if (canvasRef.value && viewportRef.value) {
    const transform = window.getComputedStyle(canvasRef.value).transform
    let translateX = 0
    let translateY = 0
    
    if (transform && transform !== 'none') {
      const matrix = new DOMMatrix(transform)
      translateX = matrix.m41
      translateY = matrix.m42
    }
    
    // Applica limiti
    const viewportWidth = viewportRef.value.offsetWidth
    const viewportHeight = viewportRef.value.offsetHeight
    const canvasWidth = viewportWidth * zoomLevel.value
    const canvasHeight = viewportHeight * zoomLevel.value
    
    const maxX = 0
    const minX = viewportWidth - canvasWidth
    const maxY = 0
    const minY = viewportHeight - canvasHeight
    
    const boundedX = Math.max(minX, Math.min(maxX, translateX))
    const boundedY = Math.max(minY, Math.min(maxY, translateY))
    
    canvasRef.value.style.transform = `translate(${boundedX}px, ${boundedY}px) scale(${zoomLevel.value})`
  }
}

// Gestione click su immagine in modalità mappa
const handleMapImageClick = (item) => {
  if (dragMoved.value) return
  handleItemClick(item)
}

// Stato per DialogBox
const showDialog = ref(false)
const dialogMessage = ref('')
const itemToDelete = ref(null)

const handleItemClick = (item) => {
  // Naviga solo se l'ID sembra un ID Firebase (non un URL) sennò non fa nulla
  // Firebase IDs are typically alphanumeric and not URLs
  if (item.id && !item.id.startsWith('http') && !item.id.startsWith('result-')) {
    router.push(`/project/${item.id}`)
  }
  // For search results (which have URLs as ids), do nothing on click
}

const handleDeleteClick = (e, item) => {   // ELIMINAZIONE CON CONFERMA
  e.stopPropagation() // Prevents click on item box
  itemToDelete.value = item
  dialogMessage.value = `Are you sure you want to delete the project "${item.title || 'this project'}"?`
  showDialog.value = true
}

const confirmDelete = () => {
  if (!itemToDelete.value?.id) {
    showDialog.value = false
    return
  }

  // Emit event to parent component to handle deletion
  emit('item-deleted', itemToDelete.value.id)
  
  showDialog.value = false
  itemToDelete.value = null
}

const cancelDelete = () => {
  showDialog.value = false
  itemToDelete.value = null
}

const handleBookmarkClick = (e, item) => { // FUNZIONE BOOKMARK
  e.stopPropagation() // Prevents click on item box
  
  if (!item.image) {
    return
  }

  // Emit event to parent component
  emit('item-bookmarked', item)
}

// Function to check if item is bookmarked (uses parent function if provided)
const isBookmarked = (item) => {
  if (props.isBookmarkedFn && typeof props.isBookmarkedFn === 'function') {
    return props.isBookmarkedFn(item)
  }
  return false
}

// CONTROLLA SE è BOOKMARKED
const isAdded = (item) => {
  if (props.isAddFn && typeof props.isAddFn === 'function') {
    return props.isAddFn(item)
  }
  return false
}

const handleAddClick = (e, item) => {
  e.stopPropagation() // Prevents click on item box
  // Emit event to parent component
  emit('item-added', item)
}

const handleZoomClick = (e, item) => {
  e.stopPropagation() // Prevents click on item box
  
  if (!item.image) {
    return
  }
  
  // Emit event to parent component
  emit('item-zoom', item)
}

</script>

<template>
  <!-- TOGGLE BOTTONI MODALITÀ -->
  <div v-if="!hideViewModeToggle" class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex gap-3 bg-[rgb(245,246,239)]/95 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-2xl border border-gray-200 ">
    <button
      @click="viewMode = 'grid'"
      :class="viewMode === 'grid' 
        ? 'bg-[245,246,239] border border-[rgb(105,192,172)] text-[rgb(105,192,172)]' 
        : 'bg-[245,246,239] border border-gray-700 text-gray-700'"
      class="flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold cursor-pointer"
    >
      <Squares2X2Icon class="w-5 h-5" />
      Grid
    </button>
    
    <button
      @click="viewMode = 'map'"
      :class="viewMode === 'map' 
        ? 'bg-[245,246,239] border border-[rgb(105,192,172)] text-[rgb(105,192,172)]' 
        : 'bg-[245,246,239] border border-gray-700 text-gray-700'"
      class="flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold cursor-pointer"
    >
      <MapIcon class="w-5 h-5" />
      Explore
    </button>
  </div>

  <!-- MODALITÀ GRIGLIA -->
  <div v-if="viewMode === 'grid'" 
    class="grid background grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-5 gap-10 mt-10">
    <div 
      v-for="item in items" 
      :key="item.id || item.image" 
      @click="handleItemClick(item)"
      class="max-h-50 relative hover:scale-105 hover:shadow-lg  hover:z-10 transition-all duration-300 cursor-pointer group"
    >
      <!-- Icone in alto a destra -->
      <div class="absolute top-2 right-2 z-20 flex gap-2">
        <!-- Container per Delete (visibile solo su hover) -->
        <div v-if="allowDelete" class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <!-- Trash Icon -->
          <button
            @click="handleDeleteClick($event, item)"
            class="p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md cursor-pointer"
            title="Delete project"
          >
            <TrashIcon class="w-5 h-5 text-red-600" />
          </button>
        </div>
        
        <!-- Add Icon (sempre visibile se allowAdd è true) -->
        <button
          v-if="allowAdd"
          @click="handleAddClick($event, item)"
          class="p-2 rounded-full transition-all shadow-md cursor-pointer opacity-100"
          :class="isAdded(item) 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-white/90 hover:bg-white'"
          :title="isAdded(item) ? 'Remove from related' : 'Add to related'"
        >
          <PlusIcon 
            :class="isAdded(item) 
              ? 'w-5 h-5 text-white' 
              : 'w-5 h-5 text-green-600'" 
          />
        </button>
        
        <!-- Bookmark Icon (sempre visibile se allowBookmark è true) -->
        <button
          v-if="allowBookmark"
          @click="handleBookmarkClick($event, item)"
          class="p-2 bg-white/90 rounded-full hover:bg-white transition-all shadow-md cursor-pointer opacity-100"
          :title="isBookmarked(item) ? 'Remove from bookmarks' : 'Add to bookmarks'"
        >
          <BookmarkIconSolid v-if="isBookmarked(item)" class="w-5 h-5 text-blue-600" />
          <BookmarkIconOutline v-else class="w-5 h-5 text-gray-700" />
        </button>
        
        <!-- Zoom Icon (sempre visibile se allowZoom è true) -->
        <button
          v-if="allowZoom"
          @click="handleZoomClick($event, item)"
          class="p-2 bg-white/90 rounded-full hover:bg-white transition-all shadow-md cursor-pointer opacity-100"
          title="Zoom image"
        >
          <MagnifyingGlassIcon class="w-5 h-5 text-gray-700" />
        </button>
      </div>
      

      
      <div v-if="item.title" class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{{ item.title }}</div>
      <img :src="item.image" :alt="item.alt" 
        class=" w-full h-full object-cover rounded-lg " 
      />
    </div>
  </div>

  <!-- MODALITÀ MAPPA ESPLORABILE -->
  <div v-else class="fixed inset-0 z-30 overflow-hidden bg-[rgb(245,246,239)]">
    <!-- Controlli Zoom -->
    <div class="absolute mt-90 right-6 z-40 flex flex-col gap-2 bg-[rgb(245,246,239)]/95 backdrop-blur-sm p-2 rounded-xl shadow-lg">
      <button
        @click="zoomIn"
        class="p-3   rounded-lg transition-all shadow-md font-bold text-xl btn-header1"
        title="Zoom In"
      >
        +
      </button>
      <button
        @click="zoomOut"
        class="p-3   rounded-lg transition-all shadow-md font-bold text-xl btn-header1"
        title="Zoom Out"
      >
        −
      </button>
      <button
        @click="resetView"
        class="p-2   rounded-lg transition-all shadow-md text-xs btn-header1"
        title="Reset View"
      >
        ⟲
      </button>
    </div>

    <!-- Viewport -->
    <div
      ref="viewportRef"
      class="w-full h-full cursor-grab active:cursor-grabbing select-none"
      @mousedown="startDrag"
      @mousemove="onDrag"
      @mouseup="endDrag"
      @mouseleave="endDrag"
      @wheel="handleWheel"
    >
      <!-- Canvas con immagini -->
      <div
        ref="canvasRef"
        class="relative w-full h-full"
        style="transform-origin: center center; will-change: transform;"
      >
        <div
          v-for="pos in imagePositions"
          :key="pos.id || pos.image"
          @click="handleMapImageClick(pos)"
          class="absolute cursor-pointer group transition-all duration-300 hover:z-50"
          :style="{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            width: `${pos.size}px`,
            transform: `rotate(${pos.rotation}deg)`,
          }"
        >
          <!-- Immagine container -->
          <div class="relative w-full h-full rounded-xl overflow-hidden transition-all duration-300 hover:scale-105">
            <img 
              :src="pos.image" 
              :alt="pos.alt"
              class="w-full h-full transition-all duration-500"
              draggable="false"
            />
            
            <!-- Overlay con titolo -->
            <div v-if="pos.title" class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p class="text-sm font-semibold truncate">{{ pos.title }}</p>
            </div>

            <!-- Icone overlay (visibili su hover) -->
            <div class="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                v-if="allowBookmark"
                @click.stop="handleBookmarkClick($event, pos)"
                class="p-2 bg-white/95 rounded-full hover:bg-white transition-all shadow-lg cursor-pointer backdrop-blur-sm"
                :title="isBookmarked(pos) ? 'Remove from bookmarks' : 'Add to bookmarks'"
              >
                <BookmarkIconSolid v-if="isBookmarked(pos)" class="w-4 h-4 text-blue-600" />
                <BookmarkIconOutline v-else class="w-4 h-4 text-gray-700" />
              </button>
              
              <button
                v-if="allowAdd"
                @click.stop="handleAddClick($event, pos)"
                class="p-2 rounded-full transition-all shadow-lg cursor-pointer backdrop-blur-sm"
                :class="isAdded(pos) 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-white/95 hover:bg-white'"
                :title="isAdded(pos) ? 'Remove from related' : 'Add to related'"
              >
                <PlusIcon 
                  :class="isAdded(pos) 
                    ? 'w-4 h-4 text-white' 
                    : 'w-4 h-4 text-green-600'" 
                />
              </button>

              <button
                v-if="allowZoom"
                @click.stop="handleZoomClick($event, pos)"
                class="p-2 bg-white/95 rounded-full hover:bg-white transition-all shadow-lg cursor-pointer backdrop-blur-sm"
                title="Zoom image"
              >
                <MagnifyingGlassIcon class="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    
  </div>
  
  <!-- DialogBox per conferma eliminazione -->
  <DialogBox
    :show="showDialog"
    title="Confirm Deletion"
    :message="dialogMessage"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>

<style scoped>

  </style>