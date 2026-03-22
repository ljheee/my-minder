import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/callback',
    name: 'Callback',
    component: () => import('@/views/Callback.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Editor',
    component: () => import('@/views/Editor.vue'),
    meta: { requiresAuth: true }
  },
  {
    // 捕获所有未匹配路由
    path: '*',
    redirect: '/'
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// 路由守卫：未登录跳转到登录页
router.beforeEach((to, from, next) => {
  const isLoggedIn = store.getters['auth/isLoggedIn']

  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && isLoggedIn) {
    // 已登录用户访问登录页，跳转到主页
    next({ name: 'Editor' })
  } else {
    next()
  }
})

export default router
