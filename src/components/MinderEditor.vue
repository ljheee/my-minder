<template>
  <div class="minder-editor-wrapper">
    <!-- 顶部工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <span class="file-name">{{ fileName }}</span>
        <span v-if="isDirty" class="dirty-dot"></span>
      </div>
      <div class="toolbar-right">
        <button class="save-btn" :class="{ active: isDirty }" :disabled="isSaving || !isDirty" @click="save">
          {{ isSaving ? '保存中...' : (isDirty ? '保存' : '已保存') }}
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-show="!hasContent" class="placeholder">
      <p>← 从左侧选择或新建一个脑图文件</p>
    </div>

    <!-- 脑图编辑器 - 使用第三方库的组件 -->
    <minder-editor
      v-show="hasContent"
      :key="fileData?.path || 'empty'"
      :import-json="jsonData"
      :height="height"
      style="flex:1;overflow:hidden;"
    />
  </div>
</template>

<script>
export default {
  // 注意：不要用 MinderEditor 或 minder-editor 作为组件名
  // 因为 vue-minder-editor-extended 库已经全局注册了这个名字
  name: 'MindMapEditor',

  props: {
    fileData: Object  // { path, name, content }
  },

  data() {
    return {
      height: 600
    }
  },
  
  computed: {
    hasContent() {
      const hasContent = !!this.fileData?.content
      console.log('[MinderEditor] hasContent:', hasContent, 'fileData:', this.fileData?.path)
      return hasContent
    },
    fileName() {
      return this.fileData?.name?.replace(/\.km$/, '') || '未命名'
    },
    jsonData() {
      try {
        const data = this.fileData?.content ? JSON.parse(this.fileData.content) : null
        console.log('[MinderEditor] jsonData:', data?.root?.data?.text)
        return data
      } catch (e) {
        console.error('[MinderEditor] JSON parse error:', e)
        return null
      }
    },
    isDirty() {
      return this.fileData?.dirty || false
    },
    isSaving() {
      return this.$store.getters['files/isFileSaving']
    }
  },
  
  watch: {
    fileData: {
      handler(newVal) {
        console.log('[MinderEditor] fileData changed:', newVal?.path, newVal?.content?.length)
      },
      deep: true
    }
  },

  mounted() {
    this.calcHeight()
    window.addEventListener('resize', this.calcHeight)
    console.log('[MinderEditor] mounted, fileData:', this.fileData?.path)
  },
  
  beforeDestroy() {
    window.removeEventListener('resize', this.calcHeight)
  },
  
  methods: {
    calcHeight() {
      if (this.$el) this.height = Math.max(400, this.$el.clientHeight - 44)
    },
    save() {
      this.$store.dispatch('files/saveCurrentFile')
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
}
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}
.file-name {
  font-size: 14px;
  font-weight: 500;
}
.dirty-dot {
  width: 8px;
  height: 8px;
  background: #fd7e14;
  border-radius: 50%;
  margin-left: 8px;
}
.save-btn {
  padding: 6px 16px;
  background: #e9ecef;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.save-btn.active {
  background: #4f9cf9;
  color: #fff;
}
.save-btn:disabled {
  opacity: 0.5;
}
.placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}
</style>
