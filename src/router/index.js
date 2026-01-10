import { createRouter, createWebHistory } from 'vue-router'
import HomepageView from '../views/HomepageView.vue'
import SearchView from '../views/SearchView.vue'
import ProjectsView from '../views/ProjectsView.vue'
import AuthActionView from '../views/AuthActionView.vue'
import ProjectView from '../views/ProjectView.vue'
import { auth } from '../Firebase'

// Helper function per controllare lo stato di autenticazione
const getCurrentUser = () => {
  // Se auth.currentUser è già disponibile, ritornalo immediatamente
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser)
  }
  // Altrimenti, aspetta che Firebase determini lo stato
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Homepage',
      component: HomepageView,
      beforeEnter: async (to, from, next) => {
        // Se c'è un query parameter 'force', mostra sempre la Homepage (utile per il click sul logo)
        if (to.query.force === 'true') {
          next()
          return
        }
        
        // Controlla se l'utente è loggato
        const user = await getCurrentUser()
        if (user) {
          // Se l'utente è loggato, reindirizza a /projects
          next('/projects')
        } else {
          // Se non è loggato, mostra Homepage
          next()
        }
      }
    },
    {
      path: '/search',
      name: 'Search',
      component: SearchView
    },
    {
      path: '/projects',
      name: 'Projects',
      component: ProjectsView
    },
    {
      path: '/project/:id',
      name: 'Project',
      component: ProjectView
    },
    {
      path: '/auth/action',
      name: 'AuthAction',
      component: AuthActionView
    }
  ]
})

export default router

