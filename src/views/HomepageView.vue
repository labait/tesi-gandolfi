<script setup>
import { ref, onMounted, inject, computed } from 'vue'
import { auth } from '../Firebase'
import { onAuthStateChanged } from 'firebase/auth'
import List from '../components/List.vue'

const user = ref(null)
const global = inject('global')
const openLightbox = inject('openLightbox')

onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
  })
})

const handleItemZoom = (item) => {
  if (item.image && openLightbox) {
    openLightbox(item.image)
  }
}

const handleItemDeleted = (itemId) => {
  console.log('Item deleted:', itemId)
}

const handleItemBookmarked = (item) => {
  console.log('Item bookmarked:', item)
}

const handleItemAdded = (item) => {
  console.log('Item added:', item)
}

// Use search results from global state, or fallback to empty array
const items = computed(() => global.value?.searchResults || [])

</script>

<template>
  <List 
    :items="items"
    :allow-zoom="true"
    @item-zoom="handleItemZoom"
    @item-deleted="handleItemDeleted"
    @item-bookmarked="handleItemBookmarked"
    @item-added="handleItemAdded"
  />
</template>


<style scoped>
</style>