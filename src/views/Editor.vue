<template>
  <div class="editor-layout">
    <!-- 侧边栏 -->
    <div
      class="sidebar"
      :class="{ collapsed: sidebarCollapsed }"
      :style="{ width: sidebarCollapsed ? '0' : sidebarWidth + 'px' }"
    >
      <div class="sidebar-inner">
        <!-- 用户信息栏 -->
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

        <!-- 文件树 -->
        <file-tree
          :current-file-path="currentFilePath"
          @open-file="openFile"
        />
      </div>

      <!-- 拖拽调整宽度的把手 -->
      <div
        class="resize-handle"
        @mousedown="startResize"
      ></div>
    </div>

    <!-- 侧边栏折叠按钮 -->
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

    <!-- 主编辑区 -->
    <div class="main-area">
      <minder-editor
        :content="currentFileContent"
        :file-name="currentFileName"
        :is-dirty="isDirty"
        :is-loading="isFileLoading"
        :is-saving="isFileSaving"
        @change="onEditorChange"
        @save="saveFile"
        @error="onEditorError"
      />
    </div>

    <!-- 未保存提示（离开页面时） -->
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import FileTree from '@/components/FileTree.vue'
import MinderEditor from '@/components/MinderEditor.vue'

export default {
  name: 'EditorPage',

  components: {
    FileTree,
    MinderEditor
  },

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
    ...mapGetters('files', ['currentFile', 'isDirty', 'isFileLoading', 'isFileSaving']),

    currentFilePath() {
      return this.currentFile?.path || null
    },

    currentFileName() {
      if (!this.currentFile) return '未命名'
      return this.currentFile.name.replace(/\.km$/, '')
    },

    currentFileContent() {
      return this.currentFile?.content || null
    }
  },

  mounted() {
    // 监听页面关闭/刷新，提示未保存
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },

  beforeDestroy() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
    this.stopResize()
  },

  methods: {
    ...mapActions('auth', ['logout']),
    ...mapActions('files', ['openFile', 'saveCurrentFile', 'updateContent']),

    async openFile({ path }) {
      // 如果有未保存的修改，提示用户
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
          // 用户选择保存
          await this.saveCurrentFile()
        } catch (action) {
          if (action === 'close') {
            // 用户点了 X，取消操作
            return
          }
          // 用户选择直接打开（不保存）
        }
      }

      try {
        await this.$store.dispatch('files/openFile', { path })
      } catch (err) {
        this.$message.error('打开文件失败：' + err.message)
      }
    },

    onEditorChange(content) {
      this.updateContent(content)
    },

    async saveFile() {
      try {
        await this.saveCurrentFile()
        this.$message({
          message: '保存成功',
          type: 'success',
          duration: 1500
        })
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

    // ---- 侧边栏宽度拖拽 ----

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
      const newWidth = Math.max(180, Math.min(480, this.resizeStartWidth + delta))
      this.sidebarWidth = newWidth
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

/* 侧边栏 */
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

/* 用户信息栏 */
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

/* 拖拽把手 */
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

/* 折叠按钮 */
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

/* 主编辑区 */
.main-area {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  background: #ffffff;
}
</style>
