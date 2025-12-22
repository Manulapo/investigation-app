import { createRouter, createWebHistory } from 'vue-router'
import ChatList from '../views/ChatList.vue'
import ChatRoom from '../views/ChatRoom.vue'
import Profile from '../views/Profile.vue'
import Help from '../views/Help.vue'

const routes = [
  { path: '/', name: 'list', component: ChatList },
  { path: '/chat/:id', name: 'chat', component: ChatRoom, props: true },
  { path: '/profile/:id', name: 'profile', component: Profile, props: true },
  { path: '/help', name: 'help', component: Help }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
