<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Logo & 标题 -->
      <div class="login-header">
        <div class="logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#1a1a2e"/>
            <circle cx="24" cy="24" r="4" fill="#4f9cf9"/>
            <line x1="24" y1="24" x2="10" y2="14" stroke="#4f9cf9" stroke-width="2"/>
            <line x1="24" y1="24" x2="38" y2="14" stroke="#4f9cf9" stroke-width="2"/>
            <line x1="24" y1="24" x2="10" y2="34" stroke="#4f9cf9" stroke-width="2"/>
            <line x1="24" y1="24" x2="38" y2="34" stroke="#4f9cf9" stroke-width="2"/>
            <line x1="24" y1="24" x2="24" y2="8" stroke="#4f9cf9" stroke-width="2"/>
            <line x1="24" y1="24" x2="24" y2="40" stroke="#4f9cf9" stroke-width="2"/>
            <circle cx="10" cy="14" r="3" fill="#7ec8e3"/>
            <circle cx="38" cy="14" r="3" fill="#7ec8e3"/>
            <circle cx="10" cy="34" r="3" fill="#7ec8e3"/>
            <circle cx="38" cy="34" r="3" fill="#7ec8e3"/>
            <circle cx="24" cy="8" r="3" fill="#7ec8e3"/>
            <circle cx="24" cy="40" r="3" fill="#7ec8e3"/>
          </svg>
        </div>
        <h1 class="app-name">Minder</h1>
        <p class="app-desc">私有化脑图工具，文件安全存储在你的 GitHub 仓库</p>
      </div>

      <!-- 登录按钮 -->
      <div class="login-body">
        <button class="github-btn" :disabled="loading" @click="handleLogin">
          <svg v-if="!loading" class="github-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? '登录中...' : '使用 GitHub 登录' }}
        </button>

        <div v-if="error" class="error-msg">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {{ error }}
        </div>
      </div>

      <!-- 说明 -->
      <div class="login-footer">
        <p>登录后，你的脑图文件将存储在你自己的 GitHub 私有仓库中</p>
        <p>我们只请求必要的权限（<code>repo</code>），不会访问其他数据</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginPage',

  data() {
    return {
      loading: false,
      error: null
    }
  },

  methods: {
    handleLogin() {
      this.loading = true
      this.error = null

      const clientId = process.env.VUE_APP_GITHUB_CLIENT_ID
      if (!clientId) {
        this.error = '应用配置错误：缺少 GitHub Client ID'
        this.loading = false
        return
      }

      // 生成随机 state 防止 CSRF
      const state = Math.random().toString(36).substring(2)
      sessionStorage.setItem('oauth_state', state)

      // 保存登录前的目标页面
      const redirect = this.$route.query.redirect || '/'
      sessionStorage.setItem('oauth_redirect', redirect)

      // 跳转到 GitHub OAuth 授权页
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${window.location.origin}/callback`,
        scope: 'repo',
        state
      })

      window.location.href = `https://github.com/login/oauth/authorize?${params}`
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
  padding: 20px;
}

.login-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 48px 40px;
  width: 100%;
  max-width: 420px;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.login-header {
  margin-bottom: 36px;
}

.logo {
  margin-bottom: 16px;
}

.app-name {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.app-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  line-height: 1.6;
}

.login-body {
  margin-bottom: 32px;
}

.github-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 24px;
  background: #ffffff;
  color: #1a1a2e;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.github-btn:hover:not(:disabled) {
  background: #f0f0f0;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.github-btn:active:not(:disabled) {
  transform: translateY(0);
}

.github-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.github-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(26, 26, 46, 0.3);
  border-top-color: #1a1a2e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(255, 80, 80, 0.15);
  border: 1px solid rgba(255, 80, 80, 0.3);
  border-radius: 8px;
  color: #ff8080;
  font-size: 13px;
  text-align: left;
}

.login-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 24px;
}

.login-footer p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  margin: 0 0 6px;
  line-height: 1.6;
}

.login-footer p:last-child {
  margin-bottom: 0;
}

.login-footer code {
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 5px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
}
</style>
