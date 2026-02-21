<!-- SCHERMATA DI CARICAMENTO -->
<script setup>
import { ref, inject } from 'vue'
const global = inject('global')
</script>

<template>
  <div class="background flex items-center justify-center h-screen fixed top-0 left-0 w-full z-50">
    <div class="flex items-center justify-center gap-4 flex-col">
    <video 
          src="/animazione_riduzione_def.mp4" 
          alt="Prisma Logo" 
          class="h-20 md:h-32 lg:h-80 w-auto border-1 border rounded-lg"
          autoplay
          loop
          muted
        />
    </div>
  </div>
</template>
<style scoped>
.border {
 border: rgb(245,246,239)
}
</style>
