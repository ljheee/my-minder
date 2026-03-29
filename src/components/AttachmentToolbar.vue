<template>
  <div class="attachment-group">
    <!-- 链接按钮 -->
    <div class="btn-group-vertical">
      <el-dropdown trigger="click" @command="handleLinkCommand" placement="bottom-start">
        <button type="button" class="btn btn-default hyperlink" title="链接"></button>
        <button type="button" class="btn btn-default hyperlink-caption dropdown-toggle" title="链接">
          <span class="caption">链接</span>
          <span class="caret"></span>
        </button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="insert">插入链接</el-dropdown-item>
          <el-dropdown-item command="remove" :disabled="!hasHyperlink">移除已有链接</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

    <!-- 图片按钮 -->
    <div class="btn-group-vertical">
      <el-dropdown trigger="click" @command="handleImageCommand" placement="bottom-start">
        <button type="button" class="btn btn-default image-btn" title="图片"></button>
        <button type="button" class="btn btn-default image-btn-caption dropdown-toggle" title="图片">
          <span class="caption">图片</span>
          <span class="caret"></span>
        </button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="insert">插入图片</el-dropdown-item>
          <el-dropdown-item command="remove" :disabled="!hasImage">移除已有图片</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

    <!-- 备注按钮 -->
    <div class="btn-group-vertical">
      <el-dropdown trigger="click" @command="handleNoteCommand" placement="bottom-start">
        <button type="button" class="btn btn-default note-btn" title="备注"></button>
        <button type="button" class="btn btn-default note-btn-caption dropdown-toggle" title="备注">
          <span class="caption">备注</span>
          <span class="caret"></span>
        </button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="insert">插入备注</el-dropdown-item>
          <el-dropdown-item command="remove" :disabled="!hasNote">移除已有备注</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

    <!-- 链接弹窗 -->
    <el-dialog
      title="链接"
      :visible.sync="linkDialogVisible"
      width="400px"
      append-to-body
      custom-class="attachment-dialog"
    >
      <form class="attachment-form">
        <div class="form-group" :class="{ 'has-error': !urlPassed && linkUrlTouched }">
          <label for="link-url">链接地址：</label>
          <input
            type="text"
            class="form-control"
            v-model="linkUrl"
            @blur="validateLinkUrl"
            id="link-url"
            placeholder="必填：以 http(s):// 或 ftp:// 开头"
          />
        </div>
        <div class="form-group">
          <label for="link-title">提示文本：</label>
          <input
            type="text"
            class="form-control"
            v-model="linkTitle"
            id="link-title"
            placeholder="选填：鼠标在链接上悬停时提示的文本"
          />
        </div>
      </form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="linkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="applyLink">确定</el-button>
      </div>
    </el-dialog>

    <!-- 图片弹窗 -->
    <el-dialog
      title="图片"
      :visible.sync="imageDialogVisible"
      width="500px"
      append-to-body
      custom-class="attachment-dialog"
    >
      <el-tabs v-model="imageTab">
        <el-tab-pane label="外链图片" name="url">
          <form class="attachment-form">
            <div class="form-group" :class="{ 'has-error': !imageUrlPassed && imageUrlTouched }">
              <label for="image-url">链接地址：</label>
              <input
                type="text"
                class="form-control"
                v-model="imageUrl"
                @blur="validateImageUrl"
                id="image-url"
                placeholder="必填：以 http(s):// 开头"
              />
            </div>
            <div class="form-group">
              <label for="image-title">提示文本：</label>
              <input
                type="text"
                class="form-control"
                v-model="imageTitle"
                id="image-title"
                placeholder="选填：鼠标在图片上悬停时提示的文本"
              />
            </div>
            <div class="form-group" v-if="imageUrl && imageUrlPassed">
              <label>图片预览：</label>
              <div class="image-preview">
                <img :src="imageUrl" :alt="imageTitle" @error="imageUrlPassed = false" />
              </div>
            </div>
          </form>
        </el-tab-pane>
        <el-tab-pane label="上传图片" name="upload">
          <form class="attachment-form">
            <div class="form-group">
              <label>选择文件：</label>
              <input
                type="file"
                id="upload-image"
                class="upload-input"
                accept=".jpg,.JPG,.jpeg,.JPEG,.png,.PNG,.gif,.GIF"
                @change="handleImageSelect"
              />
              <label for="upload-image" class="upload-btn">
                <span>选择文件...</span>
              </label>
              <span class="upload-name" v-if="selectedFileName">{{ selectedFileName }}</span>
            </div>
            <div class="form-group">
              <label for="image-title-upload">提示文本：</label>
              <input
                type="text"
                class="form-control"
                v-model="imageTitle"
                id="image-title-upload"
                placeholder="选填：鼠标在图片上悬停时提示的文本"
              />
            </div>
            <div class="form-group" v-if="imagePreview">
              <label>图片预览：</label>
              <div class="image-preview">
                <img :src="imagePreview" :alt="imageTitle" />
              </div>
            </div>
          </form>
        </el-tab-pane>
      </el-tabs>
      <div slot="footer" class="dialog-footer">
        <el-button @click="imageDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="applyImage">确定</el-button>
      </div>
    </el-dialog>

    <!-- 备注侧边面板（fixed 定位，从右侧滑入） -->
    <!-- 遮罩层：淡入淡出 -->
    <transition name="note-overlay">
      <div v-if="noteDialogVisible" class="note-side-overlay" @click.self="noteDialogVisible = false"></div>
    </transition>
    <!-- 面板主体：从右侧滑入 -->
    <transition name="note-slide">
      <div v-if="noteDialogVisible" class="note-panel-inner">
        <div class="note-panel-header">
          <span class="note-panel-title">备注</span>
          <button class="note-panel-close" @click="noteDialogVisible = false">×</button>
        </div>
        <div class="note-panel-body">
          <textarea
            ref="noteTextarea"
            class="note-panel-textarea"
            v-model="noteContent"
            placeholder="请输入备注内容..."
          ></textarea>
        </div>
        <div class="note-panel-footer">
          <button class="note-footer-btn note-footer-cancel" @click="noteDialogVisible = false">取消</button>
          <button class="note-footer-btn note-footer-save" :disabled="!noteChanged" @click="applyNote">保存</button>
        </div>
      </div>
    </transition>

    <!-- 备注预览 tooltip（hover 备注图标时显示） -->
    <div v-if="noteTooltipVisible" class="note-tooltip" :style="noteTooltipStyle">
      <div class="note-tooltip-text">{{ noteTooltipContent }}</div>
    </div>
  </div>
</template>

<script>
// URL 验证正则表达式（与百度脑图一致）
const URL_REGEX = /^(?!mailto:)(?:(?:http|https|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:(\/|\?|#)[^\s]*)?$/i

export default {
  name: 'AttachmentToolbar',

  props: {
    // 由父组件传入当前活跃的 minder 实例，避免依赖 window.minder（可能指向旧实例）
    minderInstance: {
      type: Object,
      default: null
    }
  },

  data() {
    return {
      // 操作时锁定的目标节点（弹窗打开时记录，防止弹窗抢焦点后 selection 丢失）
      targetNode: null,

      // 链接
      linkDialogVisible: false,
      linkUrl: '',
      linkTitle: '',
      linkUrlTouched: false,
      urlPassed: true,

      // 图片
      imageDialogVisible: false,
      imageTab: 'url',
      imageUrl: '',
      imageTitle: '',
      imagePreview: '',
      imageDataUrl: '',
      selectedFileName: '',
      imageUrlTouched: false,
      imageUrlPassed: true,

      // 备注
      noteDialogVisible: false,
      noteContent: '',
      originalNote: '',  // 打开面板时的原始内容，用于判断是否有变化

      // 备注预览 tooltip
      noteTooltipVisible: false,
      noteTooltipContent: '',
      noteTooltipStyle: {},
    }
  },

  computed: {
    minder() {
      // 优先使用父组件传入的实例，如果没有则回退到 window.minder
      return this.minderInstance || window.minder
    },
    selectedNode() {
      return this.minder?.getSelectedNode()
    },
    hasHyperlink() {
      return this.selectedNode?.getData('hyperlink')
    },
    hasImage() {
      return this.selectedNode?.getData('image')
    },
    hasNote() {
      return this.selectedNode?.getData('note')
    },
    // 备注内容是否有实质变化（非空且与原始内容不同）
    noteChanged() {
      return this.noteContent.trim() !== '' && this.noteContent !== this.originalNote
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.moveToCorrectPosition()
      this.bindMinderNoteEvents()
    })
  },

  updated() {
    this.$nextTick(() => {
      this.moveToCorrectPosition()
    })
  },

  beforeDestroy() {
    this.unbindMinderNoteEvents()
  },

  methods: {
    // 将附件工具栏移动到正确位置（编辑/删除后面，优先级前面）
    moveToCorrectPosition() {
      const menuContainer = document.querySelector('.menu-container')
      if (!menuContainer) return

      const attachmentGroup = this.$el
      if (!attachmentGroup || !menuContainer.contains(attachmentGroup)) return

      // 查找 edit-del-group（编辑/删除按钮组）
      const editDelGroup = menuContainer.querySelector('.edit-del-group')

      if (editDelGroup && attachmentGroup.previousElementSibling !== editDelGroup) {
        // 将附件工具栏移动到编辑/删除按钮组后面
        if (editDelGroup.nextSibling) {
          menuContainer.insertBefore(attachmentGroup, editDelGroup.nextSibling)
        } else {
          menuContainer.appendChild(attachmentGroup)
        }
      }
    },

    // ========== minder 备注事件绑定 ==========
    // 计算 tooltip 位置，确保不超出屏幕边界
    _calcTooltipPos(mouseX, mouseY) {
      const W = window.innerWidth
      const H = window.innerHeight
      const OFFSET = 14
      // 用实际 DOM 尺寸，避免估算偏差
      const el = this.$el?.querySelector('.note-tooltip')
      // offsetWidth 在首次渲染前可能为 0，用 max-width 作为上限估算
      const TW = (el && el.offsetWidth > 0) ? el.offsetWidth : 180
      const TH = (el && el.offsetHeight > 0) ? el.offsetHeight : 80
      let left = mouseX + OFFSET
      let top = mouseY + OFFSET
      // 右侧放不下时，放到鼠标左侧
      if (left + TW > W - 8) left = mouseX - TW - OFFSET
      // 下方放不下时，放到鼠标上方
      if (top + TH > H - 8) top = mouseY - TH - OFFSET
      if (left < 8) left = 8
      if (top < 8) top = 8
      return { left: left + 'px', top: top + 'px', bottom: 'auto', transform: 'none' }
    },

    bindMinderNoteEvents() {
      const minder = this.minder
      if (!minder) return
      // 跟踪鼠标位置：同时监听 document 和 minder canvas，确保坐标始终准确
      this._mouseX = 0
      this._mouseY = 0
      this._onMouseMove = (ev) => {
        // kity 事件有 originEvent，原生 DOM 事件直接有 clientX
        const clientX = ev.clientX ?? ev.originEvent?.clientX ?? 0
        const clientY = ev.clientY ?? ev.originEvent?.clientY ?? 0
        if (!clientX && !clientY) return
        this._mouseX = clientX
        this._mouseY = clientY
        // tooltip 显示中时实时更新位置
        if (this.noteTooltipVisible) {
          this.noteTooltipStyle = this._calcTooltipPos(clientX, clientY)
        }
      }
      // mousemove + mouseover 双保险：mouseover 解决鼠标直接移入图标时 mousemove 不触发的问题
      document.addEventListener('mousemove', this._onMouseMove)
      document.addEventListener('mouseover', this._onMouseMove)
      try {
        const paper = minder.getPaper()
        if (paper) {
          this._minderPaper = paper
          paper.on('mousemove mouseover', this._onMouseMove)
        }
      } catch (err) { /* ignore */ }
      this._onEditNoteRequest = () => {
        const node = minder.getSelectedNode()
        if (node) {
          this.targetNode = node
          this.noteContent = node.getData('note') || ''
          this.originalNote = this.noteContent  // 记录原始内容，确保 noteChanged 计算正确
          this.noteDialogVisible = true
          this.$nextTick(() => {
            if (this.$refs.noteTextarea) this.$refs.noteTextarea.focus()
          })
        }
      }
      this._onShowNoteRequest = (e) => {
        if (!e || !e.node) return
        this.noteTooltipContent = e.node.getData('note') || ''
        // 1. 优先用 mousemove 实时记录的鼠标坐标
        let x = this._mouseX
        let y = this._mouseY
        // 2. 从事件的 originEvent 取（kity 事件携带原生 DOM 事件）
        if (!x || !y) {
          const oe = e.originEvent || e.nativeEvent
          if (oe && oe.clientX) { x = oe.clientX; y = oe.clientY }
        }
        // 3. 兜底：从 icon SVG 元素的 BoundingClientRect 取中心点
        if (!x || !y) {
          try {
            const svgEl = e.icon && (e.icon.node || e.icon.getNode?.())
            if (svgEl) {
              const rect = svgEl.getBoundingClientRect()
              x = rect.left + rect.width / 2
              y = rect.top + rect.height / 2
            }
          } catch (err) { /* ignore */ }
        }
        // 先用估算位置显示，nextTick 后用实际 DOM 尺寸精确定位
        this.noteTooltipStyle = this._calcTooltipPos(x, y)
        this.noteTooltipVisible = true
        this._tooltipAnchorX = x
        this._tooltipAnchorY = y
        this.$nextTick(() => {
          if (this.noteTooltipVisible) {
            this.noteTooltipStyle = this._calcTooltipPos(this._tooltipAnchorX, this._tooltipAnchorY)
          }
        })
      }
      this._onHideNoteRequest = () => {
        this.noteTooltipVisible = false
      }
      minder.on('editnoterequest', this._onEditNoteRequest)
      minder.on('shownoterequest', this._onShowNoteRequest)
      minder.on('hidenoterequest', this._onHideNoteRequest)

      // DOM 级别 fallback：直接在 SVG note 图标上绑定 mouseenter/mouseleave
      // 解决 kity 事件系统在某些环境下不触发 shownoterequest 的问题
      this._bindDomNoteIcons()
      this._onLayoutDone = () => { this._bindDomNoteIcons() }
      minder.on('layoutallfinish layout', this._onLayoutDone)
    },

    // 扫描 SVG 里所有 note 图标，直接绑定 DOM mouseenter/mouseleave
    _bindDomNoteIcons() {
      try {
        const minder = this.minder
        if (!minder) return
        const paper = minder.getPaper()
        const svgEl = paper && (paper.container || paper.node)
        if (!svgEl) return

        // 找所有已绑定了 kity mouseover 的小 g 元素（note 图标）
        // kity 图标的特征：宽高 < 30px，且节点有 note 数据
        const allNodes = minder.getAllNode ? minder.getAllNode() : []
        allNodes.forEach(node => {
          if (!node.getData('note')) return
          // 找该节点的 note 图标 DOM 元素
          // kity 把图标渲染为 node.rc（render container）下的子 g 元素
          const rc = node.rc
          if (!rc) return
          const iconEls = rc.node ? rc.node.querySelectorAll('g') : []
          iconEls.forEach(el => {
            const rect = el.getBoundingClientRect()
            if (rect.width > 0 && rect.width < 30 && rect.height > 0 && rect.height < 30) {
              if (!el._noteIconBound) {
                el._noteIconBound = true
                el.addEventListener('mouseenter', (ev) => {
                  // 如果 shownoterequest 已经处理了（noteTooltipVisible=true），不重复处理
                  if (this.noteTooltipVisible) return
                  this._mouseX = ev.clientX
                  this._mouseY = ev.clientY
                  this._onShowNoteRequest({ node, icon: null })
                })
                el.addEventListener('mouseleave', () => {
                  this._onHideNoteRequest()
                })
              }
            }
          })
        })
      } catch (err) { /* ignore */ }
    },

    unbindMinderNoteEvents() {
      const minder = this.minder
      if (!minder) return
      if (this._onEditNoteRequest) minder.off('editnoterequest', this._onEditNoteRequest)
      if (this._onShowNoteRequest) minder.off('shownoterequest', this._onShowNoteRequest)
      if (this._onHideNoteRequest) minder.off('hidenoterequest', this._onHideNoteRequest)
      if (this._onLayoutDone) minder.off('layoutallfinish layout', this._onLayoutDone)
      if (this._onMouseMove) {
        document.removeEventListener('mousemove', this._onMouseMove)
        document.removeEventListener('mouseover', this._onMouseMove)
      }
      if (this._minderPaper && this._onMouseMove) {
        try { this._minderPaper.off('mousemove mouseover', this._onMouseMove) } catch (err) { /* ignore */ }
      }
    },

    // ========== 链接 ==========
    handleLinkCommand(command) {
      if (command === 'insert') {
        this.showLinkDialog()
      } else if (command === 'remove') {
        this.removeLink()
      }
    },

    showLinkDialog() {
      if (!this.checkSelection()) return
      this.targetNode = this.minder.getSelectedNode()
      this.linkUrl = this.targetNode.getData('hyperlink') || ''
      this.linkTitle = this.targetNode.getData('hyperlinkTitle') || ''
      this.linkUrlTouched = false
      this.urlPassed = true
      this.linkDialogVisible = true
    },

    validateLinkUrl() {
      this.linkUrlTouched = true
      this.urlPassed = URL_REGEX.test(this.linkUrl)
    },

    applyLink() {
      this.validateLinkUrl()
      if (!this.urlPassed) {
        this.$message.error('请输入有效的链接地址')
        return
      }

      // 确保使用 https:// 或 http:// 开头的 URL
      let url = this.linkUrl
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }

      // 恢复节点选中并确保 minder 获得焦点（弹窗关闭后焦点丢失会导致 execCommand 无效）
      this.restoreFocusAndSelect()

      // 使用 minder 的 execCommand
      this.minder.execCommand('hyperlink', url, this.linkTitle)

      this.linkDialogVisible = false
      this.$message.success('链接已添加')
    },

    removeLink() {
      this.minder.execCommand('hyperlink', null)
      this.$message.success('链接已移除')
    },

    // ========== 图片 ==========
    handleImageCommand(command) {
      if (command === 'insert') {
        this.showImageDialog()
      } else if (command === 'remove') {
        this.removeImage()
      }
    },

    showImageDialog() {
      if (!this.checkSelection()) return
      this.targetNode = this.minder.getSelectedNode()
      this.imageUrl = this.targetNode.getData('image') || ''
      this.imageTitle = this.targetNode.getData('imageTitle') || ''
      this.imagePreview = this.imageUrl
      this.imageDataUrl = ''
      this.selectedFileName = ''
      this.imageTab = 'url'
      this.imageUrlTouched = false
      this.imageUrlPassed = /^https?:\/\/\w+/.test(this.imageUrl)
      this.imageDialogVisible = true
    },

    validateImageUrl() {
      this.imageUrlTouched = true
      this.imageUrlPassed = /^https?:\/\/\w+/.test(this.imageUrl)
    },

    handleImageSelect(event) {
      const file = event.target.files[0]
      if (!file) return

      const isImage = file.type.startsWith('image/')
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isImage) {
        this.$message.error('只能上传图片文件!')
        return
      }
      if (!isLt2M) {
        this.$message.error('图片大小不能超过 2MB!')
        return
      }

      this.selectedFileName = file.name

      const reader = new FileReader()
      reader.onload = (e) => {
        this.imageDataUrl = e.target.result
        this.imagePreview = e.target.result
        this.imageUrlPassed = true
      }
      reader.readAsDataURL(file)
    },

    applyImage() {
      const imageUrl = this.imageTab === 'upload' ? this.imageDataUrl : this.imageUrl

      if (!imageUrl) {
        this.$message.warning('请选择图片或输入图片地址')
        return
      }

      if (this.imageTab === 'url') {
        this.validateImageUrl()
        if (!this.imageUrlPassed) {
          this.$message.error('请输入有效的图片地址')
          return
        }
      }

      // 恢复节点选中并确保 minder 获得焦点
      this.restoreFocusAndSelect()

      // 使用库的 Image 命令（它会自动处理图片尺寸，并触发完整渲染流程）
      this.minder.execCommand('image', imageUrl, this.imageTitle)

      this.imageDialogVisible = false
      this.$message.success('图片已添加')
    },

    removeImage() {
      this.minder.execCommand('image', null)
      this.$message.success('图片已移除')
    },

    // ========== 备注 ==========
    handleNoteCommand(command) {
      if (command === 'insert') {
        this.showNoteDialog()
      } else if (command === 'remove') {
        this.removeNote()
      }
    },

    showNoteDialog() {
      if (!this.checkSelection()) return
      this.targetNode = this.minder.getSelectedNode()
      this.noteContent = this.targetNode.getData('note') || ''
      this.originalNote = this.noteContent  // 记录原始内容
      this.noteDialogVisible = true
      // 面板打开后聚焦 textarea
      this.$nextTick(() => {
        if (this.$refs.noteTextarea) this.$refs.noteTextarea.focus()
      })
    },

    applyNote() {
      if (!this.noteContent.trim()) {
        this.$message.warning('请输入备注内容')
        return
      }

      // 恢复节点选中并确保 minder 获得焦点
      this.restoreFocusAndSelect()

      // 直接操作节点数据并触发渲染，避免 execCommand 在弹窗关闭时序下的渲染问题
      const node = this.targetNode
      if (!node) return
      node.setData('note', this.noteContent)
      if (node.attached) {
        node.render()
        this.minder.layout(300)
        // 触发 contentchange 让历史记录和保存状态更新
        this.minder._firePharse({ type: 'contentchange' })
        this.minder._interactChange()
      }

      this.noteDialogVisible = false
      this.$message.success('备注已添加')
    },

    removeNote() {
      this.minder.execCommand('note', null)
      this.$message.success('备注已移除')
    },

    // 恢复 minder 焦点和节点选中（弹窗关闭后焦点丢失时使用）
    restoreFocusAndSelect() {
      // 恢复节点选中
      if (this.targetNode) {
        this.minder.select(this.targetNode, true)
      }
      // 调用 minder 自身的 focus() 方法恢复焦点状态
      this.minder.focus()
    },

    // ========== 通用 ==========
    checkSelection() {
      if (!this.minder) {
        this.$message.warning('编辑器未初始化')
        return false
      }
      if (this.minder.getSelectedNodes().length === 0) {
        this.$message.warning('请先选择一个节点')
        return false
      }
      return true
    }
  }
}
</script>

<style scoped>
/* 附件按钮组容器 - 与库中其他组件风格一致 */
.attachment-group {
  display: flex;
  align-items: center;
  padding: 4px 5px;
  line-height: 12px;
  overflow: visible !important;
}

/* 每个按钮组（图标+文字+下拉箭头） */
.attachment-group > .btn-group-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 0 5px;
  min-width: 40px;
}

/* 按钮基础样式 */
.attachment-group .btn {
  display: inline-block;
  padding: 4px 8px;
  margin-bottom: 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.42857143;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  background-image: none;
  border: 1px solid transparent;
  border-radius: 4px;
  background-color: transparent;
}

.attachment-group .btn:hover {
  background-color: #e6e6e6;
}

.attachment-group .btn:active {
  background-color: #d4d4d4;
}

/* 图标按钮 */
.attachment-group .btn-default {
  background-image: url('~vue-minder-editor-extended/src/assets/minder/icons.png');
  background-repeat: no-repeat;
  background-position: 50% -100px;
  width: 20px;
  height: 20px;
  padding: 0;
  margin: 0 auto;
  display: block;
  background-color: transparent;
}

/* 链接图标 */
.attachment-group .hyperlink {
  background-position: 50% -100px;
}

/* 图片图标 */
.attachment-group .image-btn {
  background-position: 50% -125px;
}

/* 备注图标 */
.attachment-group .note-btn {
  background-position: 50% -1150px;
}

/* 文字按钮（带下拉箭头） */
.attachment-group .dropdown-toggle {
  width: auto;
  background-image: none;
  padding: 2px 4px;
  font-size: 12px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  background-color: transparent;
}

.attachment-group .dropdown-toggle .caption {
  color: #333;
}

.attachment-group .dropdown-toggle:hover .caption {
  color: #000;
}

/* 下拉箭头 */
.attachment-group .caret {
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: 4px;
  vertical-align: middle;
  border-top: 4px dashed;
  border-top: 4px solid \9;
  border-right: 4px solid transparent;
  border-left: 4px solid transparent;
}

/* 弹窗表单样式 */
.attachment-form .form-group {
  margin-bottom: 15px;
}

.attachment-form label {
  display: block;
  margin-bottom: 5px;
  font-size: 13px;
  color: #333;
}

.attachment-form .form-control {
  width: 100%;
  height: 34px;
  padding: 6px 12px;
  font-size: 14px;
  line-height: 1.42857143;
  color: #555;
  background-color: #fff;
  background-image: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, .075);
  transition: border-color ease-in-out .15s, box-shadow ease-in-out .15s;
  box-sizing: border-box;
}

.attachment-form .form-control:focus {
  border-color: #66afe9;
  outline: 0;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, .075), 0 0 8px rgba(102, 175, 233, .6);
}

.attachment-form .form-group.has-error .form-control {
  border-color: #a94442;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, .075);
}

.attachment-form .textarea {
  height: auto;
  min-height: 120px;
  resize: vertical;
}

/* 图片预览 */
.image-preview {
  max-width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  background: #f9f9f9;
  text-align: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
}

/* 上传按钮 */
.upload-input {
  display: none;
}

.upload-btn {
  display: inline-block;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.42857143;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  background-image: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  color: #333;
  background-color: #fff;
}

.upload-btn:hover {
  background-color: #e6e6e6;
  border-color: #adadad;
}

.upload-name {
  margin-left: 10px;
  font-size: 13px;
  color: #666;
}

/* 弹窗底部按钮 */
.dialog-footer {
  text-align: right;
}

/* ===== 备注侧边面板 ===== */

/* 半透明遮罩层 */
.note-side-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.25);
}

/* 遮罩淡入淡出 */
.note-overlay-enter-active,
.note-overlay-leave-active {
  transition: opacity 0.25s ease;
}
.note-overlay-enter,
.note-overlay-leave-to {
  opacity: 0;
}

/* 面板主体：从右侧滑入，fixed 定位脱离文档流 */
.note-panel-inner {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.18);
  z-index: 2001;
}

/* 面板滑入/滑出动画 */
.note-slide-enter-active,
.note-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.note-slide-enter,
.note-slide-leave-to {
  transform: translateX(100%);
}
.note-slide-enter-to,
.note-slide-leave {
  transform: translateX(0);
}

/* 面板头部 */
.note-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.note-panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.note-panel-close {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 20px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  line-height: 1;
  padding: 0;
}

.note-panel-close:hover {
  background: #f5f5f5;
  color: #333;
}

/* 面板内容区 */
.note-panel-body {
  flex: 1;
  padding: 16px 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.note-panel-textarea {
  flex: 1;
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  resize: none;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.note-panel-textarea:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
}

/* 面板底部按钮区 */
.note-panel-footer {
  padding: 12px 20px 16px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

/* 底部按钮基础样式
   用 ::v-deep 穿透 scoped，确保选择器命中原生 button 元素 */
.note-panel-footer ::v-deep button {
  height: 32px !important;
  min-height: 32px !important;
  width: auto !important;
  min-width: 56px !important;
  max-width: none !important;
  padding: 0 16px !important;
  font-size: 13px !important;
  border-radius: 5px !important;
  cursor: pointer !important;
  border: 1px solid transparent !important;
  background: transparent !important;
  transition: background 0.18s, border-color 0.18s, color 0.18s !important;
  font-family: inherit !important;
  line-height: 1 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  white-space: nowrap !important;
  box-sizing: border-box !important;
  outline: none !important;
  flex-shrink: 0 !important;
}

/* 取消按钮：有边框，hover 加深 */
.note-panel-footer ::v-deep button.note-footer-cancel {
  color: #606266 !important;
  border-color: #dcdfe6 !important;
}
.note-panel-footer ::v-deep button.note-footer-cancel:hover {
  color: #409eff !important;
  border-color: #c6e2ff !important;
  background: #ecf5ff !important;
}

/* 保存按钮：disabled 时灰色不可点击，有内容变化时蓝色可点击 */
.note-panel-footer ::v-deep button.note-footer-save:disabled {
  color: #c0c4cc !important;
  border-color: #e4e7ed !important;
  background: transparent !important;
  cursor: not-allowed !important;
}
.note-panel-footer ::v-deep button.note-footer-save:not(:disabled) {
  color: #409eff !important;
  border-color: #409eff !important;
  background: transparent !important;
}
.note-panel-footer ::v-deep button.note-footer-save:not(:disabled):hover {
  background: #ecf5ff !important;
  border-color: #66b1ff !important;
}
.note-panel-footer ::v-deep button.note-footer-save:not(:disabled):active {
  background: #d9ecff !important;
  border-color: #3a8ee6 !important;
  color: #3a8ee6 !important;
}

/* ===== 备注预览 tooltip ===== */
.note-tooltip {
  position: fixed;
  z-index: 9999;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 6px;
  padding: 8px 12px;
  max-width: 180px;
  /* 最多显示约 5 行 */
  max-height: calc(13px * 1.5 * 5 + 16px);
  overflow: hidden;
  box-sizing: border-box;
  /* 防止被 flex 父容器拉伸高度 */
  align-self: flex-start;
  height: auto !important;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
  pointer-events: none;
  /* 位置由 JS _calcTooltipPos 动态注入 */
}

.note-tooltip-text {
  margin: 0;
  padding: 0;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  color: #333;
}
</style>

