/**
 * XMind ↔ KityMinder JSON 转换工具
 * 封装 @ljheee/xmind-parser，提供浏览器端导入/导出接口
 */

/**
 * 将用户上传的 .xmind File 对象转换为 KityMinder JSON 字符串
 * 若文件包含多个画布（sheet），只取第一个
 *
 * @param {File} file - 用户通过 <input type="file"> 选择的 .xmind 文件
 * @returns {Promise<string>} KityMinder JSON 字符串（可直接存为 .km 文件内容）
 */
export async function xmindFileToKmString(file) {
  const { xmindBufferToKm } = await import('@ljheee/xmind-parser')

  const buffer = await file.arrayBuffer()
  const sheets = await xmindBufferToKm(buffer, { firstSheetOnly: true })

  if (!sheets || sheets.length === 0) {
    throw new Error('解析失败：未找到有效的脑图内容')
  }

  return JSON.stringify(sheets[0], null, 2)
}

/**
 * 将 base64 编码的 .xmind 文件内容（来自 GitHub API）转换为 KityMinder JSON 字符串
 * 若文件包含多个画布（sheet），只取第一个
 *
 * @param {string} base64Content - GitHub API 返回的 base64 编码内容（可含换行符）
 * @returns {Promise<{ kmString: string, sheetCount: number }>}
 *   kmString: KityMinder JSON 字符串
 *   sheetCount: 原始 sheet 数量（>1 时可提示用户）
 */
export async function xmindBase64ToKmString(base64Content) {
  const { xmindBufferToKm } = await import('@ljheee/xmind-parser')

  // 清理 GitHub 返回的 base64（含换行符）
  const cleaned = base64Content.replace(/\n/g, '').replace(/\\/g, '')
  const binaryStr = atob(cleaned)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  const buffer = bytes.buffer

  const sheets = await xmindBufferToKm(buffer, { firstSheetOnly: false })

  if (!sheets || sheets.length === 0) {
    throw new Error('解析失败：未找到有效的脑图内容')
  }

  return {
    kmString: JSON.stringify(sheets[0], null, 2),
    sheetCount: sheets.length
  }
}

/**
 * 递归遍历 km 节点树，将所有 blob: URL 图片异步 fetch 并转换为 base64 data URL。
 * KityMinder 本地上传图片时 data.image 存的是 blob: URL（createObjectURL 生成），
 * 这类 URL 只在当前浏览器会话有效，写入 xmind 文件后 XMind 无法读取。
 * 导出前调用此函数，确保所有图片都是可持久化的 data URL 或 xap: 路径。
 *
 * @param {object} kmNode - km 节点（含 data 和 children）
 * @returns {Promise<void>}
 */
async function resolveBlobUrls(kmNode) {
  if (!kmNode) return
  const data = kmNode.data
  if (data && data.image && typeof data.image === 'string' && data.image.startsWith('blob:')) {
    try {
      const resp = await fetch(data.image)
      const blob = await resp.blob()
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      data.image = dataUrl
    } catch (e) {
      console.warn('[xmindConverter] blob URL 转换失败，图片将丢失:', data.image, e)
      // 转换失败时清除，避免写入无效 blob URL
      delete data.image
      delete data.imageSize
    }
  }
  if (Array.isArray(kmNode.children)) {
    await Promise.all(kmNode.children.map(child => resolveBlobUrls(child)))
  }
}

/**
 * 将 KityMinder JSON 字符串转换为 .xmind ArrayBuffer（不触发下载）
 * 用于保存回 GitHub
 *
 * @param {string} kmJsonString - KityMinder JSON 字符串（.km 文件内容）
 * @returns {Promise<ArrayBuffer>}
 */
export async function kmStringToXmindBuffer(kmJsonString) {
  const { kmToXmindBuffer } = await import('@ljheee/xmind-parser')

  let kmData
  try {
    kmData = JSON.parse(kmJsonString)
  } catch (e) {
    throw new Error('脑图数据格式错误，无法转换为 xmind')
  }

  // 导出前将所有 blob: URL 转为 base64 data URL，确保图片可持久化
  if (kmData.root) await resolveBlobUrls(kmData.root)

  return kmToXmindBuffer(kmData, { format: 'xmind2020' })
}

/**
 * 将 ArrayBuffer 转换为 base64 字符串（用于 GitHub API 上传）
 *
 * @param {ArrayBuffer} buffer
 * @returns {string} base64 字符串
 */
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * 将 KityMinder JSON 字符串导出为 .xmind 文件并触发浏览器下载
 *
 * @param {string} kmJsonString - KityMinder JSON 字符串（.km 文件内容）
 * @param {string} filename - 下载文件名（不含扩展名）
 * @returns {Promise<void>}
 */
export async function kmStringToXmindDownload(kmJsonString, filename = 'mindmap') {
  const { kmToXmindBuffer, downloadArrayBuffer } = await import('@ljheee/xmind-parser')

  let kmData
  try {
    kmData = JSON.parse(kmJsonString)
  } catch (e) {
    throw new Error('脑图数据格式错误，无法导出')
  }

  // 导出前将所有 blob: URL 转为 base64 data URL，确保图片可持久化
  if (kmData.root) await resolveBlobUrls(kmData.root)

  const buffer = kmToXmindBuffer(kmData, { format: 'xmind2020' })
  downloadArrayBuffer(buffer, `${filename}.xmind`)
}
