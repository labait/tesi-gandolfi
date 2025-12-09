<script setup>
import { RouterView, RouterLink } from 'vue-router'
import Nav from './components/Nav.vue'
</script>

<template>
  <div class="min-h-screen">
    <main class="container mx-auto">
      <RouterLink to="/" class="block">
        <h1 class="text-4xl font-bold text-[8vw] text-center mt-10 cursor-pointer hover:opacity-80 transition-opacity">nofomo</h1>
      </RouterLink>
      <Nav />
      <RouterView />
    </main>
  </div>
</template>

<style scoped>

</style>
