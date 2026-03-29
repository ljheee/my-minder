const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  // 生产环境输出到 dist 目录（Vercel 自动识别）
  outputDir: 'dist',
  // 开发环境代理，将 /api 请求转发到本地 Vercel dev 服务
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    },
    // 关闭 webpack overlay 弹窗：
    // 1. vue-minder-editor-extended 已知库 bug（fill 报错）
    // 2. vue-router 3.x NavigationRedirected 噪音
    // 均不影响功能，overlay 只会干扰开发体验
    client: {
      overlay: false
    }
  },
  // 配置 webpack 处理 vue-minder-editor-extended 的依赖
  configureWebpack: {
    resolve: {
      alias: {
        'vue$': 'vue/dist/vue.esm.js'
      }
    }
  },
  // 关闭生产环境 source map
  productionSourceMap: false
})
