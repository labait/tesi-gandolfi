<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Search from '../components/Search.vue'

const route = useRoute()

// Get query parameter from route if present
const initialQuery = computed(() => route.query.q || '')
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-8">Search</h1>
    <Search :initial-query="initialQuery" />
  </div>
</template>

<style scoped>
</style>