<script setup>
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { auth } from '../Firebase'
import { 
  applyActionCode, 
  verifyPasswordResetCode, 
  confirmPasswordReset,
  checkActionCode 
} from 'firebase/auth'

const route = useRoute()
const router = useRouter()
const message = ref('')
const error = ref('')
const isLoading = ref(true)

onMounted(async () => {
  try {
    const mode = route.query.mode
    const actionCode = route.query.oobCode
    const continueUrl = route.query.continueUrl

    if (!actionCode) {
      error.value = 'Invalid action code. The link may have expired or already been used.'
      isLoading.value = false
      return
    }

    switch (mode) {
      case 'verifyEmail':
        // Verify email
        try {
          await applyActionCode(auth, actionCode)
          message.value = 'Email verified successfully! You can now close this page.'
          setTimeout(() => {
            router.push('/')
          }, 2000)
        } catch (err) {
          console.error('Email verification error:', err)
          if (err.code === 'auth/invalid-action-code') {
            error.value = 'This verification link has expired or has already been used.'
          } else {
            error.value = err.message || 'Failed to verify email.'
          }
        }
        break

      case 'resetPassword':
        // Password reset - redirect to a password reset page or show form
        try {
          await verifyPasswordResetCode(auth, actionCode)
          message.value = 'Password reset link is valid. Redirecting...'
          // Store the action code for password reset form
          router.push({
            path: '/reset-password',
            query: { oobCode: actionCode }
          })
        } catch (err) {
          console.error('Password reset verification error:', err)
          if (err.code === 'auth/invalid-action-code') {
            error.value = 'This password reset link has expired or has already been used.'
          } else {
            error.value = err.message || 'Failed to verify password reset link.'
          }
        }
        break

      case 'recoverEmail':
        // Email recovery
        try {
          await applyActionCode(auth, actionCode)
          message.value = 'Email recovered successfully!'
          setTimeout(() => {
            router.push('/')
          }, 2000)
        } catch (err) {
          console.error('Email recovery error:', err)
          error.value = err.message || 'Failed to recover email.'
        }
        break

      default:
        error.value = 'Invalid action mode.'
    }
  } catch (err) {
    console.error('Auth action error:', err)
    error.value = err.message || 'An error occurred while processing the action.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <div v-if="isLoading" class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Processing...</p>
      </div>
      
      <div v-else-if="error" class="text-center">
        <div class="text-red-600 text-5xl mb-4">⚠️</div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Error</h2>
        <p class="text-gray-600 mb-6">{{ error }}</p>
        <button
          @click="router.push('/')"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Homepage
        </button>
      </div>
      
      <div v-else-if="message" class="text-center">
        <div class="text-green-600 text-5xl mb-4">✓</div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Success</h2>
        <p class="text-gray-600 mb-6">{{ message }}</p>
        <button
          @click="router.push('/')"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Homepage
        </button>
      </div>
    </div>
  </div>
</template>
