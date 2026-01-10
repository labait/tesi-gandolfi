import { createRouter, createWebHistory } from 'vue-router'
import Homepage from '../views/Homepage.vue'
import Search from '../views/Search.vue'
import Profile from '../views/Profile.vue'
import AuthAction from '../views/AuthAction.vue'
import Project from '../views/Project.vue'
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Homepage',
      component: Homepage
    },
    {
      path: '/search',
      name: 'Search',
      component: Search
    },
    {
      path: '/profile',
      name: 'Profile',
      component: Profile
    },
    {
      path: '/project/:id',
      name: 'Project',
      component: Project
    },
    {
      path: '/auth/action',
      name: 'AuthAction',
      component: AuthAction
    }
  ]
})

export default router

