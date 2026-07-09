import { IMAGEBED_REPO, IMAGEBED_BRANCH, IMAGEBED_TOKEN } from '../config'

const API = 'https://api.github.com'

/**
 * 将 base64 图片上传到图床仓库（GitHub Contents API）。
 * 成功返回稳定的 raw 访问地址。
 */
export async function uploadToImageBed({ repo = IMAGEBED_REPO, branch = IMAGEBED_BRANCH, token = IMAGEBED_TOKEN, path, base64, message }) {
  if (!token) throw new Error('未配置图床 Token（IMAGEBED_TOKEN）')

  const url = `${API}/repos/${repo}/contents/${path}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: message || 'upload image', content: base64, branch })
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`上传失败 HTTP ${res.status}：${text.slice(0, 200)}`)
  }

  return `https://raw.githubusercontent.com/${repo}/${branch}/${path}`
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.readAsDataURL(blob)
  })
}

export function randomImagePath(ext = 'png') {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `agnes/${ts}-${rand}.${ext}`
}
