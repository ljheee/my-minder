<template>
  <div class="minder-editor-wrapper">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <div class="file-title">
          <span class="file-name">{{ fileName }}</span>
          <span v-if="isDirty" class="dirty-dot" title="有未保存的修改"></span>
        </div>
      </div>

      <div class="toolbar-center">
        <div class="theme-selector">
          <button
            v-for="theme in themes"
            :key="theme.value"
            class="theme-btn"
            :class="{ active: currentTheme === theme.value }"
            :title="theme.label"
            :style="{ background: theme.color }"
            @click="changeTheme(theme.value)"
          ></button>
        </div>
      </div>

      <div class="toolbar-right">
        <button
          class="save-btn"
          :class="{ 'has-changes': isDirty }"
          :disabled="isSaving || !isDirty"
          @click="$emit('save')"
        >
          <svg v-if="!isSaving" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
          </svg>
          <span v-if="isSaving" class="saving-spinner"></span>
          {{ isSaving ? '保存中...' : (isDirty ? '保存 (⌘S)' : '已保存') }}
        </button>

        <div class="export-dropdown">
          <button class="export-btn" @click="showExportMenu = !showExportMenu">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            导出
          </button>
          <div v-if="showExportMenu" class="export-menu">
            <button @click="exportAs('json')">导出为 JSON</button>
            <button @click="exportAs('text')">导出为文本大纲</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-body">
      <div v-if="isLoading" class="editor-placeholder">
        <div class="loading-spinner"></div>
        <p>加载脑图中...</p>
      </div>
      <div v-else-if="!content" class="editor-placeholder">
        <svg viewBox="0 0 80 80" fill="none" width="64" height="64">
          <circle cx="40" cy="40" r="6" fill="#d1d5db"/>
          <line x1="40" y1="40" x2="16" y2="22" stroke="#d1d5db" stroke-width="2"/>
          <line x1="40" y1="40" x2="64" y2="22" stroke="#d1d5db" stroke-width="2"/>
          <line x1="40" y1="40" x2="16" y2="58" stroke="#d1d5db" stroke-width="2"/>
          <line x1="40" y1="40" x2="64" y2="58" stroke="#d1d5db" stroke-width="2"/>
          <circle cx="16" cy="22" r="4" fill="#e5e7eb"/>
          <circle cx="64" cy="22" r="4" fill="#e5e7eb"/>
          <circle cx="16" cy="58" r="4" fill="#e5e7eb"/>
          <circle cx="64" cy="58" r="4" fill="#e5e7eb"/>
        </svg>
        <p>从左侧选择或新建一个脑图文件</p>
      </div>
      <div v-else class="minder-container">
        <minder-editor-component
          v-if="editorReady"
          :value="editorValue"
          @input="onEditorInput"
        />
      </div>
    </div>
  </div>
</template>

<script>
import MinderEditorComponent from 'vue-minder-editor-extended'

export default {
  name: 'MinderEditor',

  components: {
    MinderEditorComponent
  },

  props: {
    content: { type: String, default: null },
    fileName: { type: String, default: '未命名' },
    isDirty: { type: Boolean, default: false },
    isLoading: { type: Boolean, default: false },
    isSaving: { type: Boolean, default: false }
  },

  data() {
    return {
      editorReady: false,
      editorValue: '',
      currentTheme: 'fresh-blue',
      showExportMenu: false,
      contentChangeTimer: null,
      themes: [
        { value: 'fresh-blue',  label: '清新蓝',  color: '#4f9cf9' },
        { value: 'classic',     label: '经典',    color: '#5c6bc0' },
        { value: 'snow',        label: '雪白',    color: '#eceff1' },
        { value: 'wire',        label: '线框',    color: '#607d8b' },
        { value: 'fresh-green', label: '清新绿',  color: '#66bb6a' },
        { value: 'fish',        label: '鱼骨',    color: '#ff7043' }
      ]
    }
  },

  watch: {
    content: {
      immediate: true,
      handler(val) {
        if (val) {
          this.editorValue = val
          this.editorReady = true
          try {
            const data = JSON.parse(val)
            if (data.theme) this.currentTheme = data.theme
          } catch (e) { /* ignore */ }
        } else {
          this.editorReady = false
          this.editorValue = ''
        }
      }
    }
  },

  mounted() {
    document.addEventListener('keydown', this.handleKeydown)
    document.addEventListener('click', this.handleOutsideClick)
  },

  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown)
    document.removeEventListener('click', this.handleOutsideClick)
    if (this.contentChangeTimer) clearTimeout(this.contentChangeTimer)
  },

  methods: {
    onEditorInput(val) {
      if (this.contentChangeTimer) clearTimeout(this.contentChangeTimer)
      this.contentChangeTimer = setTimeout(() => {
        this.$emit('change', val)
      }, 300)
    },

    changeTheme(theme) {
      this.currentTheme = theme
      if (!this.editorValue) return
      try {
        const data = JSON.parse(this.editorValue)
        data.theme = theme
        const newVal = JSON.stringify(data, null, 2)
        this.editorValue = newVal
        this.$emit('change', newVal)
      } catch (e) { /* ignore */ }
    },

    exportAs(format) {
      this.showExportMenu = false
      if (!this.editorValue) return
      const fileName = this.fileName.replace(/\.km$/, '')
      try {
        const data = JSON.parse(this.editorValue)
        if (format === 'json') {
          this.downloadText(JSON.stringify(data, null, 2), `${fileName}.json`, 'application/json')
        } else if (format === 'text') {
          this.downloadText(this.toOutlineText(data), `${fileName}.txt`, 'text/plain;charset=utf-8')
        }
      } catch (e) {
        this.$message?.error('导出失败')
      }
    },

    toOutlineText(data) {
      if (!data || !data.root) return ''
      const lines = []
      const walk = (node, level) => {
        lines.push('  '.repeat(level) + (level === 0 ? '' : '- ') + (node.data?.text || ''))
        if (node.children) node.children.forEach(c => walk(c, level + 1))
      }
      walk(data.root, 0)
      return lines.join('\n')
    },

    downloadText(text, name, mime) {
      const blob = new Blob([text], { type: mime })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    },

    handleKeydown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (this.isDirty && !this.isSaving) this.$emit('save')
      }
    },

    handleOutsideClick(e) {
      if (this.showExportMenu && !this.$el.querySelector('.export-dropdown')?.contains(e.target)) {
        this.showExportMenu = false
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
}

/* 工具栏 */
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

.toolbar-left { flex: 1; min-width: 0; }

.file-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #343a40;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.dirty-dot {
  width: 7px;
  height: 7px;
  background: #fd7e14;
  border-radius: 50%;
  flex-shrink: 0;
}

.toolbar-center { display: flex; align-items: center; }

.theme-selector { display: flex; gap: 4px; }

.theme-btn {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}
.theme-btn:hover { transform: scale(1.2); }
.theme-btn.active { border-color: #343a40; transform: scale(1.15); }

.toolbar-right { display: flex; align-items: center; gap: 8px; }

.save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #e9ecef;
  color: #6c757d;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.save-btn.has-changes { background: #4f9cf9; color: white; }
.save-btn.has-changes:hover { background: #3a8ae8; }
.save-btn:disabled { cursor: default; opacity: 0.7; }

.saving-spinner {
  width: 12px;
  height: 12px;
  border: 1.5px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.export-dropdown { position: relative; }

.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #e9ecef;
  color: #495057;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}
.export-btn:hover { background: #dee2e6; }

.export-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden;
  z-index: 100;
  min-width: 140px;
}
.export-menu button {
  display: block;
  width: 100%;
  padding: 9px 16px;
  background: none;
  border: none;
  text-align: left;
  font-size: 13px;
  color: #343a40;
  cursor: pointer;
  transition: background 0.1s;
}
.export-menu button:hover { background: #f8f9fa; }

/* 编辑器主体 */
.editor-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.editor-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #adb5bd;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(79,156,249,0.2);
  border-top-color: #4f9cf9;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.editor-placeholder p { font-size: 14px; }

.minder-container {
  width: 100%;
  height: 100%;
}

/* 覆盖 vue-minder-editor-extended 容器样式 */
.minder-container :deep(.minder-editor),
.minder-container :deep(.km-editor),
.minder-container :deep(> div) {
  width: 100% !important;
  height: 100% !important;
}
</style>
