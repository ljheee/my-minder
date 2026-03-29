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

    <!-- 备注弹窗 -->
    <el-dialog
      title="备注"
      :visible.sync="noteDialogVisible"
      width="500px"
      append-to-body
      custom-class="attachment-dialog"
    >
      <form class="attachment-form">
        <div class="form-group">
          <label>备注内容：</label>
          <textarea
            class="form-control textarea"
            v-model="noteContent"
            rows="6"
            placeholder="请输入备注内容..."
          ></textarea>
        </div>
      </form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="noteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="applyNote">确定</el-button>
      </div>
    </el-dialog>
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
    }
  },

  mounted() {
    // 在组件挂载后，将元素移动到正确的位置
    this.$nextTick(() => {
      this.moveToCorrectPosition()
    })
  },

  updated() {
    // 组件更新时也检查位置
    this.$nextTick(() => {
      this.moveToCorrectPosition()
    })
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
      this.noteDialogVisible = true
    },

    applyNote() {
      if (!this.noteContent.trim()) {
        this.$message.warning('请输入备注内容')
        return
      }

      // 恢复节点选中并确保 minder 获得焦点
      this.restoreFocusAndSelect()

      // 使用 execCommand 触发完整的渲染流程（包括 contentchange 事件和图标渲染）
      this.minder.execCommand('note', this.noteContent)

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
</style>

