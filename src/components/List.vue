<script setup>
import { ref, inject, defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../Firebase'
import { doc, deleteDoc, updateDoc } from 'firebase/firestore'
import DialogBox from './DialogBox.vue'

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
  }
})

const emit = defineEmits(['item-deleted'])

const router = useRouter()
const global = inject('global')

// Stato per DialogBox
const showDialog = ref(false)
const dialogMessage = ref('')
const itemToDelete = ref(null)

const handleItemClick = (item) => {
  if (item.id) {
    router.push(`/project/${item.id}`)
  }
}

const handleDeleteClick = (e, item) => {
  e.stopPropagation() // Previene il click sul box item
  itemToDelete.value = item
  dialogMessage.value = `Sei sicuro di voler eliminare il progetto "${item.title || 'questo progetto'}"?`
  showDialog.value = true
}

const confirmDelete = async () => {
  if (!itemToDelete.value?.id) {
    showDialog.value = false
    return
  }

  try {
    const projectRef = doc(db, 'projects', itemToDelete.value.id)
    await deleteDoc(projectRef)
    
    // Emetti evento per notificare il componente padre
    emit('item-deleted', itemToDelete.value.id)
    
    showDialog.value = false
    itemToDelete.value = null
  } catch (error) {
    console.error('Errore durante la cancellazione del progetto:', error)
    alert('Errore durante la cancellazione del progetto')
    showDialog.value = false
  }
}

const cancelDelete = () => {
  showDialog.value = false
  itemToDelete.value = null
}

const handleBookmarkClick = async (e, item) => {
  e.stopPropagation() // Previene il click sul box item
  
  if (!global?.value?.account?.id || !item.image) {
    return
  }

  try {
    const accountRef = doc(db, 'accounts', global.value.account.id)
    const currentBookmarks = global.value.account.bookmarks || []
    
    // Controlla se l'immagine è già nei bookmarks
    const isBookmarked = currentBookmarks.includes(item.image)
    
    let updatedBookmarks
    if (isBookmarked) {
      // Rimuovi il bookmark
      updatedBookmarks = currentBookmarks.filter(url => url !== item.image)
    } else {
      // Aggiungi il bookmark
      updatedBookmarks = [...currentBookmarks, item.image]
    }
    
    // Aggiorna Firestore
    await updateDoc(accountRef, {
      bookmarks: updatedBookmarks
    })
    
    // Aggiorna l'oggetto globale
    global.value.account.bookmarks = updatedBookmarks
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dei bookmarks:', error)
    alert('Errore durante l\'aggiornamento dei bookmarks')
  }
}

const isBookmarked = (item) => {
  if (!global?.value?.account?.bookmarks || !item.image) {
    return false
  }
  return global.value.account.bookmarks.includes(item.image)
}

const handleAddClick = (e, item) => {
  e.stopPropagation() // Previene il click sul box item
  console.log(item.image)
}

</script>

<template>
  <div 
    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
    <div 
      v-for="item in items" 
      :key="item.id || item.image" 
      @click="handleItemClick(item)"
      class="relative hover:scale-120 hover:shadow-lg hover:rotate-1 hover:z-10 transition-all duration-300 cursor-pointer group"
    >
      <!-- Icone in alto a destra -->
      <div v-if="allowDelete || allowBookmark || allowAdd" class="absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <!-- Icona Plus -->
        <button
          v-if="allowAdd"
          @click="handleAddClick($event, item)"
          class="p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md cursor-pointer"
          title="Aggiungi"
        >
          <!-- Heroicon Plus -->
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke-width="1.5" 
            stroke="currentColor" 
            class="w-5 h-5 text-green-600"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        
        <!-- Icona Bookmark -->
        <button
          v-if="allowBookmark"
          @click="handleBookmarkClick($event, item)"
          class="p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md cursor-pointer"
          :title="isBookmarked(item) ? 'Rimuovi dai bookmark' : 'Aggiungi ai bookmark'"
        >
          <!-- Heroicon Bookmark (solid/filled quando è bookmark, outline quando non lo è) -->
          <svg 
            v-if="isBookmarked(item)"
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            class="w-5 h-5 text-blue-600"
          >
            <path fill-rule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clip-rule="evenodd" />
          </svg>
          <svg 
            v-else
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke-width="1.5" 
            stroke="currentColor" 
            class="w-5 h-5 text-gray-700"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
        </button>
        
        <!-- Icona Trash -->
        <button
          v-if="allowDelete"
          @click="handleDeleteClick($event, item)"
          class="p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md cursor-pointer"
          title="Elimina progetto"
        >
          <!-- Heroicon Trash -->
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke-width="1.5" 
            stroke="currentColor" 
            class="w-5 h-5 text-red-600"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
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
    title="Conferma eliminazione"
    :message="dialogMessage"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>