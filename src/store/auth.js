/**
 * Vuex Auth 模块
 * 管理 GitHub token、用户信息、选中的仓库
 */

import { getUser } from '@/api'

const STORAGE_KEY_TOKEN = 'github_token'
const STORAGE_KEY_USER = 'github_user'
const STORAGE_KEY_REPO = 'github_selected_repo'

export default {
  namespaced: true,

  state: () => ({
    token: localStorage.getItem(STORAGE_KEY_TOKEN) || null,
    user: (() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_USER)) || null
      } catch {
        return null
      }
    })(),
    // 当前选中的仓库 { owner, repo, full_name, private }
    selectedRepo: (() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_REPO)) || null
      } catch {
        return null
      }
    })(),
    loading: false,
    error: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token && !!state.user,
    hasRepo: (state) => !!state.selectedRepo,
    token: (state) => state.token,
    user: (state) => state.user,
    selectedRepo: (state) => state.selectedRepo,
    // 便捷访问
    owner: (state) => state.selectedRepo?.owner?.login || state.user?.login,
    repoName: (state) => state.selectedRepo?.name
  },

  mutations: {
    SET_TOKEN(state, token) {
      state.token = token
      if (token) {
        localStorage.setItem(STORAGE_KEY_TOKEN, token)
      } else {
        localStorage.removeItem(STORAGE_KEY_TOKEN)
      }
    },

    SET_USER(state, user) {
      state.user = user
      if (user) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user))
      } else {
        localStorage.removeItem(STORAGE_KEY_USER)
      }
    },

    SET_SELECTED_REPO(state, repo) {
      state.selectedRepo = repo
      if (repo) {
        localStorage.setItem(STORAGE_KEY_REPO, JSON.stringify(repo))
      } else {
        localStorage.removeItem(STORAGE_KEY_REPO)
      }
    },

    SET_LOADING(state, loading) {
      state.loading = loading
    },

    SET_ERROR(state, error) {
      state.error = error
    }
  },

  actions: {
    /**
     * 保存 token 并获取用户信息
     */
    async loginWithToken({ commit }, token) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        commit('SET_TOKEN', token)
        const user = await getUser()
        commit('SET_USER', user)
        return user
      } catch (err) {
        commit('SET_TOKEN', null)
        commit('SET_ERROR', '获取用户信息失败，请重新登录')
        throw err
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * 选择仓库
     */
    selectRepo({ commit }, repo) {
      commit('SET_SELECTED_REPO', {
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url
        },
        description: repo.description,
        default_branch: repo.default_branch || 'main'
      })
    },

    /**
     * 退出登录
     */
    logout({ commit }) {
      commit('SET_TOKEN', null)
      commit('SET_USER', null)
      commit('SET_SELECTED_REPO', null)
    }
  }
}
