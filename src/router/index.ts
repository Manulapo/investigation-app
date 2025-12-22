import { createRouter, createWebHistory } from 'vue-router'
import ChatList from '../views/ChatList.vue'
import ChatRoom from '../views/ChatRoom.vue'
import Profile from '../views/Profile.vue'

const routes = [
  { path: '/', name: 'list', component: ChatList },
  { path: '/chat/:id', name: 'chat', component: ChatRoom, props: true },
  { path: '/profile/:id', name: 'profile', component: Profile, props: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
