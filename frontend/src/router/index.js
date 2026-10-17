import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/books', name: 'BookList', component: () => import('../views/BookList.vue') },
  { path: '/books/:id', name: 'BookDetail', component: () => import('../views/BookDetail.vue') },
  {
    path: '/publish',
    name: 'PublishBook',
    component: () => import('../views/PublishBook.vue'),
    meta: { requiresAuth: true }
  },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue') },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my/books',
    name: 'MyBooks',
    component: () => import('../views/MyBooks.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my/favorites',
    name: 'MyFavorites',
    component: () => import('../views/MyFavorites.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my/orders',
    name: 'MyOrders',
    component: () => import('../views/MyOrders.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my/messages',
    name: 'MyMessages',
    component: () => import('../views/MyMessages.vue'),
    meta: { requiresAuth: true }
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 路由守卫：需要登录的页面未登录时跳转登录页
router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  // 已登录用户访问登录/注册页时跳转首页
  if ((to.name === 'Login' || to.name === 'Register') && token) {
    return { name: 'Home' }
  }
  return true
})

export default router
