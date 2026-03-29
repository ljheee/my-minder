import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store'

Vue.use(VueRouter)

// 修复 NavigationDuplicated / NavigationRedirected 报错
// vue-router 3.x 在守卫重定向时会 reject 原始 Promise，属正常行为，忽略即可
const IGNORED_ERRORS = ['NavigationDuplicated', 'NavigationRedirected', 'NavigationCancelled']
function patchNavigation(fn) {
  return function (location, onComplete, onAbort) {
    if (onComplete || onAbort) return fn.call(this, location, onComplete, onAbort)
    return fn.call(this, location).catch(err => {
      if (err && IGNORED_ERRORS.includes(err.name)) return err
      return Promise.reject(err)
    })
  }
}
VueRouter.prototype.push = patchNavigation(VueRouter.prototype.push)
VueRouter.prototype.replace = patchNavigation(VueRouter.prototype.replace)

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

// 本地调试模式：构建时确定，路由守卫无需关心具体实现
const IS_LOCAL_MODE = process.env.VUE_APP_ENABLE_LOCAL_MODE === 'true'

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 本地调试模式：自动注入模拟登录状态，跳过 GitHub 认证流程
  if (IS_LOCAL_MODE && !store.getters['auth/isLoggedIn']) {
    store.commit('auth/SET_TOKEN', 'local_dev_token')
    store.commit('auth/SET_USER', {
      login: 'local_dev',
      name: '本地开发者',
      avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4'
    })
    if (!store.getters['auth/selectedRepo']) {
      store.commit('auth/SET_SELECTED_REPO', {
        id: 'local',
        name: 'local-mindmaps',
        full_name: 'local_dev/local-mindmaps',
        private: true,
        owner: {
          login: 'local_dev',
          avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4'
        },
        description: '本地调试仓库（数据存储在浏览器 localStorage）',
        default_branch: 'main'
      })
    }
  }

  const isLoggedIn = store.getters['auth/isLoggedIn']
  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && isLoggedIn) {
    next({ name: 'Editor' })
  } else {
    next()
  }
})

export default router
