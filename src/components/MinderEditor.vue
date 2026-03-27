<template>
  <div class="minder-editor-wrapper">

    <!-- 顶部工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <span class="file-name">{{ fileName }}</span>
        <span v-if="isDirty" class="dirty-dot" title="有未保存的修改"></span>
      </div>
      <div class="toolbar-right">
        <button
          class="save-btn"
          :class="{ active: isDirty }"
          :disabled="isSaving || !isDirty"
          @click="handleSave"
        >
          <span v-if="isSaving" class="btn-spinner"></span>
          {{ isSaving ? '保存中...' : (isDirty ? '⌘S 保存' : '已保存') }}
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!editorReady" class="placeholder">
      <p style="color:#aaa">← 从左侧选择或新建一个脑图文件</p>
    </div>

    <!-- 脑图编辑器 -->
    <minder-editor
      v-else
      ref="ktmEditor"
      :import-json="currentJson"
      :height="bodyHeight"
      :theme="theme"
      style="flex:1;overflow:hidden;"
      @save="onEditorSave"
    />

  </div>
</template>

<script>
export default {
  name: 'MinderEditor',

  data() {
    return {
      bodyHeight: 500,
      theme: 'fresh-blue',
      editorReady: false,
      currentJson: null,
      fileName: '未命名',
      isReady: false
    }
  },

  computed: {
    isDirty() {
      return this.$store.getters['files/currentFile']?.dirty || false
    },
    isSaving() {
      return this.$store.getters['files/isFileSaving']
    }
  },

  mounted() {
    this.calcHeight()
    window.addEventListener('resize', this.calcHeight)
    document.addEventListener('keydown', this.onKeydown)

    // 等待 Vue 更新完成后再读取 store
    this.$nextTick(() => {
      const file = this.$store.getters['files/currentFile']
      if (file?.content) {
        this.applyContent(file)
      }
      // 标记组件就绪
      this.isReady = true
    })
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.calcHeight)
    document.removeEventListener('keydown', this.onKeydown)
  },

  methods: {
    applyContent(file) {
      if (!file?.content) return
      try {
        const d = JSON.parse(file.content)
        if (!d || typeof d !== 'object') return
        this.fileName = file.name.replace(/\.km$/, '')
        if (d.theme) this.theme = d.theme
        this.currentJson = d
        this.editorReady = true
        this.calcHeight()
      } catch (e) {
        console.error('[MinderEditor] 解析失败:', e.message)
        this.editorReady = false
      }
    },

    calcHeight() {
      if (this.$el) {
        this.bodyHeight = Math.max(300, this.$el.clientHeight - 44)
      }
    },

    onEditorSave() {
      if (!this.isReady) return
      const ktm = this.$refs.ktmEditor
      if (!ktm) return
      const data = ktm.exportJson ? ktm.exportJson() : this.currentJson
      if (!data) return
      const content = JSON.stringify(data, null, 2)
      this.$store.dispatch('files/updateContent', content)
      this.$nextTick(() => this.$store.dispatch('files/saveCurrentFile'))
    },

    onKeydown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        this.handleSave()
      }
    },

    handleSave() {
      if (!this.isReady) return
      this.onEditorSave()
      this.$message({ message: '保存成功', type: 'success', duration: 1500 })
    }
  }
}
</script>

<style scoped>
.minder-editor-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #343a40;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dirty-dot {
  width: 8px;
  height: 8px;
  background: #fd7e14;
  border-radius: 50%;
  flex-shrink: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: #e9ecef;
  color: #6c757d;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.save-btn.active {
  background: #4f9cf9;
  color: #fff;
}
.save-btn.active:hover { background: #3a8ae8; }
.save-btn:disabled { opacity: 0.6; cursor: default; }

.btn-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e9ecef;
  border-top-color: #4f9cf9;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
</style>
