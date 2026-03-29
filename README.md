# Minder — 私有脑图工具

基于 GitHub 仓库存储的在线思维导图工具。数据以 `.km` 文件保存在你自己的 GitHub 仓库，完全私有可控。

![icon](public/favicon.png)

## 功能

- 思维导图创建、编辑、保存
- 节点支持设置优先级 P0–P10、进度标记
- 节点可附加链接、图片、备注
- 文件列表管理：新建、重命名、删除
- 数据存储在 GitHub 仓库，通过 GitHub OAuth 登录授权
- 支持本地调试模式（无需 GitHub，数据存 localStorage）

## 技术栈

- 前端：Vue 2 + Vuex + Vue Router + Element UI
- 编辑器：kityminder/vue-minder-editor-extended
- 部署：Vercel（前端静态 + Serverless Function 处理 OAuth）
- 存储：GitHub Contents API

---

## 私有部署步骤
## 部署
[![Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/ljheee/my-minder)

### 1. Fork 仓库

Fork 本项目到你自己的 GitHub 账号。

### 2. 创建 GitHub OAuth App

进入 [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)，点击 **New OAuth App**，填写：

| 字段 | 值 |
|---|---|
| Application name | 随意，如 `My Minder` |
| Homepage URL | 你的 Vercel 域名，如 `https://my-minder.vercel.app` |
| Authorization callback URL | `https://your-domain.vercel.app/callback` |

创建后记录 **Client ID** 和 **Client Secret**。

### 3. 部署到 Vercel

1. 在 [Vercel](https://vercel.com) 导入你 fork 的仓库
2. 进入项目 **Settings → Environment Variables**，添加以下三个变量：

| 变量名 | 说明 |
|---|---|
| `VUE_APP_GITHUB_CLIENT_ID` | OAuth App 的 Client ID（前端使用） |
| `GITHUB_CLIENT_ID` | OAuth App 的 Client ID（服务端使用） |
| `GITHUB_CLIENT_SECRET` | OAuth App 的 Client Secret（服务端使用，勿泄露） |

3. 触发重新部署（或 Vercel 会自动部署）

### 4. 使用

访问你的 Vercel 域名，用 GitHub 账号登录，选择一个仓库作为脑图存储仓库即可开始使用。

---

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（本地调试模式，无需 GitHub 登录）
npm run serve
```

本地调试模式通过 `.env.local` 中的 `VUE_APP_ENABLE_LOCAL_MODE=true` 开启，数据存储在浏览器 localStorage，不会影响线上数据。

参考 `.env.example` 配置环境变量。
