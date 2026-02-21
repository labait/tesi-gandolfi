import { createRouter, createWebHistory } from 'vue-router'
import HomepageView from '../views/HomepageView.vue'
import SearchView from '../views/SearchView.vue'
import ProjectsView from '../views/ProjectsView.vue'
import AuthActionView from '../views/AuthActionView.vue'
import ProjectView from '../views/ProjectView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Homepage',
      component: HomepageView,
      beforeEnter: async (_to, _from, next) => {
        // Mostra sempre la Homepage (utenti loggati e non)
        next()
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

