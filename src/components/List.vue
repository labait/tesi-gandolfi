<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

</script>

<template>

  <div 
    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
    <div v-for="item in items" :key="item.image" class=" hover:scale-120 hover:shadow-lg hover:rotate-1 hover:z-10 transition-all duration-300">
      <div v-if="item.title" class="title absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 rounded-b-lg z-10">{{ item.title }}</div>
      <img :src="item.image" :alt="item.alt" 
        class="cursor-pointer grayscale w-full h-full object-cover rounded-lg hover:grayscale-0" 
      />
    </div>
  </div>
</template>