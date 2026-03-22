<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* 全局重置 */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Element UI 全局样式覆盖 */
.el-dialog {
  border-radius: 12px !important;
}

.el-dialog__header {
  padding: 20px 24px 12px !important;
}

.el-dialog__title {
  font-size: 16px !important;
  font-weight: 600 !important;
}

.el-dialog__body {
  padding: 12px 24px 20px !important;
}

.el-dialog__footer {
  padding: 12px 24px 20px !important;
  border-top: 1px solid #f0f0f0;
}

.el-message {
  border-radius: 8px !important;
}

/* 自定义仓库选择弹窗 */
.repo-dialog .el-dialog__body {
  padding: 8px 24px 16px !important;
}
</style>
