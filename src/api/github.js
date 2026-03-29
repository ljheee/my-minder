/**
 * GitHub API 封装
 *
 * 所有操作都直接从前端调用 GitHub API，token 存在 localStorage 中
 * 文件格式：.km（JSON 格式的脑图数据）
 *
 * 本地调试模式请使用 src/api/localStorage.js，
 * 通过 src/api/index.js 统一入口按环境变量切换，无需在此文件做任何判断。
 */

import axios from 'axios'

const BASE_URL = 'https://api.github.com'

// 创建 axios 实例
const createClient = (token) => {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
}

// 获取当前 token
const getToken = () => localStorage.getItem('github_token')

// 获取 axios 实例（自动读取 token）
const client = () => createClient(getToken())

// ============================================================
// 用户信息
// ============================================================

/**
 * 获取当前登录用户信息
 * @returns {Promise<{login, name, avatar_url, email}>}
 */
export async function getUser() {
  const { data } = await client().get('/user')
  return data
}

// ============================================================
// 仓库操作
// ============================================================

/**
 * 获取用户的仓库列表（包含私有仓库）
 * @param {Object} options
 * @param {number} options.page - 页码，默认 1
 * @param {number} options.perPage - 每页数量，默认 30
 * @param {string} options.sort - 排序方式：updated | created | pushed | full_name
 * @returns {Promise<Array>}
 */
export async function listRepos({ page = 1, perPage = 30, sort = 'updated' } = {}) {
  const { data } = await client().get('/user/repos', {
    params: {
      page,
      per_page: perPage,
      sort,
      affiliation: 'owner',
      visibility: 'all'
    }
  })
  return data
}

/**
 * 创建新仓库
 * @param {string} name - 仓库名
 * @param {boolean} isPrivate - 是否私有，默认 true
 * @returns {Promise<Object>}
 */
export async function createRepo(name, isPrivate = true) {
  const { data } = await client().post('/user/repos', {
    name,
    private: isPrivate,
    description: '脑图文件存储仓库（由 Minder App 创建）',
    auto_init: true // 自动初始化，创建 README.md，避免空仓库问题
  })
  return data
}

// ============================================================
// 文件/目录操作
// ============================================================

/**
 * 列出目录内容
 * @param {string} owner - 仓库所有者
 * @param {string} repo - 仓库名
 * @param {string} path - 目录路径，根目录传 '' 或 '/'
 * @returns {Promise<Array<{name, path, type, sha, size, download_url}>>}
 */
export async function listContents(owner, repo, path = '') {
  const encodedPath = path ? encodeURIComponent(path).replace(/%2F/g, '/') : ''
  const url = `/repos/${owner}/${repo}/contents/${encodedPath}`
  const { data } = await client().get(url)
  // 返回数组（目录内容），按类型和名称排序：文件夹在前，文件在后
  if (!Array.isArray(data)) {
    throw new Error('Expected directory, got file')
  }
  return data.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name)
    return a.type === 'dir' ? -1 : 1
  })
}

/**
 * 读取文件内容
 * @param {string} owner
 * @param {string} repo
 * @param {string} path - 文件路径
 * @returns {Promise<{content: string, sha: string, name: string, path: string}>}
 */
export async function getFileContent(owner, repo, path) {
  const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/')
  const { data } = await client().get(`/repos/${owner}/${repo}/contents/${encodedPath}`)
  // GitHub 返回的 content 是 base64 编码的
  const content = decodeBase64(data.content)
  return {
    content,
    sha: data.sha,
    name: data.name,
    path: data.path,
    size: data.size
  }
}

/**
 * 创建或更新文件
 * @param {string} owner
 * @param {string} repo
 * @param {string} path - 文件路径
 * @param {string} content - 文件内容（字符串）
 * @param {string} message - commit 消息
 * @param {string} [sha] - 更新时需要传入当前文件的 sha
 * @returns {Promise<{sha: string, path: string}>}
 */
export async function putFile(owner, repo, path, content, message, sha = null) {
  const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/')
  const body = {
    message,
    content: encodeBase64(content)
  }
  if (sha) {
    body.sha = sha
  }
  const { data } = await client().put(`/repos/${owner}/${repo}/contents/${encodedPath}`, body)
  return {
    sha: data.content.sha,
    path: data.content.path
  }
}

/**
 * 删除文件
 * @param {string} owner
 * @param {string} repo
 * @param {string} path - 文件路径
 * @param {string} sha - 文件的 sha（必须）
 * @param {string} message - commit 消息
 * @returns {Promise<void>}
 */
export async function deleteFile(owner, repo, path, sha, message) {
  const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/')
  await client().delete(`/repos/${owner}/${repo}/contents/${encodedPath}`, {
    data: { message, sha }
  })
}

/**
 * 重命名/移动文件（GitHub API 无原生重命名，需要先创建新文件再删除旧文件）
 * @param {string} owner
 * @param {string} repo
 * @param {string} oldPath - 旧路径
 * @param {string} newPath - 新路径
 * @param {string} oldSha - 旧文件的 sha
 * @param {string} content - 文件内容
 * @returns {Promise<{sha: string, path: string}>}
 */
export async function renameFile(owner, repo, oldPath, newPath, oldSha, content) {
  // 1. 在新路径创建文件
  const result = await putFile(
    owner, repo, newPath, content,
    `rename: ${oldPath} → ${newPath}`
  )
  // 2. 删除旧路径文件
  await deleteFile(
    owner, repo, oldPath, oldSha,
    `rename: ${oldPath} → ${newPath} (delete old)`
  )
  return result
}

/**
 * 创建新脑图文件（写入空白脑图 JSON）
 * @param {string} owner
 * @param {string} repo
 * @param {string} path - 文件路径（含文件名，如 'notes/my-map.km'）
 * @returns {Promise<{sha: string, path: string}>}
 */
export async function createMinderFile(owner, repo, path) {
  const emptyMinder = JSON.stringify({
    root: {
      data: { text: '中心主题' },
      children: []
    },
    template: 'default',
    theme: 'fresh-blue',
    version: '1.4.43'
  }, null, 2)

  return putFile(owner, repo, path, emptyMinder, `create: ${path}`)
}

/**
 * 创建文件夹（GitHub 不支持空目录，通过创建 .gitkeep 占位文件实现）
 * @param {string} owner
 * @param {string} repo
 * @param {string} folderPath - 文件夹路径（如 'notes/2024'）
 * @returns {Promise<void>}
 */
export async function createFolder(owner, repo, folderPath) {
  const gitkeepPath = `${folderPath}/.gitkeep`
  await putFile(owner, repo, gitkeepPath, '', `create folder: ${folderPath}`)
}

/**
 * 删除文件夹（递归删除文件夹内所有文件）
 * @param {string} owner
 * @param {string} repo
 * @param {string} folderPath - 文件夹路径
 * @returns {Promise<void>}
 */
export async function deleteFolder(owner, repo, folderPath) {
  const items = await listContents(owner, repo, folderPath)
  for (const item of items) {
    if (item.type === 'dir') {
      await deleteFolder(owner, repo, item.path)
    } else {
      await deleteFile(owner, repo, item.path, item.sha, `delete: ${item.path}`)
    }
  }
}

// ============================================================
// 工具函数
// ============================================================

/**
 * Base64 编码（支持中文）
 */
function encodeBase64(str) {
  return btoa(unescape(encodeURIComponent(str)))
}

/**
 * Base64 解码（支持中文）
 * 使用 TextDecoder 替代废弃的 escape()，正确处理 UTF-8 多字节字符
 */
function decodeBase64(str) {
  if (!str) return ''
  try {
    // GitHub 返回的 base64 可能包含换行符和反斜杠转义，需要先清理
    let cleaned = str.replace(/\n/g, '').replace(/\\/g, '')
    // 补齐 base64 padding
    while (cleaned.length % 4) {
      cleaned += '='
    }
    const bytes = Uint8Array.from(atob(cleaned), c => c.charCodeAt(0))
    return new TextDecoder('utf-8').decode(bytes)
  } catch (err) {
    console.error('[github.js] Base64 解码失败:', err.message, '原始字符串:', str.substring(0, 100))
    return ''
  }
}

/**
 * 从路径中提取文件名（不含扩展名）
 */
export function getFileBaseName(path) {
  const name = path.split('/').pop()
  return name.replace(/\.km$/, '')
}

/**
 * 从路径中提取父目录路径
 */
export function getParentPath(path) {
  const parts = path.split('/')
  parts.pop()
  return parts.join('/')
}

/**
 * 构建文件路径
 */
export function buildPath(parentPath, name) {
  if (!parentPath || parentPath === '/') return name
  return `${parentPath}/${name}`
}
