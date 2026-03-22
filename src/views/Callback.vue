<template>
  <div class="callback-page">
    <div class="callback-card">
      <div v-if="status === 'loading'" class="status-loading">
        <div class="spinner"></div>
        <p>正在完成登录...</p>
      </div>

      <div v-else-if="status === 'success'" class="status-success">
        <div class="check-icon">✓</div>
        <p>登录成功，正在跳转...</p>
      </div>

      <div v-else-if="status === 'error'" class="status-error">
        <div class="error-icon">✕</div>
        <p>{{ errorMessage }}</p>
        <button class="retry-btn" @click="goToLogin">返回登录</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'CallbackPage',

  data() {
    return {
      status: 'loading', // loading | success | error
      errorMessage: ''
    }
  },

  async created() {
    await this.handleCallback()
  },

  methods: {
    async handleCallback() {
      const { code, state, error, error_description } = this.$route.query

      // GitHub 返回了错误（用户拒绝授权等）
      if (error) {
        this.status = 'error'
        this.errorMessage = error_description || '授权被拒绝'
        return
      }

      // 验证 state 防止 CSRF
      const savedState = sessionStorage.getItem('oauth_state')
      if (!state || state !== savedState) {
        this.status = 'error'
        this.errorMessage = '安全验证失败，请重新登录'
        return
      }
      sessionStorage.removeItem('oauth_state')

      if (!code) {
        this.status = 'error'
        this.errorMessage = '未收到授权码，请重新登录'
        return
      }

      try {
        // 调用 Vercel Serverless Function 换取 token
        const { data } = await axios.post('/api/oauth', { code })

        if (data.error) {
          throw new Error(data.error_description || data.error)
        }

        const { access_token } = data

        // 保存 token 并获取用户信息
        await this.$store.dispatch('auth/loginWithToken', access_token)

        this.status = 'success'

        // 跳转到目标页面
        const redirect = sessionStorage.getItem('oauth_redirect') || '/'
        sessionStorage.removeItem('oauth_redirect')

        setTimeout(() => {
          this.$router.replace(redirect)
        }, 800)
      } catch (err) {
        console.error('OAuth callback error:', err)
        this.status = 'error'
        this.errorMessage = err.message || '登录失败，请重试'
      }
    },

    goToLogin() {
      this.$router.replace('/login')
    }
  }
}
</script>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
}

.callback-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 48px 40px;
  text-align: center;
  min-width: 280px;
}

.status-loading,
.status-success,
.status-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(79, 156, 249, 0.2);
  border-top-color: #4f9cf9;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.check-icon {
  width: 48px;
  height: 48px;
  background: rgba(72, 199, 142, 0.2);
  border: 2px solid #48c78e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #48c78e;
}

.error-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 80, 80, 0.2);
  border: 2px solid #ff5050;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #ff5050;
}

p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 15px;
  margin: 0;
}

.retry-btn {
  padding: 10px 24px;
  background: #4f9cf9;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #3a8ae8;
}
</style>
