<script setup>
import { ref, inject, defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../Firebase'
import { doc, deleteDoc, updateDoc } from 'firebase/firestore'
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
          <PlusIcon class="w-5 h-5 text-green-600" />
        </button>
        
        <!-- Icona Bookmark -->
        <button
          v-if="allowBookmark"
          @click="handleBookmarkClick($event, item)"
          class="p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md cursor-pointer"
          :title="isBookmarked(item) ? 'Rimuovi dai bookmark' : 'Aggiungi ai bookmark'"
        >
          <BookmarkIconSolid v-if="isBookmarked(item)" class="w-5 h-5 text-blue-600" />
          <BookmarkIconOutline v-else class="w-5 h-5 text-gray-700" />
        </button>
        
        <!-- Icona Trash -->
        <button
          v-if="allowDelete"
          @click="handleDeleteClick($event, item)"
          class="p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md cursor-pointer"
          title="Elimina progetto"
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
  
  <!-- DialogBox per conferma eliminazione -->
  <DialogBox
    :show="showDialog"
    title="Conferma eliminazione"
    :message="dialogMessage"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>