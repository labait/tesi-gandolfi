<script setup>
import { ref, onMounted, inject } from 'vue'
import { auth } from '../Firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Search from '../components/Search.vue'
import LightboxGrid from '../components/LightboxGrid.vue'

const user = ref(null)
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

const items = Array(20).fill().map( (i, index) => {
  return {
    "image": `https://picsum.photos/800/600?p=${index}`
  }
})
console.log(items)

</script>

<template>
  <div class="background">
  <Search 
    :auto-search="true" 
    initial-query="helvetica red poster"
    :allow-zoom="true"
    @item-zoom="handleItemZoom"
  />
  </div>
  <LightboxGrid />
</template>


<style scoped>
</style>