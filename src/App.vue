<script setup>
import { ref, provide, onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import Nav from './components/Nav.vue'
import { auth, db } from './Firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const router = useRouter()

// Oggetto globale che contiene tutti gli stati condivisi
const global = ref({
  account: null,
  project: null
})

// Funzione helper per creare o ottenere l'account dell'utente
const ensureAccount = async (uid) => {
  if (!uid) {
    global.value.account = null
    return null
  }

  try {
    const accountRef = doc(db, 'accounts', uid)
    const accountSnap = await getDoc(accountRef)

    if (accountSnap.exists()) {
      // L'account esiste già, caricalo
      global.value.account = {
        id: accountSnap.id,
        ...accountSnap.data()
      }
    } else {
      // L'account non esiste, crealo
      const newAccount = {
        uid: uid,
        bookmarks: [],
        roles: []
      }
      
      await setDoc(accountRef, newAccount)
      
      // Carica l'account appena creato
      global.value.account = {
        id: accountRef.id,
        ...newAccount
      }
    }

    return global.value.account
  } catch (error) {
    console.error('Errore durante il caricamento/creazione dell\'account:', error)
    global.value.account = null
    return null
  }
}

// Gestisci lo stato di autenticazione e carica l'account
onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Utente loggato, assicurati che esista l'account e caricalo
      await ensureAccount(user.uid)
    } else {
      // Utente non loggato, resetta l'account
      global.value.account = null
    }
  })
})

// Esponi l'oggetto global tramite provide
provide('global', global)

const goToHomepage = () => {
  // Naviga sempre alla Homepage, bypassando il guard che reindirizza a /projects
  router.push({ name: 'Homepage', query: { force: 'true' } })
}
</script>

<template>
  <div class="min-h-screen">
    <main class="container mx-auto">
      <h1 
        @click="goToHomepage"
        class="text-4xl font-bold text-[8vw] text-center mt-10 cursor-pointer hover:opacity-80 transition-opacity"
      >
        nofomo
      </h1>
      <Nav />
      <pre class="mb-8 container mx-auto overflow-x-auto">{{ global }}</pre>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>

</style>
