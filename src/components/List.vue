<!-- SEZIONE ELEMENTI SALVATI -->
<script setup>
import { ref, inject, defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import DialogBox from './DialogBox.vue'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/vue/24/solid'
import { BookmarkIcon as BookmarkIconOutline } from '@heroicons/vue/24/outline'
import { TrashIcon } from '@heroicons/vue/24/outline'

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

<template> <!-- GRIGLIA RESPONSIVE-->
  <div 
    class="grid background grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-10">
    <div 
      v-for="item in items" 
      :key="item.id || item.image" 
      @click="handleItemClick(item)"
      class="max-h-64 relative hover:scale-110 hover:shadow-lg hover:rotate-1 hover:z-10 transition-all duration-300 cursor-pointer group"
    >
      <!-- Icone in alto a destra -->
      <div class="absolute top-2 right-2 z-20 flex gap-2 ">
        <!-- Container per Delete (visibile solo su hover) -->
        <div v-if="allowDelete" class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ">
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
      
      <div v-if="item.title" class="title absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 rounded-b-lg z-10">{{ item.title }}</div>
      <img :src="item.image" :alt="item.alt" 
        class="grayscale w-full h-full object-cover rounded-lg hover:grayscale-0" 
      />
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