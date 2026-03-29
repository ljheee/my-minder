/**
 * API 统一入口
 *
 * 根据环境变量在构建时选择具体实现：
 *   - VUE_APP_ENABLE_LOCAL_MODE=true  → localStorage 本地实现
 *   - 默认                            → GitHub API 实现
 *
 * 调用方只需 import { xxx } from '@/api'，无需关心底层实现。
 */

import * as githubApi from './github'
import * as localApi from './localStorage'

const api = process.env.VUE_APP_ENABLE_LOCAL_MODE === 'true' ? localApi : githubApi

export const {
  listRepos,
  createRepo,
  listContents,
  getFileContent,
  putFile,
  deleteFile,
  renameFile,
  createMinderFile,
  createFolder,
  deleteFolder
} = api

// github.js 独有的工具函数（纯计算，与模式无关，始终从 github.js 导出）
export { getUser, getFileBaseName, getParentPath, buildPath } from './github'
