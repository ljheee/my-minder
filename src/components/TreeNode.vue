<template>
  <div class="tree-node">
    <!-- 节点行 -->
    <div
      class="node-row"
      :class="{
        active: isCurrentFile,
        'is-dir': isDir
      }"
      :style="{ paddingLeft: (depth * 16 + 8) + 'px' }"
      @click="handleClick"
      @contextmenu.prevent="showContextMenu"
    >
      <!-- 展开/折叠箭头（仅目录） -->
      <span v-if="isDir" class="expand-arrow" :class="{ expanded: isExpanded }">
        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
          <path d="M10 17l5-5-5-5v10z"/>
        </svg>
      </span>
      <span v-else class="expand-placeholder"></span>

      <!-- 图标 -->
      <span class="node-icon" :class="{ 'node-icon--xmind': isXmindFile }">
        <svg v-if="isDir" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path v-if="isExpanded" d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
          <path v-else d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
        </svg>
        <!-- .xmind 文件用带标记的图标区分 -->
        <svg v-else-if="isXmindFile" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-5-5l-2-2-2 2-1-1 2-2-2-2 1-1 2 2 2-2 1 1-2 2 2 2-1 1z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
        </svg>
      </span>

      <!-- 文件名 -->
      <span class="node-name" :title="item.name">
        {{ displayName }}
      </span>

      <!-- 最近修改时间（仅文件） -->
      <span v-if="!isDir && item.lastCommitTime" class="node-time" :title="item.lastCommitTime">
        {{ formatTime(item.lastCommitTime) }}
      </span>

      <!-- 加载指示器（目录展开时） -->
      <span v-if="isDir && isLoading" class="node-loading">
        <div class="mini-spinner"></div>
      </span>

      <!-- 操作按钮（hover 时显示） -->
      <div class="node-actions" @click.stop>
        <button v-if="isDir" class="action-btn" title="新建脑图" @click="$emit('new-file', item.path)">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
        </button>
        <button v-if="isDir" class="action-btn" title="新建文件夹" @click="$emit('new-folder', item.path)">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10zm-8-1h2v-3h3v-2h-3V9h-2v3H9v2h3z"/></svg>
        </button>
        <!-- 导出 xmind（.km 文件导出为 .xmind；.xmind 文件本身就是 xmind 格式，不需要导出按鈕） -->
        <button v-if="!isDir && item.name.endsWith('.km')" class="action-btn" title="导出为 .xmind" :disabled="isExporting" @click="handleExportXmind">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/></svg>
        </button>
        <button class="action-btn" title="重命名" @click="$emit('rename', item)">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
        <button v-if="!isDir" class="action-btn" title="移动" @click="$emit('move', item)">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/></svg>
        </button>
        <button class="action-btn action-btn--danger" title="删除" @click="$emit('delete', item)">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
    </div>

    <!-- 子节点（目录展开时） -->
    <div v-if="isDir && isExpanded" class="node-children">
      <div v-if="isLoading" class="children-loading">
        <div class="mini-spinner"></div>
        <span>加载中...</span>
      </div>
      <template v-else-if="childItems.length > 0">
        <tree-node
          v-for="child in childItems"
          :key="child.path"
          :item="child"
          :current-file-path="currentFilePath"
          :depth="depth + 1"
          @open-file="$emit('open-file', $event)"
          @new-file="$emit('new-file', $event)"
          @new-folder="$emit('new-folder', $event)"
          @rename="$emit('rename', $event)"
          @delete="$emit('delete', $event)"
          @move="$emit('move', $event)"
        />
      </template>
      <div v-else class="children-empty">
        <span>空文件夹</span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { kmStringToXmindDownload } from '@/utils/xmindConverter'
import { getFileContent } from '@/api'

export default {
  name: 'TreeNode',

  // 递归组件需要显式声明 name
  components: {
    TreeNode: () => import('./TreeNode.vue')
  },

  props: {
    item: {
      type: Object,
      required: true
    },
    currentFilePath: {
      type: String,
      default: null
    },
    depth: {
      type: Number,
      default: 0
    }
  },

  data() {
    return {
      isExpanded: false,
      isExporting: false
    }
  },

  computed: {
    ...mapGetters('files', ['getDir']),

    isDir() {
      return this.item.type === 'dir'
    },

    isCurrentFile() {
      return !this.isDir && this.item.path === this.currentFilePath
    },

    // 是否是 .xmind 文件
    isXmindFile() {
      return !this.isDir && this.item.name.toLowerCase().endsWith('.xmind')
    },

    // 文件显示名（.km 和 .xmind 文件去掉后缀）
    displayName() {
      if (!this.isDir) {
        if (this.item.name.endsWith('.km')) return this.item.name.slice(0, -3)
        if (this.isXmindFile) return this.item.name.slice(0, -6)
      }
      // 隐藏 .gitkeep 文件
      return this.item.name
    },

    // 是否是隐藏文件（.gitkeep）
    isHidden() {
      return this.item.name === '.gitkeep'
    },

    dirState() {
      return this.getDir(this.item.path)
    },

    childItems() {
      // 过滤掉 .gitkeep 占位文件
      return (this.dirState.items || []).filter(i => i.name !== '.gitkeep')
    },

    isLoading() {
      return this.dirState.loading
    }
  },

  methods: {
    ...mapActions('files', ['loadDir']),

    handleClick() {
      if (this.isDir) {
        this.toggleExpand()
      } else if (this.item.name.endsWith('.km') || this.isXmindFile) {
        this.$emit('open-file', { path: this.item.path, name: this.item.name })
      }
    },

    async toggleExpand() {
      this.isExpanded = !this.isExpanded
      if (this.isExpanded && !this.dirState.loaded) {
        try {
          await this.loadDir(this.item.path)
        } catch (err) {
          this.$message.error('加载目录失败')
          this.isExpanded = false
        }
      }
    },

    showContextMenu() {
      // 右键菜单（简单实现，直接触发对应操作）
      // 可以后续扩展为真正的右键菜单
    },

    /** 导出当前 .km 文件为 .xmind 并下载 */
    async handleExportXmind() {
      if (this.isExporting) return
      this.isExporting = true
      try {
        const owner = this.$store.getters['auth/owner']
        const repo  = this.$store.getters['auth/repoName']
        // 从 GitHub 读取最新内容
        const file = await getFileContent(owner, repo, this.item.path)
        const filename = this.item.name.replace(/\.km$/, '')
        await kmStringToXmindDownload(file.content, filename)
        this.$message({ message: `已导出 ${filename}.xmind`, type: 'success', duration: 1500 })
      } catch (err) {
        console.error('[TreeNode] 导出 xmind 失败:', err)
        this.$message.error('导出失败：' + (err.message || err))
      } finally {
        this.isExporting = false
      }
    },

    /** 格式化时间：显示为相对时间（如「3天前」）或日期 */
    formatTime(isoStr) {
      if (!isoStr) return ''
      const now = Date.now()
      const t = new Date(isoStr).getTime()
      const diff = now - t
      const min  = 60 * 1000
      const hour = 60 * min
      const day  = 24 * hour
      if (diff < hour)  return `${Math.floor(diff / min)}分钟前`
      if (diff < day)   return `${Math.floor(diff / hour)}小时前`
      if (diff < 7 * day) return `${Math.floor(diff / day)}天前`
      // 超过 7 天显示日期
      const d = new Date(isoStr)
      return `${d.getMonth() + 1}/${d.getDate()}`
    }
  }
}
</script>

<style scoped>
.tree-node {
  /* 隐藏 .gitkeep 文件 */
}

.node-row {
  display: flex;
  align-items: center;
  height: 28px;
  cursor: pointer;
  border-radius: 6px;
  margin: 1px 4px;
  padding-right: 4px;
  transition: background 0.1s;
  position: relative;
}

.node-row:hover {
  background: rgba(255, 255, 255, 0.06);
}

.node-row.active {
  background: rgba(137, 180, 250, 0.15);
}

.node-row.active .node-name {
  color: #89b4fa;
}

.expand-arrow {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c7086;
  flex-shrink: 0;
  transition: transform 0.15s;
}

.expand-arrow.expanded {
  transform: rotate(90deg);
}

.expand-placeholder {
  width: 16px;
  flex-shrink: 0;
}

.node-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 4px;
  color: #89b4fa;
}

.is-dir .node-icon {
  color: #f9e2af;
}

/* .xmind 文件用橙色图标区分 */
.node-icon--xmind {
  color: #fab387;
}

.node-name {
  flex: 1;
  font-size: 13px;
  color: #cdd6f4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1;
}

.node-time {
  font-size: 10px;
  color: #45475a;
  white-space: nowrap;
  flex-shrink: 0;
  margin-right: 2px;
  transition: color 0.1s;
}

.node-row:hover .node-time {
  color: #6c7086;
}

.node-loading {
  margin-left: 4px;
}

.mini-spinner {
  width: 12px;
  height: 12px;
  border: 1.5px solid rgba(137, 180, 250, 0.2);
  border-top-color: #89b4fa;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 操作按钮（默认隐藏，hover 时显示） */
.node-actions {
  display: none;
  align-items: center;
  gap: 1px;
  flex-shrink: 0;
}

.node-row:hover .node-actions {
  display: flex;
}

.action-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 4px;
  color: #6c7086;
  cursor: pointer;
  padding: 0;
  transition: all 0.1s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #cdd6f4;
}

.action-btn--danger:hover {
  background: rgba(243, 139, 168, 0.15);
  color: #f38ba8;
}

.action-btn svg {
  width: 12px;
  height: 12px;
}

/* 子节点 */
.node-children {
  /* 子节点通过 padding-left 实现缩进 */
}

.children-loading,
.children-empty {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px 6px 32px;
  color: #6c7086;
  font-size: 12px;
}
</style>
