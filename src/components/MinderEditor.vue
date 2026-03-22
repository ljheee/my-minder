<template>
  <div class="minder-editor-wrapper">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <!-- 文件名 -->
        <div class="file-title">
          <span class="file-name">{{ fileName }}</span>
          <span v-if="isDirty" class="dirty-dot" title="有未保存的修改"></span>
        </div>
      </div>

      <div class="toolbar-center">
        <!-- 主题切换 -->
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
        <!-- 保存按钮 -->
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

        <!-- 导出按钮 -->
        <div class="export-dropdown">
          <button class="export-btn" @click="showExportMenu = !showExportMenu">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            导出
          </button>
          <div v-if="showExportMenu" class="export-menu" v-click-outside="() => showExportMenu = false">
            <button @click="exportAs('png')">导出为 PNG</button>
            <button @click="exportAs('svg')">导出为 SVG</button>
            <button @click="exportAs('json')">导出为 JSON</button>
            <button @click="exportAs('text')">导出为文本大纲</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 脑图编辑器主体 -->
    <div class="editor-body">
      <div v-if="isLoading" class="editor-loading">
        <div class="loading-spinner"></div>
        <p>加载脑图中...</p>
      </div>
      <div v-else-if="!content" class="editor-empty">
        <p>从左侧选择或新建一个脑图文件</p>
      </div>
      <div v-else ref="minderContainer" class="minder-container"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MinderEditor',

  directives: {
    'click-outside': {
      bind(el, binding) {
        el._clickOutside = (e) => {
          if (!el.contains(e.target)) binding.value(e)
        }
        document.addEventListener('click', el._clickOutside)
      },
      unbind(el) {
        document.removeEventListener('click', el._clickOutside)
      }
    }
  },

  props: {
    content: {
      type: String,
      default: null
    },
    fileName: {
      type: String,
      default: '未命名'
    },
    isDirty: {
      type: Boolean,
      default: false
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    isSaving: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      minder: null,
      currentTheme: 'fresh-blue',
      showExportMenu: false,
      themes: [
        { value: 'fresh-blue', label: '清新蓝', color: '#4f9cf9' },
        { value: 'classic', label: '经典', color: '#5c6bc0' },
        { value: 'snow', label: '雪白', color: '#eceff1' },
        { value: 'wire', label: '线框', color: '#607d8b' },
        { value: 'fresh-green', label: '清新绿', color: '#66bb6a' },
        { value: 'fish', label: '鱼骨', color: '#ff7043' }
      ],
      // 防抖定时器
      contentChangeTimer: null
    }
  },

  watch: {
    content(newVal, oldVal) {
      if (newVal && newVal !== oldVal) {
        this.loadContent(newVal)
      }
    }
  },

  mounted() {
    this.initMinder()
    // 注册快捷键
    document.addEventListener('keydown', this.handleKeydown)
  },

  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown)
    if (this.contentChangeTimer) {
      clearTimeout(this.contentChangeTimer)
    }
  },

  methods: {
    async initMinder() {
      // 动态加载 vue-minder-editor-extended
      // 使用动态 import 避免 SSR 问题
      try {
        const { default: MinderEditorExtended } = await import('vue-minder-editor-extended')

        // 创建一个临时 Vue 实例来挂载编辑器
        const Vue = (await import('vue')).default
        const EditorComponent = Vue.extend(MinderEditorExtended)

        this.editorInstance = new EditorComponent({
          propsData: {
            value: this.content || this.getEmptyMinder()
          }
        })

        this.editorInstance.$mount(this.$refs.minderContainer)

        // 监听内容变化
        this.editorInstance.$on('input', (val) => {
          this.onContentChange(val)
        })

        // 获取 minder 实例（用于主题切换和导出）
        this.$nextTick(() => {
          this.minder = window.minder || this.editorInstance.minder
        })
      } catch (err) {
        console.error('Failed to init minder editor:', err)
        this.$emit('error', '编辑器加载失败：' + err.message)
      }
    },

    loadContent(content) {
      if (!this.editorInstance) return
      try {
        const data = JSON.parse(content)
        // 更新主题
        if (data.theme) {
          this.currentTheme = data.theme
        }
        this.editorInstance.$props.value = content
        // 触发编辑器重新渲染
        if (this.minder) {
          this.minder.importJson(data)
        }
      } catch (err) {
        console.error('Failed to load minder content:', err)
      }
    },

    onContentChange(val) {
      // 防抖：300ms 后才触发 change 事件
      if (this.contentChangeTimer) {
        clearTimeout(this.contentChangeTimer)
      }
      this.contentChangeTimer = setTimeout(() => {
        this.$emit('change', val)
      }, 300)
    },

    changeTheme(theme) {
      this.currentTheme = theme
      if (this.minder) {
        this.minder.useTheme(theme)
        // 触发内容更新（包含新主题）
        const data = this.minder.exportJson()
        data.theme = theme
        this.$emit('change', JSON.stringify(data, null, 2))
      }
    },

    exportAs(format) {
      this.showExportMenu = false
      if (!this.minder) return

      const fileName = this.fileName.replace(/\.km$/, '')

      switch (format) {
        case 'png':
          this.minder.exportPng().then(blob => {
            this.downloadBlob(blob, `${fileName}.png`)
          })
          break
        case 'svg':
          this.minder.exportSvg().then(svg => {
            const blob = new Blob([svg], { type: 'image/svg+xml' })
            this.downloadBlob(blob, `${fileName}.svg`)
          })
          break
        case 'json': {
          const data = this.minder.exportJson()
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          this.downloadBlob(blob, `${fileName}.json`)
          break
        }
        case 'text': {
          const text = this.exportAsText(this.minder.exportJson())
          const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
          this.downloadBlob(blob, `${fileName}.txt`)
          break
        }
      }
    },

    exportAsText(data) {
      if (!data || !data.root) return ''
      const lines = []
      const traverse = (node, level) => {
        const prefix = '  '.repeat(level) + (level === 0 ? '' : '- ')
        lines.push(prefix + (node.data?.text || ''))
        if (node.children) {
          node.children.forEach(child => traverse(child, level + 1))
        }
      }
      traverse(data.root, 0)
      return lines.join('\n')
    },

    downloadBlob(blob, fileName) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    },

    getEmptyMinder() {
      return JSON.stringify({
        root: { data: { text: '中心主题' }, children: [] },
        template: 'default',
        theme: 'fresh-blue',
        version: '1.4.43'
      })
    },

    handleKeydown(e) {
      // ⌘S / Ctrl+S 保存
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (this.isDirty && !this.isSaving) {
          this.$emit('save')
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
  background: #ffffff;
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

.toolbar-left {
  flex: 1;
  min-width: 0;
}

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

.toolbar-center {
  display: flex;
  align-items: center;
}

.theme-selector {
  display: flex;
  gap: 4px;
}

.theme-btn {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}

.theme-btn:hover {
  transform: scale(1.2);
}

.theme-btn.active {
  border-color: #343a40;
  transform: scale(1.15);
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

.save-btn.has-changes {
  background: #4f9cf9;
  color: white;
}

.save-btn.has-changes:hover {
  background: #3a8ae8;
}

.save-btn:disabled {
  cursor: default;
  opacity: 0.7;
}

.saving-spinner {
  width: 12px;
  height: 12px;
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.export-dropdown {
  position: relative;
}

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

.export-btn:hover {
  background: #dee2e6;
}

.export-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

.export-menu button:hover {
  background: #f8f9fa;
}

/* 编辑器主体 */
.editor-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.editor-loading,
.editor-empty {
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
  border: 3px solid rgba(79, 156, 249, 0.2);
  border-top-color: #4f9cf9;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.editor-empty p {
  font-size: 14px;
}

.minder-container {
  width: 100%;
  height: 100%;
}

/* 覆盖 vue-minder-editor-extended 的样式，使其填满容器 */
.minder-container :deep(.minder-editor) {
  width: 100% !important;
  height: 100% !important;
}

.minder-container :deep(.km-editor) {
  width: 100% !important;
  height: 100% !important;
}
</style>
