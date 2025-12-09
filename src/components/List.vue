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
    <img 
      v-for="item in items" :src="item.image" :alt="item.alt" 
      class="cursor-pointer grayscale w-full h-full object-cover rounded-lg hover:grayscale-0 hover:scale-120 hover:shadow-lg hover:rotate-1 hover:z-10 transition-all duration-300" />
  </div>
</template>