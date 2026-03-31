<template>
  <div class="editor-layout">
    <div
      class="sidebar"
      :class="{ collapsed: sidebarCollapsed }"
      :style="{ width: sidebarCollapsed ? '0' : sidebarWidth + 'px' }"
    >
      <div class="sidebar-inner">
        <div class="user-bar">
          <img
            v-if="user && user.avatar_url"
            :src="user.avatar_url"
            :alt="user.login"
            class="user-avatar"
          />
          <span class="user-name">{{ user ? user.login : '' }}</span>
          <button class="logout-btn" title="退出登录" @click="handleLogout">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </button>
        </div>

        <!-- open-file 事件 → handleOpenFile（避免与 mapActions 的 openFile 冲突） -->
        <file-tree
          :current-file-path="currentFilePath"
          @open-file="handleOpenFile"
        />

        <!-- 左下角 GitHub 链接 -->
        <a
          class="sidebar-github-link"
          href="https://github.com/ljheee/my-minder"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub 仓库 · 反馈问题"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          ljheee/my-minder
        </a>
      </div>

      <div class="resize-handle" @mousedown="startResize"></div>
    </div>

    <button
      class="sidebar-toggle"
      :class="{ collapsed: sidebarCollapsed }"
      :style="{ left: sidebarCollapsed ? '0' : sidebarWidth + 'px' }"
      @click="sidebarCollapsed = !sidebarCollapsed"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
        <path v-if="sidebarCollapsed" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
        <path v-else d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
      </svg>
    </button>

    <div class="main-area" :style="{ '--sidebar-width': (sidebarCollapsed ? 16 : sidebarWidth + 16) + 'px' }">
      <minder-editor :file-data="currentFile" />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import FileTree from '@/components/FileTree.vue'
import MinderEditor from '@/components/MinderEditor.vue'

export default {
  name: 'EditorPage',

  components: { FileTree, MinderEditor },

  data() {
    return {
      sidebarCollapsed: false,
      sidebarWidth: 260,
      isResizing: false,
      resizeStartX: 0,
      resizeStartWidth: 0
    }
  },

  computed: {
    ...mapGetters('auth', ['user', 'isLoggedIn']),
    ...mapGetters('files', ['isDirty', 'isFileLoading', 'isFileSaving']),

    currentFile() {
      return this.$store.getters['files/currentFile']
    },

    currentFilePath() {
      return this.currentFile?.path || ''
    },

    currentFileName() {
      return this.currentFile?.name?.replace(/\.km$/, '') || '未命名'
    }
  },

  mounted() {
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },

  beforeDestroy() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
    this.stopResize()
  },

  methods: {
    // mapActions：openFile / saveCurrentFile / updateContent 直接映射到 store
    ...mapActions('auth', ['logout']),
    ...mapActions('files', ['openFile', 'saveCurrentFile', 'updateContent']),

    // 本地方法名改为 handleOpenFile，避免与 mapActions 的 openFile 冲突
    async handleOpenFile({ path }) {
      if (this.isDirty) {
        try {
          await this.$confirm(
            '当前文件有未保存的修改，是否保存后再打开新文件？',
            '未保存的修改',
            {
              confirmButtonText: '保存并打开',
              cancelButtonText: '直接打开',
              distinguishCancelAndClose: true,
              type: 'warning'
            }
          )
          await this.saveCurrentFile()
        } catch (action) {
          if (action === 'close') return
          // 直接打开，不保存
        }
      }
      try {
        await this.openFile({ path })
      } catch (err) {
        this.$message.error('打开文件失败：' + err.message)
      }
    },

    onEditorChange(content) {
      this.updateContent(content)
    },

    async handleSave() {
      try {
        await this.saveCurrentFile()
        this.$message({ message: '保存成功', type: 'success', duration: 1500 })
      } catch (err) {
        this.$message.error('保存失败：' + err.message)
      }
    },

    onEditorError(msg) {
      this.$message.error(msg)
    },

    async handleLogout() {
      if (this.isDirty) {
        try {
          await this.$confirm('有未保存的修改，确定要退出吗？', '确认退出', {
            confirmButtonText: '退出',
            cancelButtonText: '取消',
            type: 'warning'
          })
        } catch {
          return
        }
      }
      this.logout()
      this.$router.push('/login')
    },

    handleBeforeUnload(e) {
      if (this.isDirty) {
        e.preventDefault()
        e.returnValue = '有未保存的修改，确定要离开吗？'
      }
    },

    startResize(e) {
      this.isResizing = true
      this.resizeStartX = e.clientX
      this.resizeStartWidth = this.sidebarWidth
      document.addEventListener('mousemove', this.doResize)
      document.addEventListener('mouseup', this.stopResize)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },

    doResize(e) {
      if (!this.isResizing) return
      const delta = e.clientX - this.resizeStartX
      this.sidebarWidth = Math.max(180, Math.min(480, this.resizeStartWidth + delta))
    },

    stopResize() {
      this.isResizing = false
      document.removeEventListener('mousemove', this.doResize)
      document.removeEventListener('mouseup', this.stopResize)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }
}
</script>

<style scoped>
.editor-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #1e1e2e;
  position: relative;
}

.sidebar {
  flex-shrink: 0;
  height: 100%;
  position: relative;
  transition: width 0.2s ease;
  overflow: hidden;
}

.sidebar-inner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-github-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
  text-decoration: none;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  transition: color 0.15s;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-github-link:hover {
  color: rgba(255, 255, 255, 0.6);
}

.user-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  min-height: 44px;
  flex-shrink: 0;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
}

.user-name {
  flex: 1;
  font-size: 12px;
  color: #a6adc8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
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
  flex-shrink: 0;
}

.logout-btn:hover {
  background: rgba(243, 139, 168, 0.15);
  color: #f38ba8;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s;
  z-index: 10;
}

.resize-handle:hover {
  background: rgba(137, 180, 250, 0.3);
}

.sidebar-toggle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 40px;
  background: #313244;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: none;
  border-radius: 0 6px 6px 0;
  color: #6c7086;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  transition: left 0.2s ease, color 0.15s;
  padding: 0;
}

.sidebar-toggle:hover {
  color: #cdd6f4;
  background: #45475a;
}

.main-area {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow-x: hidden;
  overflow-y: visible;
  background: #ffffff;
  position: relative;
}
</style>
