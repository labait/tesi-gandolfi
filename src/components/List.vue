<script setup>
import { ref, inject, defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import DialogBox from './DialogBox.vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
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
  }
})

const emit = defineEmits([
  'item-deleted',
  'item-added',
  'item-bookmarked'
])

const router = useRouter()
const global = inject('global')

// Stato per DialogBox
const showDialog = ref(false)
const dialogMessage = ref('')
const itemToDelete = ref(null)

const handleItemClick = (item) => {
  // Only navigate if id looks like a Firebase document ID (not a URL)
  // Firebase IDs are typically alphanumeric and not URLs
  if (item.id && !item.id.startsWith('http') && !item.id.startsWith('result-')) {
    router.push(`/project/${item.id}`)
  }
  // For search results (which have URLs as ids), do nothing on click
}

const handleDeleteClick = (e, item) => {
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

const handleBookmarkClick = (e, item) => {
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

const handleAddClick = (e, item) => {
  e.stopPropagation() // Prevents click on item box
  // Emit event to parent component
  emit('item-added', item)
}

</script>

<template>
  <div 
    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
    <div 
      v-for="item in items" 
      :key="item.id || item.image" 
      @click="handleItemClick(item)"
      class="max-h-64 relative hover:scale-120 hover:shadow-lg hover:rotate-1 hover:z-10 transition-all duration-300 cursor-pointer group"
    >
      <!-- Icone in alto a destra -->
      <div v-if="allowDelete || allowBookmark || allowAdd" class="absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <!-- Plus Icon -->
        <button
          v-if="allowAdd"
          @click="handleAddClick($event, item)"
          class="p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md cursor-pointer"
          title="Add"
        >
          <PlusIcon class="w-5 h-5 text-green-600" />
        </button>
        
        <!-- Bookmark Icon -->
        <button
          v-if="allowBookmark"
          @click="handleBookmarkClick($event, item)"
          class="p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md cursor-pointer"
          :title="isBookmarked(item) ? 'Remove from bookmarks' : 'Add to bookmarks'"
        >
          <BookmarkIconSolid v-if="isBookmarked(item)" class="w-5 h-5 text-blue-600" />
          <BookmarkIconOutline v-else class="w-5 h-5 text-gray-700" />
        </button>
        
        <!-- Trash Icon -->
        <button
          v-if="allowDelete"
          @click="handleDeleteClick($event, item)"
          class="p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md cursor-pointer"
          title="Delete project"
        >
          <TrashIcon class="w-5 h-5 text-red-600" />
        </button>
      </div>
      
      <div v-if="item.title" class="title absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 rounded-b-lg z-10">{{ item.title }}</div>
      <img :src="item.image" :alt="item.alt" 
        class="grayscale w-full h-full object-cover rounded-lg hover:grayscale-0" 
      />
    </div>
  </div>
  
  <!-- DialogBox for delete confirmation -->
  <DialogBox
    :show="showDialog"
    title="Confirm Deletion"
    :message="dialogMessage"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>