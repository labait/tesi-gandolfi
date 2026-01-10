
<script setup>
  import { ref, computed, onMounted, inject, defineProps } from 'vue'
  import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
  import List from './List.vue'
  import ListPagination from './ListPagination.vue'
  
  const props = defineProps({
    initialQuery: {
      type: String,
      default: ''
    },
    autoSearch: {
      type: Boolean,
      default: false
    }
  })
  
  const global = inject('global')
  
  const searchQuery = ref('')
  const searchResults = ref([])
  const error = ref(null)
  const hasSearched = ref(false)
  
  // Pagination state
  const currentStartIndex = ref(1) // 1-based index from Google API
  const totalResults = ref(0)
  const resultCount = ref(0)
  
  // Perform search with optional start parameter
  const performSearch = async (startIndex = 1) => {
    const query = searchQuery.value.trim()
    
    if (!query) {
      error.value = 'Please enter a search query'
      return
    }
  
    // Set global loading state
    global.value.loading = 'Searching...'
    error.value = null
    hasSearched.value = true
  
    try {
      // Build URL with query and optional start parameter
      let searchUrl = `/.netlify/functions/google-search?q=${encodeURIComponent(query)}`
      if (startIndex > 1) {
        searchUrl += `&start=${startIndex}`
      }
  
      // Call Netlify function for Google Search
      const response = await fetch(searchUrl, {
        method: 'GET'
      })
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Error: ${response.status}`)
      }
  
      const data = await response.json()
      console.log('Search results:', data)
  
      // Update pagination info
      if (data.searchInformation) {
        currentStartIndex.value = data.searchInformation.currentStartIndex || 1
        totalResults.value = data.searchInformation.totalResults || 0
        resultCount.value = data.searchInformation.resultCount || 0
      }
  
      // Transform Google Search results to List component format
      // Google Custom Search API returns items with image.thumbnailLink
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        searchResults.value = data.results
          .filter(item => item.link || item.image?.thumbnailLink) // Filter out items without image or link
          .map((item, index) => ({
            id: item.link || `result-${index}`,
            image: item.link || item.image?.thumbnailLink || '',
            alt: item.title || 'Search result image',
            title: item.title || item.displayLink || ''
          }))
      } else {
        searchResults.value = []
      }
  
    } catch (err) {
      console.error('Error during search:', err)
      error.value = err.message || 'Error during search'
      searchResults.value = []
    } finally {
      // Clear global loading state when API response is received
      global.value.loading = null
    }
  }
  
  // Handle search (always starts from first page)
  const handleSearch = () => {
    currentStartIndex.value = 1 // Reset to first page
    performSearch(1)
  }
  
  // Navigate to first page
  const goToFirstPage = () => {
    currentStartIndex.value = 1
    performSearch(1)
  }
  
  // Navigate to previous page
  const goToPreviousPage = () => {
    if (currentStartIndex.value > 1) {
      const prevStartIndex = Math.max(1, currentStartIndex.value - 10)
      currentStartIndex.value = prevStartIndex
      performSearch(prevStartIndex)
    }
  }
  
  // Navigate to next page
  const goToNextPage = () => {
    const nextStartIndex = currentStartIndex.value + resultCount.value
    if (nextStartIndex <= totalResults.value) {
      currentStartIndex.value = nextStartIndex
      performSearch(nextStartIndex)
    }
  }
  
  // Check if there's a previous page
  const hasPreviousPage = () => {
    return currentStartIndex.value > 1
  }
  
  // Check if there's a next page
  const hasNextPage = () => {
    return currentStartIndex.value + resultCount.value <= totalResults.value
  }
  
  // Computed property for current page number
  const currentPage = computed(() => {
    return Math.ceil(currentStartIndex.value / 10)
  })
  
  // Initialize search query from prop and perform search if provided
  onMounted(() => {
    if (props.autoSearch) handleSearch();
    // If debug mode is enabled, prefill with example query
    if (global.value.debug) {
      searchQuery.value = 'helvetica red poster'
    } else if (props.initialQuery && props.initialQuery.trim()) {
      searchQuery.value = props.initialQuery
      handleSearch()
    }
  })
  </script>

<template>
  <div>
    <!-- Search input and button -->
    <div class="flex gap-2 mb-8">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="define your search, ie. helvetica red poster"
        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        @keyup.enter="handleSearch"
      />
      <button
        @click="handleSearch"
        :disabled="global.loading || !searchQuery.trim()"
        class="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
      >
        <MagnifyingGlassIcon class="w-5 h-5" />
        <span>Search</span>
      </button>
    </div>

    <!-- Error message -->
    <div v-if="error" class="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <!-- Pagination links (before results) -->
    <div v-if="hasSearched && !global.loading && searchResults.length > 0" class="mb-4">
      <ListPagination
        :show="true"
        :has-previous-page="hasPreviousPage()"
        :has-next-page="hasNextPage()"
        :show-first-page="currentStartIndex > 1"
        :current-page="currentPage"
        :total-results="totalResults"
        @previous="goToPreviousPage"
        @next="goToNextPage"
        @first="goToFirstPage"
      />
    </div>

    <!-- Results -->
    <div v-if="hasSearched && !global.loading && searchResults.length > 0">
      <List :items="searchResults" />
    </div>

    <!-- No results message -->
    <div v-else-if="hasSearched && !global.loading" class="text-center py-8">
      <p class="text-gray-600">No results found. Try a different search query.</p>
    </div>

    <!-- Pagination links (after results) -->
    <div v-if="hasSearched && !global.loading && searchResults.length > 0" class="mt-8">
      <ListPagination
        :show="true"
        :has-previous-page="hasPreviousPage()"
        :has-next-page="hasNextPage()"
        :show-first-page="currentStartIndex > 1"
        :current-page="currentPage"
        :total-results="totalResults"
        @previous="goToPreviousPage"
        @next="goToNextPage"
        @first="goToFirstPage"
      />
    </div>
  </div>
</template>


<style scoped>
</style>
