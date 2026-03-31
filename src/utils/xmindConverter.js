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

  const buffer = kmToXmindBuffer(kmData, { format: 'xmind2020' })
  downloadArrayBuffer(buffer, `${filename}.xmind`)
}
