/**
 * 本地存储 API 模块
 *
 * 仅在本地调试模式下使用（VUE_APP_ENABLE_LOCAL_MODE=true）
 * 数据存储在浏览器 localStorage 中，不会影响生产环境的 GitHub 数据
 */

// 使用特殊前缀，避免与生产环境数据冲突
const STORAGE_KEY_FILES = 'minder_local_dev_files'
const STORAGE_KEY_REPOS = 'minder_local_dev_repos'

// 获取所有本地文件
const getLocalFiles = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_FILES)) || {}
  } catch {
    return {}
  }
}

// 保存所有本地文件
const saveLocalFiles = (files) => {
  localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files))
}

// 获取本地仓库列表
const getLocalRepos = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_REPOS)) || []
  } catch {
    return []
  }
}

// 保存本地仓库列表
const saveLocalRepos = (repos) => {
  localStorage.setItem(STORAGE_KEY_REPOS, JSON.stringify(repos))
}

// ============================================================
// 仓库操作
// ============================================================

/**
 * 获取仓库列表
 */
export async function listRepos() {
  let repos = getLocalRepos()
  if (repos.length === 0) {
    // 创建默认仓库
    repos = [{
      id: 'local_default',
      name: 'local-mindmaps',
      full_name: 'local_dev/local-mindmaps',
      private: true,
      description: '本地调试仓库（数据存储在浏览器中）',
      owner: {
        login: 'local_dev',
        avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4'
      },
      default_branch: 'main'
    }]
    saveLocalRepos(repos)
  }
  return repos
}

/**
 * 创建新仓库
 */
export async function createRepo(name, isPrivate = true) {
  const repos = getLocalRepos()
  const newRepo = {
    id: `local_${Date.now()}`,
    name,
    full_name: `local_dev/${name}`,
    private: isPrivate,
    description: '本地调试仓库',
    owner: {
      login: 'local_dev',
      avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4'
    },
    default_branch: 'main'
  }
  repos.push(newRepo)
  saveLocalRepos(repos)
  return newRepo
}

// ============================================================
// 文件/目录操作
// ============================================================

/**
 * 列出目录内容
 */
export async function listContents(owner, repo, path = '') {
  const files = getLocalFiles()
  const repoKey = `${owner}/${repo}`
  const repoFiles = files[repoKey] || {}

  // 获取指定路径下的直接子项
  const items = []
  const seenNames = new Set()

  for (const [filePath, fileData] of Object.entries(repoFiles)) {
    // 检查是否在目标路径下
    const isInPath = path === ''
      ? !filePath.includes('/')
      : filePath.startsWith(path + '/')

    if (!isInPath) continue

    // 获取相对路径的第一部分
    const relativePath = path === '' ? filePath : filePath.slice(path.length + 1)
    const firstSegment = relativePath.split('/')[0]

    if (seenNames.has(firstSegment)) continue
    seenNames.add(firstSegment)

    const isDir = relativePath.includes('/')
    items.push({
      name: firstSegment,
      path: path === '' ? firstSegment : `${path}/${firstSegment}`,
      type: isDir ? 'dir' : 'file',
      sha: isDir ? null : fileData.sha,
      size: isDir ? 0 : fileData.content?.length || 0
    })
  }

  // 排序：文件夹在前
  return items.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name)
    return a.type === 'dir' ? -1 : 1
  })
}

/**
 * 读取文件内容
 */
export async function getFileContent(owner, repo, path) {
  const files = getLocalFiles()
  const repoKey = `${owner}/${repo}`
  const repoFiles = files[repoKey] || {}
  const fileData = repoFiles[path]

  if (!fileData) {
    throw new Error('File not found: ' + path)
  }

  return {
    content: fileData.content,
    sha: fileData.sha,
    name: path.split('/').pop(),
    path: path,
    size: fileData.content?.length || 0
  }
}

/**
 * 创建或更新文件
 */
export async function putFile(owner, repo, path, content, message) {
  const files = getLocalFiles()
  const repoKey = `${owner}/${repo}`

  if (!files[repoKey]) {
    files[repoKey] = {}
  }

  const newSha = `sha_${Date.now()}`
  files[repoKey][path] = {
    content,
    sha: newSha,
    message,
    updatedAt: new Date().toISOString()
  }

  saveLocalFiles(files)
  return { sha: newSha, path }
}

/**
 * 删除文件
 */
export async function deleteFile(owner, repo, path) {
  const files = getLocalFiles()
  const repoKey = `${owner}/${repo}`

  if (files[repoKey]) {
    delete files[repoKey][path]
    saveLocalFiles(files)
  }
}

/**
 * 重命名文件
 */
export async function renameFile(owner, repo, oldPath, newPath, oldSha, content) {
  await putFile(owner, repo, newPath, content, `rename: ${oldPath} → ${newPath}`)
  await deleteFile(owner, repo, oldPath)
  return { sha: `sha_${Date.now()}`, path: newPath }
}

/**
 * 创建新脑图文件
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
 * 创建文件夹（创建 .gitkeep）
 */
export async function createFolder(owner, repo, folderPath) {
  const gitkeepPath = `${folderPath}/.gitkeep`
  await putFile(owner, repo, gitkeepPath, '', `create folder: ${folderPath}`)
}

/**
 * 删除文件夹（递归删除）
 */
export async function deleteFolder(owner, repo, folderPath) {
  const files = getLocalFiles()
  const repoKey = `${owner}/${repo}`

  if (files[repoKey]) {
    // 删除所有以 folderPath 开头的文件
    for (const filePath of Object.keys(files[repoKey])) {
      if (filePath === folderPath || filePath.startsWith(folderPath + '/')) {
        delete files[repoKey][filePath]
      }
    }
    saveLocalFiles(files)
  }
}

