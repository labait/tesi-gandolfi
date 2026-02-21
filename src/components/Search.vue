<!-- BARRA DI RICERCA -->
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
    },
    allowDelete: {
      type: Boolean,
      default: false
    },
    allowBookmark: {
      type: Boolean,
      default: false
    },
    allowAdd: {
      type: Boolean,
      default: false
    },
    isBookmarkedFn: {
      type: Function,
      default: null
    },
    isAddFn: {
      type: Function,
      default: null
    },
    allowZoom: {
      type: Boolean,
      default: false
    },
    showInHeader: {
      type: Boolean,
      default: false
    },
    hideViewModeToggle: {
      type: Boolean,
      default: false
    }
  })
  
  const emit = defineEmits([
    'item-deleted',
    'item-bookmarked',
    'item-added',
    'item-zoom',
    'search-results'
  ])
  
  const global = inject('global')
  
  const searchQuery = ref('')
  const searchResults = ref([])
  const error = ref(null)
  const hasSearched = ref(false)
  
  // Pagination: page number only (1-based)
  const page = ref(1)
  const hasNextPage = ref(true)

  // Perform search for the given page (passed to API as query param page)
  const performSearch = async (pageNum = 1) => {
    const query = searchQuery.value.trim()

    if (!query) {
      error.value = 'Please enter a search query'
      return
    }

    global.value.loading = 'Searching...'
    error.value = null
    hasSearched.value = true

    try {
      const searchUrl = `/.netlify/functions/serper-search?q=${encodeURIComponent(query)}&page=${pageNum}`

      const response = await fetch(searchUrl, { method: 'GET' })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Error: ${response.status}`)
      }

      const data = await response.json()
      console.log('Search results:', data)

      page.value = pageNum

      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        searchResults.value = data.results
          .filter(item => item.link || item.image?.thumbnailLink)
          .map((item, index) => ({
            id: item.link || `result-${index}`,
            image: item.thumbnailUrl || '',
            alt: item.title || 'Search result image',
            title: item.title || item.displayLink || ''
          }))
      } else {
        searchResults.value = []
        hasNextPage.value = false
      }

      if (props.showInHeader) {
        emit('search-results', searchResults.value)
      }
    } catch (err) {
      console.error('Error during search:', err)
      error.value = err.message || 'Error during search'
      searchResults.value = []
    } finally {
      global.value.loading = null
    }
  }

  const handleSearch = () => {
    page.value = 1
    performSearch(1)
  }

  const goToPreviousPage = () => {
    if (page.value > 1) {
      const prevPage = page.value - 1
      performSearch(prevPage)
    }
  }

  const goToNextPage = () => {
    performSearch(page.value + 1)
  }

  const hasPreviousPage = () => page.value > 1
  
  // Handle events from List component
  const handleItemDeleted = (itemId) => {
    emit('item-deleted', itemId)
  }

  const handleItemBookmarked = (item) => {
    emit('item-bookmarked', item)
  }

  const handleItemAdded = (item) => {
    emit('item-added', item)
  }

  const handleItemZoom = (item) => {
    emit('item-zoom', item)
  }

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
    <div 
      :class="showInHeader 
        ? 'flex gap-2 items-center' 
        : 'flex gap-2 mb-8 mt-8 px-8 md:px-20 lg:px-40 w-full'"
    >
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="showInHeader ? 'Search images...' : 'define your search, ie. helvetica red poster'"
        :class="showInHeader 
          ? 'flex-1 px-3 py-2 text-sm bordergradient rounded-lg focus:ring-1 focus:bordergradient' 
          : 'flex-1 px-4 py-2 bordergradient rounded-lg focus:ring-1 focus:bordergradient'"
        @keyup.enter="handleSearch"
        
      />
      <button
        @click="handleSearch"
        :disabled="global.loading || !searchQuery.trim()"
        :class="showInHeader 
          ? 'btn-header1 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2' 
          : 'btn-header1 disabled:opacity-50 disabled:cursor-not-allowed'"
      >
        <MagnifyingGlassIcon class="w-5 h-5" />
        
      </button>
    </div>

    <!-- Error message (solo se non in header) -->
    <div v-if="error && !showInHeader" class="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <!-- Pagination links (before results) - solo se non in header -->
    <div v-if="!showInHeader && hasSearched && !global.loading && searchResults.length > 0" class="mb-4">
      <ListPagination
        :show="true"
        :has-previous-page="hasPreviousPage()"
        :has-next-page="hasNextPage"
        :current-page="page"
        @previous="goToPreviousPage"
        @next="goToNextPage"
      />
    </div>

    <!-- Results - solo se non in header -->
    <div v-if="!showInHeader && hasSearched && !global.loading && searchResults.length > 0">
      <List 
        :items="searchResults" 
        :allow-delete="allowDelete"
        :allow-bookmark="allowBookmark"
        :allow-add="allowAdd"
        :allow-zoom="allowZoom"
        :hide-view-mode-toggle="hideViewModeToggle"
        :is-bookmarked-fn="isBookmarkedFn"
        :is-add-fn="isAddFn"
        @item-deleted="handleItemDeleted"
        @item-bookmarked="handleItemBookmarked"
        @item-added="handleItemAdded"
        @item-zoom="handleItemZoom"
      />
    </div>

    <!-- No results message - solo se non in header -->
    <div v-else-if="!showInHeader && hasSearched && !global.loading" class="text-center py-8">
      <p class="text-gray-600">No results found. Try a different search query.</p>
    </div>

    <!-- Pagination links (after results) - solo se non in header -->
    <div v-if="!showInHeader && hasSearched && !global.loading && searchResults.length > 0" class="mt-8">
      <ListPagination
        :show="true"
        :has-previous-page="hasPreviousPage()"
        :has-next-page="hasNextPage"
        :current-page="page"
        @previous="goToPreviousPage"
        @next="goToNextPage"
      />
    </div>
  </div>
</template>


<style scoped>
</style>
[rgb(105,192,172)]