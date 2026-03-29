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

    <!-- 脑图编辑器
         v-if：无文件时不创建 minder 实例，避免多实例并存导致 window.minder 被空实例覆盖
         key 绑定文件路径：切换文件时销毁重建
         @hook:mounted：库组件 mounted 后更新 minderInstance -->
    <minder-editor
      v-if="hasContent"
      :key="fileData.path"
      :import-json="jsonData"
      :height="height"
      :disabled="isSaving"
      :priorities="['P0','P1','P2','P3','P4','P5','P6','P7','P8','P9','P10']"
      style="flex:1;overflow:hidden;"
      @hook:mounted="onMinderReady"
      @save="onLibSave"
    >
      <!-- 将附件工具栏注入到编辑菜单插槽（edit-del 之后） -->
      <template slot="edit-menu">
        <attachment-toolbar v-if="minderInstance" :minder-instance="minderInstance" />
      </template>
    </minder-editor>
  </div>
</template>

<script>
import AttachmentToolbar from './AttachmentToolbar.vue'

export default {
  // 不能用 MinderEditor / minder-editor 作为组件名
  // vue-minder-editor-extended 已全局注册了该名字
  name: 'MindMapEditor',

  components: {
    AttachmentToolbar
  },

  props: {
    fileData: Object  // { path, name, content, sha, dirty }
  },

  data() {
    return {
      height: 600,
      minderInstance: null  // 当前活跃的 minder 实例，传给 AttachmentToolbar
    }
  },

  computed: {
    hasContent() {
      return !!this.fileData && !!this.fileData.content
    },
    fileName() {
      return this.fileData && this.fileData.name
        ? this.fileData.name.replace(/\.km$/, '')
        : '未命名'
    },
    jsonData() {
      if (!this.fileData || !this.fileData.content) return null
      try {
        return JSON.parse(this.fileData.content)
      } catch (e) {
        console.error('[MindMapEditor] JSON parse error:', e)
        return null
      }
    },
    isDirty() {
      return !!(this.fileData && this.fileData.dirty)
    },
    isSaving() {
      return this.$store.getters['files/isFileSaving']
    }
  },

  watch: {
    hasContent(val) {
      if (!val) this.minderInstance = null
    }
  },

  mounted() {
    this.calcHeight()
    window.addEventListener('resize', this.calcHeight)
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.calcHeight)
    // 解绑事件，避免内存泄漏
    if (this.minderInstance) {
      this.minderInstance.off('contentchange', this._onContentChange)
      this.minderInstance.off('afterexeccommand', this._onContentChange)
    }
  },

  methods: {
    // minder-editor 库组件 mounted 后触发（@hook:mounted），此时 window.minder 已赋值
    onMinderReady() {
      const captured = window.minder
      this.minderInstance = captured
      // 延迟绑定：importJson 初始化时会触发 contentchange/afterexeccommand，需要跳过
      // 用 setTimeout 0 让初始化的事件先走完，再开始监听用户编辑
      setTimeout(() => {
        if (captured) {
          // contentchange：文字输入提交时触发
          captured.on('contentchange', this._onContentChange)
          // afterexeccommand：Tab/Delete/移动等命令操作后触发
          captured.on('afterexeccommand', this._onContentChange)
        }
      }, 0)
    },

    _onContentChange() {
      // 只标记 dirty，不导出 JSON
      // 原因：Tab/afterexeccommand 触发时节点可能处于编辑中间状态（text 为空），
      // 此时导出会保存不完整数据。最终内容在用户点保存时从 minder 实例实时导出。
      this.$store.commit('files/SET_FILE_DIRTY', true)
    },

    // 库自带保存按钮触发的 save 事件
    onLibSave() {
      // 从 minder 实例实时导出最新完整 JSON，再保存
      const minder = this.minderInstance
      if (minder) {
        try {
          const json = JSON.stringify(minder.exportJson())
          this.$store.commit('files/UPDATE_FILE_CONTENT', json)
        } catch (e) {
          console.error('[MinderEditor] 导出失败:', e)
        }
      }
      this.save()
    },

    calcHeight() {
      if (!this.$el) return
      // 动态读取顶部工具栏实际高度，而不是写死
      const toolbar = this.$el.querySelector('.editor-toolbar')
      const toolbarH = toolbar ? toolbar.offsetHeight : 44
      this.height = Math.max(400, this.$el.clientHeight - toolbarH)
    },

    async save() {
      // 如果是通过顶部工具栏按钮触发（非库按钮），也需要先导出最新 JSON
      const minder = this.minderInstance
      if (minder) {
        try {
          const json = JSON.stringify(minder.exportJson())
          this.$store.commit('files/UPDATE_FILE_CONTENT', json)
        } catch (e) {
          console.error('[MinderEditor] 导出失败:', e)
        }
      }
      try {
        await this.$store.dispatch('files/saveCurrentFile')
        this.$message({ message: '保存成功', type: 'success', duration: 1500 })
      } catch (err) {
        this.$message.error('保存失败：' + err.message)
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
  overflow: visible;
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
.toolbar-left {
  display: flex;
  align-items: center;
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

<!-- 非 scoped：覆盖库的样式 -->
<style>
/* 导航栏和预览器：固定在 viewport 内，跟随侧边栏宽度动态偏移 */
.nav-bar {
  position: fixed !important;
  bottom: 20px !important;
  left: calc(var(--sidebar-width, 276px) + 10px) !important;
}
.nav-previewer {
  position: fixed !important;
  bottom: 60px !important;
  left: calc(var(--sidebar-width, 276px) + 45px) !important;
}

/* 附件工具栏下拉菜单不被裁剪 */
.menu-container > .attachment-group {
  overflow: visible !important;
  width: auto !important;
}

/* 优先级区域父容器：允许高度自动扩展，不被裁剪 */
.mind-tab-panel .menu-container > div.sequence-group {
  overflow: visible !important;
}

/* 优先级区域：两行布局，两行左对齐
   第一行：× P0 P1 P2 P3 P4（6个，宽度 = 22 + 5×26 = 152px）
   第二行：P5 P6 P7 P8 P9（5个）
   容器宽度设 152px，P5(btn_6) 自然换行，两行左对齐
*/
.mind-tab-panel .menu-container .sequence-group {
  max-width: none !important;
  width: 152px !important;
  flex-wrap: wrap !important;
  align-content: flex-start !important;
}

/* P5：深紫红 */
.priority-btn_5[data-v-c474c6dc],
.sequence-group .priority-btn_5 {
  background-color: #A464FF !important;
  border-bottom: 3px solid #4720C4 !important;
}
.priority-btn_5[data-v-c474c6dc]:hover,
.sequence-group .priority-btn_5:hover {
  background-color: #A464FF !important;
  border-bottom: 3px solid #4720C4 !important;
  color: white !important;
}

/* P6：青色 */
.sequence-group .priority-btn_6 {
  background-color: #00BCD4 !important;
  border-bottom: 3px solid #00838F !important;
  color: white !important;
}
.sequence-group .priority-btn_6:hover {
  background-color: #00BCD4 !important;
  border-bottom: 3px solid #00838F !important;
  color: white !important;
}

/* P7：粉红 */
.sequence-group .priority-btn_7 {
  background-color: #E91E8C !important;
  border-bottom: 3px solid #9C1060 !important;
  color: white !important;
}
.sequence-group .priority-btn_7:hover {
  background-color: #E91E8C !important;
  border-bottom: 3px solid #9C1060 !important;
  color: white !important;
}

/* P8：棕色 */
.sequence-group .priority-btn_8 {
  background-color: #795548 !important;
  border-bottom: 3px solid #4E342E !important;
  color: white !important;
}
.sequence-group .priority-btn_8:hover {
  background-color: #795548 !important;
  border-bottom: 3px solid #4E342E !important;
  color: white !important;
}

/* P9（index=9，btn_9）：深灰 */
.sequence-group .priority-btn_9 {
  background-color: #607D8B !important;
  border-bottom: 3px solid #37474F !important;
  color: white !important;
}
.sequence-group .priority-btn_9:hover {
  background-color: #607D8B !important;
  border-bottom: 3px solid #37474F !important;
  color: white !important;
}

/* P9 via priorities 数组时 execCommand 传 index+1=10，对应 btn_10：橙红 */
.sequence-group .priority-btn_10 {
  background-color: #FF6B35 !important;
  border-bottom: 3px solid #C44B1A !important;
  color: white !important;
}
.sequence-group .priority-btn_10:hover {
  background-color: #FF6B35 !important;
  border-bottom: 3px solid #C44B1A !important;
  color: white !important;
}

/* P10：index=10，btn_11：深蓝紫 */
.sequence-group .priority-btn_11 {
  background-color: #5C6BC0 !important;
  border-bottom: 3px solid #3949AB !important;
  color: white !important;
}
.sequence-group .priority-btn_11:hover {
  background-color: #5C6BC0 !important;
  border-bottom: 3px solid #3949AB !important;
  color: white !important;
}
</style>
