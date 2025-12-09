<script setup>
import { ref, onMounted } from 'vue'
import { auth } from '../Firebase'
import { onAuthStateChanged } from 'firebase/auth'
import ProjectForm from '../components/ProjectForm.vue'

const user = ref(null)

onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
  })
})
</script>

<template>
  <div>
    <h1>Profile</h1>
    <div v-if="user" class="mt-6 flex justify-center">
      <ProjectForm />
    </div>
  </div>
</template>


<style scoped>
</style>