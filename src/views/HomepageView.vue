<script setup>
import { ref, onMounted, inject } from 'vue'
import { auth } from '../Firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Search from '../components/Search.vue'


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
  <!-- Teleport per mettere Search nell'header -->
  <Teleport to="header .flex-1">
    <Search 
      :auto-search="true" 
      :initial-query="project.analysis.search_text"
      :allow-bookmark="true"
      :allow-add="true"
      :allow-zoom="true"
    />
  </Teleport>

  <div class="container mx-auto">
    <!-- resto del contenuto -->
  </div>
</template>


<style scoped>
</style>