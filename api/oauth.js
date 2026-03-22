/**
 * Vercel Serverless Function: GitHub OAuth 中转
 *
 * 职责：用 code 换 access_token
 * 原因：client_secret 不能暴露在前端代码中，必须在服务端完成这一步
 *
 * 环境变量（在 Vercel 项目设置中配置）：
 *   GITHUB_CLIENT_ID     - GitHub OAuth App 的 Client ID
 *   GITHUB_CLIENT_SECRET - GitHub OAuth App 的 Client Secret
 */

export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code } = req.body

  if (!code) {
    return res.status(400).json({ error: 'Missing code parameter' })
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('Missing GitHub OAuth environment variables')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    })

    const data = await response.json()

    if (data.error) {
      // GitHub 返回了错误（如 code 已过期）
      return res.status(400).json({
        error: data.error,
        error_description: data.error_description
      })
    }

    // 成功：返回 access_token
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(200).json({
      access_token: data.access_token,
      token_type: data.token_type,
      scope: data.scope
    })
  } catch (err) {
    console.error('OAuth exchange error:', err)
    return res.status(500).json({ error: 'Failed to exchange token' })
  }
}
