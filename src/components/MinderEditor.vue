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
          @click="$emit('save')"
        >
          <span v-if="isSaving" class="btn-spinner"></span>
          {{ isSaving ? '保存中...' : (isDirty ? '⌘S 保存' : '已保存') }}
        </button>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading" class="placeholder">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 空状态：没有文件，且不在加载中，且编辑器未就绪 -->
    <div v-else-if="!editorReady" class="placeholder">
      <p style="color:#aaa">← 从左侧选择或新建一个脑图文件</p>
    </div>

    <!-- 脑图编辑器：editorReady 为 true 且 parsedJson 有值时才渲染 -->
    <!-- key 变化时强制重建，确保切换文件时编辑器重新初始化 -->
    <minder-editor
      v-else
      :key="editorKey"
      :import-json="currentJson"
      :height="bodyHeight"
      :theme="theme"
      style="flex:1;overflow:hidden;"
      @save="onSave"
    />

  </div>
</template>

<script>
export default {
  name: 'MinderEditor',

  props: {
    fileName:   { type: String,  default: '未命名' },
    isDirty:    { type: Boolean, default: false },
    isLoading:  { type: Boolean, default: false },
    isSaving:   { type: Boolean, default: false }
  },

  data() {
    return {
      bodyHeight: 500,
      editorKey: 0,
      theme: 'fresh-blue',
      editorReady: false,
      currentJson: null
    }
  },

  mounted() {
    this.calcHeight()
    window.addEventListener('resize', this.calcHeight)
    document.addEventListener('keydown', this.onKeydown)

    // 直接监听 store 的 currentFile 变化，不依赖 props
    this.unsubscribe = this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'files/SET_CURRENT_FILE') {
        console.log('[MinderEditor store.subscribe] SET_CURRENT_FILE, file:', mutation.payload?.path, 'content:', mutation.payload?.content?.substring(0, 50))
        if (mutation.payload?.content) {
          this.loadContent(mutation.payload.content)
        } else {
          this.editorReady = false
          this.currentJson = null
        }
      }
    })

    // 检查初始状态
    const initial = this.$store.getters['files/currentFile']
    if (initial?.content) {
      console.log('[MinderEditor] 初始 content 存在，长度:', initial.content.length)
      this.loadContent(initial.content)
    } else {
      console.log('[MinderEditor] 初始 content 为空')
    }
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.calcHeight)
    document.removeEventListener('keydown', this.onKeydown)
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  },

  methods: {
    // 加载内容到编辑器
    loadContent(content) {
      if (!content) {
        this.editorReady = false
        this.currentJson = null
        return
      }

      let parsed = null
      try {
        const d = JSON.parse(content)
        if (d && typeof d === 'object') {
          parsed = d
          if (d.theme) this.theme = d.theme
          console.log('[MinderEditor loadContent] JSON 解析成功，root:', d.root ? '✓' : '✗')
        }
      } catch (e) {
        console.error('[MinderEditor loadContent] JSON 解析失败:', e.message)
      }

      if (!parsed) {
        console.warn('[MinderEditor loadContent] 无法解析，显示空状态')
        this.editorReady = false
        this.currentJson = null
        return
      }

      // 重建编辑器
      this.editorReady = false
      this.currentJson = null
      this.$nextTick(() => {
        this.currentJson = parsed
        this.editorKey++
        this.editorReady = true
        this.$nextTick(this.calcHeight)
      })
    },

    calcHeight() {
      const total = this.$el ? this.$el.clientHeight : window.innerHeight
      this.bodyHeight = Math.max(300, total - 44)
    },

    // 编辑器内置保存按钮触发，data 是 exportJson() 的 Object
    onSave(data) {
      if (!data) return
      const content = JSON.stringify(data, null, 2)
      this.$emit('change', content)
      this.$nextTick(() => this.$emit('save'))
    },

    onKeydown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (window.minder) {
          const data = window.minder.exportJson()
          this.onSave(data)
        }
      }
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
