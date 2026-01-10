<script setup>
import { ref, onMounted } from 'vue'
import { auth } from '../Firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Search from '../components/Search.vue'


const user = ref(null)

onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
  })
})

const items = Array(20).fill().map( (i, index) => {
  return {
    "image": `https://picsum.photos/800/600?p=${index}`
  }
})
console.log(items)

</script>

<template>
  <Search :auto-search="true" initial-query="helvetica red poster" />
</template>


<style scoped>
</style>