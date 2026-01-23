<!-- BOX TESTO CANCELLA O CONFERMA-->
<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Confirm'
  },
  message: {
    type: String,
    required: true
  },
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div
    v-if="show" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
    @click.self="handleCancel"
  >
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
      <h3 class="text-xl text-gray-700 font-bold mb-4">{{ title }}</h3>
      <p class="text-gray-700 mb-6">{{ message }}</p>
      <div class="flex justify-end gap-3">
        <button
          @click="handleCancel"
          class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          @click="handleConfirm"
          class="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .bg-black {
    background-color: rgb(61, 61, 58);
  }
  .bg-white {
    background-color: rgb(244, 241, 229);
  }
  .bg-blue-600 {
    background-color: rgb(104, 132, 194);
  }
</style>
