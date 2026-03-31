<template>
  <div class="file-tree">
    <!-- 仓库选择器 -->
    <div class="repo-header">
      <div class="repo-info" @click="showRepoSelector = true">
        <svg class="repo-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h12v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/>
        </svg>
        <span class="repo-name">{{ selectedRepo ? selectedRepo.name : '选择仓库' }}</span>
        <svg class="chevron-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </div>
      <!-- 根目录操作按钮 -->
      <div v-if="selectedRepo" class="root-actions">
        <!-- 新建下拉菜单 -->
        <div class="new-dropdown" v-click-outside="closeNewMenu">
          <button class="icon-btn" title="新建" @click="toggleNewMenu">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
          </button>
          <div v-if="showNewMenu" class="new-dropdown-menu">
            <div class="dropdown-item" @click="handleNewFileFromMenu">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
              新建脑图
            </div>
            <div class="dropdown-item" @click="handleNewFolderFromMenu">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10zm-8-1h2v-3h3v-2h-3V9h-2v3H9v2h3z"/></svg>
              新建文件夹
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" @click="handleImportXmind">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
              导入 xmind
            </div>
          </div>
        </div>
        <button class="icon-btn" title="新建文件夹" @click="handleNewFolder('')">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10zm-8-1h2v-3h3v-2h-3V9h-2v3H9v2h3z"/></svg>
        </button>
        <button class="icon-btn" title="刷新" @click="refreshDir('')">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
        </button>
      </div>
      <!-- 隐藏的 xmind 文件选择器 -->
      <input ref="xmindFileInput" type="file" accept=".xmind" style="display:none" @change="onXmindFileSelected" />
    </div>

    <!-- 文件树内容 -->
    <div v-if="selectedRepo" class="tree-content">
      <div v-if="rootLoading" class="loading-state">
        <div class="mini-spinner"></div>
        <span>加载中...</span>
      </div>
      <div v-else-if="rootItems.length === 0" class="empty-state">
        <p>仓库为空</p>
        <button class="text-btn" @click="handleNewFile('')">新建第一个脑图</button>
      </div>
      <tree-node
        v-for="item in rootItems"
        :key="item.path"
        :item="item"
        :current-file-path="currentFilePath"
        :depth="0"
        @open-file="$emit('open-file', $event)"
        @new-file="handleNewFile"
        @new-folder="handleNewFolder"
        @rename="handleRename"
        @delete="handleDelete"
        @move="handleMove"
      />
    </div>

    <div v-else class="no-repo-state">
      <p>请先选择一个仓库</p>
      <button class="select-repo-btn" @click="showRepoSelector = true">选择仓库</button>
    </div>

    <!-- 仓库选择弹窗 -->
    <el-dialog
      title="选择仓库"
      :visible.sync="showRepoSelector"
      width="480px"
      :append-to-body="true"
      custom-class="repo-dialog"
    >
      <div class="repo-selector">
        <div class="repo-search">
          <el-input
            v-model="repoSearch"
            placeholder="搜索仓库..."
            prefix-icon="el-icon-search"
            size="small"
            clearable
          />
        </div>

        <div v-if="reposLoading" class="repos-loading">
          <div class="mini-spinner"></div>
          <span>加载仓库列表...</span>
        </div>

        <div v-else class="repos-list">
          <div
            v-for="repo in filteredRepos"
            :key="repo.id"
            class="repo-item"
            :class="{ active: selectedRepo && selectedRepo.id === repo.id }"
            @click="handleSelectRepo(repo)"
          >
            <div class="repo-item-info">
              <span class="repo-item-name">{{ repo.name }}</span>
              <span v-if="repo.private" class="repo-badge private">私有</span>
              <span v-else class="repo-badge public">公开</span>
            </div>
            <p v-if="repo.description" class="repo-item-desc">{{ repo.description }}</p>
          </div>
          <div v-if="filteredRepos.length === 0" class="repos-empty">
            没有找到匹配的仓库
          </div>
        </div>

        <div class="repo-create">
          <el-divider>或者</el-divider>
          <el-input
            v-model="newRepoName"
            placeholder="新建仓库名称（如 my-mindmaps）"
            size="small"
          >
            <el-button
              slot="append"
              :loading="creatingRepo"
              @click="createNewRepo"
            >新建</el-button>
          </el-input>
        </div>
      </div>
    </el-dialog>

    <!-- 新建文件弹窗 -->
    <el-dialog
      :title="newItemType === 'file' ? '新建脑图' : '新建文件夹'"
      :visible.sync="showNewItemDialog"
      width="400px"
      :append-to-body="true"
      @close="resetNewItemForm"
    >
      <el-form @submit.native.prevent="confirmNewItem">
        <el-form-item :label="newItemType === 'file' ? '文件名' : '文件夹名'">
          <el-input
            ref="newItemInput"
            v-model="newItemName"
            :placeholder="newItemType === 'file' ? '输入文件名（无需加 .km）' : '输入文件夹名'"
            @keyup.enter.native="confirmNewItem"
          />
        </el-form-item>
        <p v-if="newItemType === 'file'" class="form-hint">
          将创建在：{{ newItemParentPath || '根目录' }}
        </p>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="showNewItemDialog = false">取消</el-button>
        <el-button type="primary" size="small" :loading="newItemLoading" @click="confirmNewItem">创建</el-button>
      </span>
    </el-dialog>

    <!-- 重命名弹窗 -->
    <el-dialog
      title="重命名"
      :visible.sync="showRenameDialog"
      width="400px"
      :append-to-body="true"
      @close="resetRenameForm"
    >
      <el-form @submit.native.prevent="confirmRename">
        <el-form-item label="新名称">
          <el-input
            ref="renameInput"
            v-model="renameName"
            :placeholder="renameItem && renameItem.type === 'file' ? '输入新文件名（无需加 .km）' : '输入新文件夹名'"
            @keyup.enter.native="confirmRename"
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="showRenameDialog = false">取消</el-button>
        <el-button type="primary" size="small" :loading="renameLoading" @click="confirmRename">确认</el-button>
      </span>
    </el-dialog>

    <!-- 移动文件弹窗 -->
    <el-dialog
      title="移动到..."
      :visible.sync="showMoveDialog"
      width="400px"
      :append-to-body="true"
    >
      <div class="move-tree">
        <div
          class="move-dir-item"
          :class="{ active: moveTargetDir === '' }"
          @click="moveTargetDir = ''"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
          根目录
        </div>
        <div
          v-for="dir in allDirs"
          :key="dir.path"
          class="move-dir-item"
          :class="{ active: moveTargetDir === dir.path }"
          :style="{ paddingLeft: (dir.depth * 16 + 12) + 'px' }"
          @click="moveTargetDir = dir.path"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
          {{ dir.name }}
        </div>
      </div>
      <span slot="footer">
        <el-button size="small" @click="showMoveDialog = false">取消</el-button>
        <el-button type="primary" size="small" :loading="moveLoading" @click="confirmMove">移动到此处</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { listRepos, createRepo, putFile, batchGetLastCommitTimes } from '@/api'
import { xmindFileToKmString } from '@/utils/xmindConverter'
import TreeNode from './TreeNode.vue'

export default {
  name: 'FileTree',

  components: { TreeNode },

  directives: {
    // 点击元素外部时触发回调
    clickOutside: {
      bind(el, binding) {
        el.__clickOutsideHandler__ = (e) => {
          if (!el.contains(e.target)) binding.value(e)
        }
        document.addEventListener('click', el.__clickOutsideHandler__)
      },
      unbind(el) {
        document.removeEventListener('click', el.__clickOutsideHandler__)
      }
    }
  },

  props: {
    currentFilePath: {
      type: String,
      default: null
    }
  },

  data() {
    return {
      // 仓库选择
      showRepoSelector: false,
      repos: [],
      reposLoading: false,
      repoSearch: '',
      newRepoName: '',
      creatingRepo: false,

      // 新建文件/文件夹
      showNewItemDialog: false,
      newItemType: 'file', // 'file' | 'folder'
      newItemParentPath: '',
      newItemName: '',
      newItemLoading: false,

      // 重命名
      showRenameDialog: false,
      renameItem: null,
      renameName: '',
      renameLoading: false,

      // 移动
      showMoveDialog: false,
      moveItem: null,
      moveTargetDir: '',
      moveLoading: false,
      allDirs: [],

      // 新建下拉菜单
      showNewMenu: false,
      // 导入 xmind
      isImporting: false
    }
  },

  computed: {
    ...mapGetters('auth', ['selectedRepo', 'owner', 'repoName']),
    ...mapGetters('files', ['getDir']),

    rootDir() {
      return this.getDir('')
    },

    rootItems() {
      return this.rootDir.items || []
    },

    rootLoading() {
      return this.rootDir.loading
    },

    filteredRepos() {
      if (!this.repoSearch) return this.repos
      const q = this.repoSearch.toLowerCase()
      return this.repos.filter(r => r.name.toLowerCase().includes(q))
    }
  },

  watch: {
    showRepoSelector(val) {
      if (val) this.loadRepos()
    },

    selectedRepo(val) {
      if (val) {
        this.$store.dispatch('files/clearTree')
        this.loadRootDir()
      }
    }
  },

  created() {
    if (this.selectedRepo) {
      this.loadRootDir()
    }
  },

  methods: {
    // selectRepo 不再通过 mapActions 映射，直接用 this.$store.dispatch 调用，避免名称冲突
    ...mapActions('files', ['loadDir', 'createFile', 'createDir', 'deleteFileItem', 'deleteDirItem', 'renameFileItem', 'moveFileItem']),

    // ---- 新建下拉菜单 ----

    toggleNewMenu() {
      this.showNewMenu = !this.showNewMenu
    },

    closeNewMenu() {
      this.showNewMenu = false
    },

    handleNewFileFromMenu() {
      this.showNewMenu = false
      this.handleNewFile('')
    },

    handleNewFolderFromMenu() {
      this.showNewMenu = false
      this.handleNewFolder('')
    },

    // ---- 导入 xmind ----

    handleImportXmind() {
      this.showNewMenu = false
      this.$refs.xmindFileInput.value = ''
      this.$refs.xmindFileInput.click()
    },

    async onXmindFileSelected(event) {
      const file = event.target.files && event.target.files[0]
      if (!file) return

      this.isImporting = true
      try {
        // 1. 转换 xmind → km JSON
        const kmJson = await xmindFileToKmString(file)

        // 2. 询问保存文件名
        const defaultName = file.name.replace(/\.xmind$/i, '')
        let inputName
        try {
          const { value } = await this.$prompt(
            '请输入保存的脑图文件名（无需加 .km）',
            '导入 xmind',
            {
              confirmButtonText: '保存',
              cancelButtonText: '取消',
              inputValue: defaultName,
              inputValidator: (v) => (v && v.trim() ? true : '文件名不能为空')
            }
          )
          inputName = value.trim()
        } catch {
          return // 用户取消
        }

        // 3. 保存到 GitHub 根目录
        const owner = this.$store.getters['auth/owner']
        const repo  = this.$store.getters['auth/repoName']
        const filePath = `${inputName}.km`
        await putFile(owner, repo, filePath, kmJson, `import xmind: ${filePath}`)

        // 4. 刷新文件树并自动打开
        this.$store.commit('files/INVALIDATE_DIR', '')
        await this.loadDir('')
        await this.$store.dispatch('files/openFile', { path: filePath })
        this.$emit('open-file', { path: filePath, name: `${inputName}.km` })

        this.$message({ message: `导入成功，已保存为 ${filePath}`, type: 'success', duration: 2500 })
      } catch (err) {
        console.error('[FileTree] 导入 xmind 失败:', err)
        this.$message.error('导入失败：' + (err.message || err))
      } finally {
        this.isImporting = false
      }
    },

    async loadRootDir() {
      try {
        await this.loadDir('')
        // 异步拉取根目录文件的最后提交时间（不阻塞主流程）
        this.fetchCommitTimes('')
      } catch (err) {
        this.$message.error('加载文件列表失败')
      }
    },

    async refreshDir(path) {
      this.$store.commit('files/INVALIDATE_DIR', path)
      await this.loadDir(path)
      this.fetchCommitTimes(path)
    },

    /**
     * 批量拉取指定目录下所有 .km 文件的最后提交时间，并写入 store
     * 异步执行，不阻塞 UI
     */
    async fetchCommitTimes(dirPath) {
      const owner = this.$store.getters['auth/owner']
      const repo  = this.$store.getters['auth/repoName']
      if (!owner || !repo) return

      const dir = this.$store.getters['files/getDir'](dirPath)
      const kmFiles = (dir.items || []).filter(
        i => i.type === 'file' && i.name.endsWith('.km')
      )
      if (kmFiles.length === 0) return

      try {
        const times = await batchGetLastCommitTimes(owner, repo, kmFiles.map(f => f.path))
        for (const [filePath, time] of Object.entries(times)) {
          if (time) {
            this.$store.commit('files/SET_ITEM_COMMIT_TIME', { dirPath, filePath, time })
          }
        }
      } catch (err) {
        // 时间拉取失败不影响主功能，静默忽略
        console.warn('[FileTree] fetchCommitTimes 失败:', err)
      }
    },

    // ---- 仓库操作 ----

    async loadRepos() {
      this.reposLoading = true
      try {
        this.repos = await listRepos({ perPage: 100, sort: 'updated' })
      } catch (err) {
        this.$message.error('加载仓库列表失败')
      } finally {
        this.reposLoading = false
      }
    },

    async handleSelectRepo(repo) {
      // 直接调用 store action（避免与 mapActions 的 selectRepo 冲突）
      await this.$store.dispatch('auth/selectRepo', repo)
      this.showRepoSelector = false
      this.$store.dispatch('files/clearTree')
    },

    async createNewRepo() {
      if (!this.newRepoName.trim()) {
        this.$message.warning('请输入仓库名称')
        return
      }
      this.creatingRepo = true
      try {
        const repo = await createRepo(this.newRepoName.trim())
        this.$message.success(`仓库 ${repo.name} 创建成功`)
        await this.handleSelectRepo(repo)
        this.newRepoName = ''
      } catch (err) {
        this.$message.error('创建仓库失败：' + (err.response?.data?.message || err.message))
      } finally {
        this.creatingRepo = false
      }
    },

    // ---- 新建文件/文件夹 ----

    handleNewFile(parentPath) {
      this.newItemType = 'file'
      this.newItemParentPath = parentPath
      this.newItemName = ''
      this.showNewItemDialog = true
      this.$nextTick(() => this.$refs.newItemInput?.focus())
    },

    handleNewFolder(parentPath) {
      this.newItemType = 'folder'
      this.newItemParentPath = parentPath
      this.newItemName = ''
      this.showNewItemDialog = true
      this.$nextTick(() => this.$refs.newItemInput?.focus())
    },

    async confirmNewItem() {
      if (!this.newItemName.trim()) {
        this.$message.warning('请输入名称')
        return
      }
      this.newItemLoading = true
      try {
        if (this.newItemType === 'file') {
          const filePath = await this.createFile({
            parentPath: this.newItemParentPath,
            name: this.newItemName.trim()
          })
          this.showNewItemDialog = false
          // 自动打开新建的文件
          this.$emit('open-file', { path: filePath, name: filePath.split('/').pop() })
        } else {
          await this.createDir({
            parentPath: this.newItemParentPath,
            name: this.newItemName.trim()
          })
          this.showNewItemDialog = false
          this.$message.success('文件夹创建成功')
        }
      } catch (err) {
        this.$message.error('创建失败：' + err.message)
      } finally {
        this.newItemLoading = false
      }
    },

    resetNewItemForm() {
      this.newItemName = ''
    },

    // ---- 重命名 ----

    handleRename(item) {
      this.renameItem = item
      // 去掉 .km 后缀显示
      this.renameName = item.type === 'file'
        ? item.name.replace(/\.km$/, '')
        : item.name
      this.showRenameDialog = true
      this.$nextTick(() => this.$refs.renameInput?.focus())
    },

    async confirmRename() {
      if (!this.renameName.trim()) {
        this.$message.warning('请输入名称')
        return
      }
      this.renameLoading = true
      const item = this.renameItem
      const parentPath = item.path.split('/').slice(0, -1).join('/')

      try {
        if (item.type === 'file') {
          await this.renameFileItem({
            path: item.path,
            sha: item.sha,
            newName: this.renameName.trim(),
            parentPath
          })
        } else {
          // 文件夹重命名：暂不支持（需要递归移动所有文件）
          this.$message.warning('文件夹重命名暂不支持，请手动操作')
          this.showRenameDialog = false
          return
        }
        this.showRenameDialog = false
        this.$message.success('重命名成功')
      } catch (err) {
        this.$message.error('重命名失败：' + err.message)
      } finally {
        this.renameLoading = false
      }
    },

    resetRenameForm() {
      this.renameItem = null
      this.renameName = ''
    },

    // ---- 删除 ----

    handleDelete(item) {
      const isDir = item.type === 'dir'
      const msg = isDir
        ? `确定要删除文件夹「${item.name}」及其所有内容吗？此操作不可撤销。`
        : `确定要删除「${item.name}」吗？此操作不可撤销。`

      this.$confirm(msg, '确认删除', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }).then(async () => {
        const parentPath = item.path.split('/').slice(0, -1).join('/')
        try {
          if (isDir) {
            await this.deleteDirItem({ path: item.path, parentPath })
          } else {
            await this.deleteFileItem({ path: item.path, sha: item.sha, parentPath })
          }
          this.$message.success('删除成功')
        } catch (err) {
          this.$message.error('删除失败：' + err.message)
        }
      }).catch(() => {})
    },

    // ---- 移动 ----

    handleMove(item) {
      this.moveItem = item
      this.moveTargetDir = ''
      // 收集所有目录
      this.allDirs = this.collectDirs(this.rootItems, 0)
      this.showMoveDialog = true
    },

    collectDirs(items, depth) {
      const dirs = []
      for (const item of items) {
        if (item.type === 'dir') {
          dirs.push({ path: item.path, name: item.name, depth })
          const subDir = this.getDir(item.path)
          if (subDir.loaded) {
            dirs.push(...this.collectDirs(subDir.items, depth + 1))
          }
        }
      }
      return dirs
    },

    async confirmMove() {
      if (!this.moveItem) return
      const item = this.moveItem
      const fileName = item.name
      const oldParentPath = item.path.split('/').slice(0, -1).join('/')

      // 不能移动到自身所在目录
      if (this.moveTargetDir === oldParentPath) {
        this.$message.warning('文件已在该目录中')
        return
      }

      this.moveLoading = true
      try {
        await this.moveFileItem({
          path: item.path,
          sha: item.sha,
          targetDir: this.moveTargetDir,
          fileName
        })
        this.showMoveDialog = false
        this.$message.success('移动成功')
      } catch (err) {
        this.$message.error('移动失败：' + err.message)
      } finally {
        this.moveLoading = false
      }
    }
  }
}
</script>

<style scoped>
.file-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e2e;
  color: #cdd6f4;
  font-size: 13px;
  user-select: none;
}

/* 仓库头部 */
.repo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  min-height: 40px;
}

.repo-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  flex: 1;
  min-width: 0;
  transition: background 0.15s;
}

.repo-info:hover {
  background: rgba(255, 255, 255, 0.06);
}

.repo-icon {
  width: 14px;
  height: 14px;
  color: #89b4fa;
  flex-shrink: 0;
}

.repo-name {
  font-size: 12px;
  font-weight: 600;
  color: #cdd6f4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron-icon {
  width: 16px;
  height: 16px;
  color: #6c7086;
  flex-shrink: 0;
}

.root-actions {
  display: flex;
  gap: 2px;
}

.icon-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 5px;
  color: #6c7086;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #cdd6f4;
}

.icon-btn svg {
  width: 14px;
  height: 14px;
}

/* 树内容 */
.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.tree-content::-webkit-scrollbar {
  width: 4px;
}

.tree-content::-webkit-scrollbar-track {
  background: transparent;
}

.tree-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

/* 状态 */
.loading-state,
.empty-state,
.no-repo-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  color: #6c7086;
  font-size: 12px;
}

.mini-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(137, 180, 250, 0.2);
  border-top-color: #89b4fa;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.text-btn,
.select-repo-btn {
  background: none;
  border: 1px solid rgba(137, 180, 250, 0.3);
  color: #89b4fa;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.text-btn:hover,
.select-repo-btn:hover {
  background: rgba(137, 180, 250, 0.1);
}

/* 仓库选择弹窗 */
.repo-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.repos-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: #6c7086;
  font-size: 13px;
}

.repos-list {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.repo-item {
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.15s;
}

.repo-item:last-child {
  border-bottom: none;
}

.repo-item:hover {
  background: #f5f7fa;
}

.repo-item.active {
  background: #ecf5ff;
}

.repo-item-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.repo-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.repo-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
}

.repo-badge.private {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}

.repo-badge.public {
  background: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.repo-item-desc {
  font-size: 12px;
  color: #909399;
  margin: 4px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.repos-empty {
  padding: 20px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.repo-create {
  margin-top: 4px;
}

/* 移动弹窗 */
.move-tree {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.move-dir-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  color: #303133;
  transition: background 0.15s;
  border-bottom: 1px solid #f0f0f0;
}

.move-dir-item:last-child {
  border-bottom: none;
}

.move-dir-item:hover {
  background: #f5f7fa;
}

.move-dir-item.active {
  background: #ecf5ff;
  color: #409eff;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  margin: 4px 0 0;
}

/* 新建下拉菜单 */
.new-dropdown {
  position: relative;
}

.new-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 140px;
  background: #313244;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 100;
  overflow: hidden;
  padding: 4px 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  font-size: 12px;
  color: #cdd6f4;
  cursor: pointer;
  transition: background 0.1s;
  white-space: nowrap;
}

.dropdown-item:hover {
  background: rgba(137, 180, 250, 0.12);
  color: #89b4fa;
}

.dropdown-item svg {
  flex-shrink: 0;
  color: #6c7086;
}

.dropdown-item:hover svg {
  color: #89b4fa;
}

.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 4px 0;
}
</style>
