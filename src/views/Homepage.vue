<script setup>
import List from '../components/List.vue'

const items = Array(20).fill().map( (i, index) => {
  return {
    "image": `https://picsum.photos/800/600?p=${index}`
  }
})
console.log(items)

</script>

<template>
  <div>
    <List :items="items" />
  </div>
</template>


<style scoped>
</style>