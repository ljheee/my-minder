import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Element UI
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

// vue-minder-editor-extended 全局注册
import MinderEditorPlugin from 'vue-minder-editor-extended'
Vue.use(MinderEditorPlugin)

Vue.use(ElementUI, {
  size: 'small'
})

// 屏蔽 vue-minder-editor-extended 内部已知 bug：
// HyperLink renderer 在 mouseover/mouseout 回调里，若 SVG Paper 尚未就绪，
// Rect 背景对象的 node 为 undefined，导致 fill() 报错。
// 该错误不影响功能（链接仍可正常使用），属于库的已知缺陷，静默忽略即可。
Vue.config.errorHandler = (err) => {
  if (err && err.message && err.message.includes("Cannot read properties of undefined (reading 'fill')")) {
    return
  }
  console.error('[Vue error]', err)
}
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes("Cannot read properties of undefined (reading 'fill')")) {
    event.stopImmediatePropagation()
    event.preventDefault()
  }
})

// 屏蔽 vue-router 3.x 路由守卫重定向时的 unhandledrejection 噪音
// NavigationRedirected / NavigationDuplicated / NavigationCancelled 均属正常行为
const IGNORED_NAV_ERRORS = ['NavigationRedirected', 'NavigationDuplicated', 'NavigationCancelled']
window.addEventListener('unhandledrejection', (event) => {
  const err = event.reason
  if (err && err.name && IGNORED_NAV_ERRORS.includes(err.name)) {
    event.stopImmediatePropagation()
    event.preventDefault()
  }
})

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
