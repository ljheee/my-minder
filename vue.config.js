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
    // 屏蔽 vue-minder-editor-extended 已知库 bug 导致的 overlay 报错弹窗
    client: {
      overlay: {
        runtimeErrors: (error) => {
          if (error && error.message && error.message.includes("Cannot read properties of undefined (reading 'fill')")) {
            return false
          }
          return true
        }
      }
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
