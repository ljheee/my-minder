/**
 * Vuex Files 模块
 * 管理文件树状态、当前打开的文件
 */

import Vue from 'vue'
import {
  listContents,
  getFileContent,
  putFile,
  deleteFile,
  renameFile,
  createMinderFile,
  createFolder,
  deleteFolder
} from '@/api/github'

export default {
  namespaced: true,

  state: () => ({
    // 文件树：{ [path]: { items: [], loaded: boolean, loading: boolean } }
    tree: {},
    // 当前打开的文件
    currentFile: null, // { path, name, content, sha, dirty }
    // 加载状态
    treeLoading: false,
    fileLoading: false,
    fileSaving: false,
    // 错误信息
    error: null
  }),

  getters: {
    // 获取指定路径的目录内容
    getDir: (state) => (path) => state.tree[path] || { items: [], loaded: false, loading: false },
    currentFile: (state) => state.currentFile,
    isDirty: (state) => state.currentFile?.dirty || false,
    isFileLoading: (state) => state.fileLoading,
    isFileSaving: (state) => state.fileSaving
  },

  mutations: {
    SET_DIR_LOADING(state, { path, loading }) {
      if (!state.tree[path]) {
        Vue.set(state.tree, path, { items: [], loaded: false, loading })
      } else {
        state.tree[path].loading = loading
      }
    },

    SET_DIR_ITEMS(state, { path, items }) {
      Vue.set(state.tree, path, {
        items,
        loaded: true,
        loading: false
      })
    },

    SET_CURRENT_FILE(state, file) {
      state.currentFile = file
    },

    SET_FILE_DIRTY(state, dirty) {
      if (state.currentFile) {
        state.currentFile.dirty = dirty
      }
    },

    UPDATE_FILE_CONTENT(state, content) {
      if (state.currentFile) {
        state.currentFile.content = content
        state.currentFile.dirty = true
      }
    },

    SET_FILE_LOADING(state, loading) {
      state.fileLoading = loading
    },

    SET_FILE_SAVING(state, saving) {
      state.fileSaving = saving
    },

    SET_ERROR(state, error) {
      state.error = error
    },

    // 从树中移除某个路径的缓存（用于刷新）
    INVALIDATE_DIR(state, path) {
      if (state.tree[path]) {
        state.tree[path].loaded = false
      }
    },

    // 清空所有文件树缓存（切换仓库时使用）
    CLEAR_TREE(state) {
      state.tree = {}
      state.currentFile = null
    }
  },

  actions: {
    /**
     * 加载目录内容
     */
    async loadDir({ commit, rootGetters }, path = '') {
      const owner = rootGetters['auth/owner']
      const repo = rootGetters['auth/repoName']
      if (!owner || !repo) return

      commit('SET_DIR_LOADING', { path, loading: true })
      try {
        const items = await listContents(owner, repo, path)
        commit('SET_DIR_ITEMS', { path, items })
        return items
      } catch (err) {
        commit('SET_DIR_LOADING', { path, loading: false })
        commit('SET_ERROR', `加载目录失败: ${err.message}`)
        throw err
      }
    },

    /**
     * 打开文件（读取内容）
     */
    async openFile({ commit, rootGetters }, { path }) {
      const owner = rootGetters['auth/owner']
      const repo = rootGetters['auth/repoName']

      commit('SET_FILE_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const file = await getFileContent(owner, repo, path)
        commit('SET_CURRENT_FILE', {
          path: file.path,
          name: file.name,
          content: file.content,
          sha: file.sha,
          dirty: false
        })
        return file
      } catch (err) {
        commit('SET_ERROR', `打开文件失败: ${err.message}`)
        throw err
      } finally {
        commit('SET_FILE_LOADING', false)
      }
    },

    /**
     * 保存当前文件
     */
    async saveCurrentFile({ commit, state, rootGetters }) {
      if (!state.currentFile) return
      const owner = rootGetters['auth/owner']
      const repo = rootGetters['auth/repoName']

      commit('SET_FILE_SAVING', true)
      commit('SET_ERROR', null)
      try {
        const result = await putFile(
          owner, repo,
          state.currentFile.path,
          state.currentFile.content,
          `update: ${state.currentFile.name}`,
          state.currentFile.sha
        )
        // 更新 sha（下次保存需要最新的 sha）
        commit('SET_CURRENT_FILE', {
          ...state.currentFile,
          sha: result.sha,
          dirty: false
        })
      } catch (err) {
        commit('SET_ERROR', `保存失败: ${err.message}`)
        throw err
      } finally {
        commit('SET_FILE_SAVING', false)
      }
    },

    /**
     * 更新编辑器内容（标记为 dirty）
     */
    updateContent({ commit }, content) {
      commit('UPDATE_FILE_CONTENT', content)
    },

    /**
     * 新建脑图文件
     */
    async createFile({ commit, dispatch, rootGetters }, { parentPath, name }) {
      const owner = rootGetters['auth/owner']
      const repo = rootGetters['auth/repoName']

      // 确保文件名以 .km 结尾
      const fileName = name.endsWith('.km') ? name : `${name}.km`
      const filePath = parentPath ? `${parentPath}/${fileName}` : fileName

      try {
        await createMinderFile(owner, repo, filePath)
        // 刷新父目录
        commit('INVALIDATE_DIR', parentPath || '')
        await dispatch('loadDir', parentPath || '')
        return filePath
      } catch (err) {
        commit('SET_ERROR', `创建文件失败: ${err.message}`)
        throw err
      }
    },

    /**
     * 新建文件夹
     */
    async createDir({ commit, dispatch, rootGetters }, { parentPath, name }) {
      const owner = rootGetters['auth/owner']
      const repo = rootGetters['auth/repoName']

      const folderPath = parentPath ? `${parentPath}/${name}` : name

      try {
        await createFolder(owner, repo, folderPath)
        // 刷新父目录
        commit('INVALIDATE_DIR', parentPath || '')
        await dispatch('loadDir', parentPath || '')
        return folderPath
      } catch (err) {
        commit('SET_ERROR', `创建文件夹失败: ${err.message}`)
        throw err
      }
    },

    /**
     * 删除文件
     */
    async deleteFileItem({ commit, dispatch, rootGetters }, { path, sha, parentPath }) {
      const owner = rootGetters['auth/owner']
      const repo = rootGetters['auth/repoName']

      try {
        await deleteFile(owner, repo, path, sha, `delete: ${path}`)
        // 刷新父目录
        commit('INVALIDATE_DIR', parentPath || '')
        await dispatch('loadDir', parentPath || '')
      } catch (err) {
        commit('SET_ERROR', `删除失败: ${err.message}`)
        throw err
      }
    },

    /**
     * 删除文件夹（递归）
     */
    async deleteDirItem({ commit, dispatch, rootGetters }, { path, parentPath }) {
      const owner = rootGetters['auth/owner']
      const repo = rootGetters['auth/repoName']

      try {
        await deleteFolder(owner, repo, path)
        // 刷新父目录
        commit('INVALIDATE_DIR', parentPath || '')
        await dispatch('loadDir', parentPath || '')
      } catch (err) {
        commit('SET_ERROR', `删除文件夹失败: ${err.message}`)
        throw err
      }
    },

    /**
     * 重命名文件
     */
    async renameFileItem({ commit, dispatch, state, rootGetters }, { path, sha, newName, parentPath }) {
      const owner = rootGetters['auth/owner']
      const repo = rootGetters['auth/repoName']

      // 构建新路径
      const newFileName = newName.endsWith('.km') ? newName : `${newName}.km`
      const newPath = parentPath ? `${parentPath}/${newFileName}` : newFileName

      try {
        // 先读取文件内容
        const file = await getFileContent(owner, repo, path)
        await renameFile(owner, repo, path, newPath, sha, file.content)

        // 如果重命名的是当前打开的文件，更新状态
        if (state.currentFile && state.currentFile.path === path) {
          commit('SET_CURRENT_FILE', {
            ...state.currentFile,
            path: newPath,
            name: newFileName
          })
        }

        // 刷新父目录
        commit('INVALIDATE_DIR', parentPath || '')
        await dispatch('loadDir', parentPath || '')
      } catch (err) {
        commit('SET_ERROR', `重命名失败: ${err.message}`)
        throw err
      }
    },

    /**
     * 移动文件到新目录
     */
    async moveFileItem({ commit, dispatch, state, rootGetters }, { path, sha, targetDir, fileName }) {
      const owner = rootGetters['auth/owner']
      const repo = rootGetters['auth/repoName']

      const newPath = targetDir ? `${targetDir}/${fileName}` : fileName
      const oldParentPath = path.split('/').slice(0, -1).join('/')

      try {
        const file = await getFileContent(owner, repo, path)
        await renameFile(owner, repo, path, newPath, sha, file.content)

        // 如果移动的是当前打开的文件，更新状态
        if (state.currentFile && state.currentFile.path === path) {
          commit('SET_CURRENT_FILE', {
            ...state.currentFile,
            path: newPath
          })
        }

        // 刷新相关目录
        commit('INVALIDATE_DIR', oldParentPath || '')
        commit('INVALIDATE_DIR', targetDir || '')
        await dispatch('loadDir', oldParentPath || '')
        await dispatch('loadDir', targetDir || '')
      } catch (err) {
        commit('SET_ERROR', `移动失败: ${err.message}`)
        throw err
      }
    },

    /**
     * 切换仓库时清空文件树
     */
    clearTree({ commit }) {
      commit('CLEAR_TREE')
    }
  }
}

