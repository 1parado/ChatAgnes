import { AGNES_ENDPOINT, AGNES_API_KEYS, AGNES_CHAT_ENDPOINT, AGNES_VIDEO_ENDPOINT, AGNES_VIDEO_RESULT } from '../config'

// 固定的生图模型
export const MODEL = 'agnes-image-2.1-flash'

// 固定的文字对话模型
export const MODEL_CHAT = 'agnes-2.0-flash'

// 固定的视频生成模型
export const MODEL_VIDEO = 'agnes-video-v2.0'

// 支持的尺寸与数量选项
export const SIZE_OPTIONS = [
  { value: '1024x1024', label: '正方形', hint: '1:1' },
  { value: '1024x1536', label: '竖图', hint: '2:3' },
  { value: '1536x1024', label: '横图', hint: '3:2' }
]

export const COUNT_OPTIONS = [1, 2, 3, 4]

function apiKeys() {
  return Array.isArray(AGNES_API_KEYS) ? AGNES_API_KEYS.filter(Boolean) : []
}

function randomApiKey() {
  const keys = apiKeys()
  if (keys.length === 0) {
    throw new Error('未配置 API Key：请在 src/config.js 中配置 AGNES_API_KEYS')
  }
  return keys[Math.floor(Math.random() * keys.length)]
}

function shuffledApiKeys() {
  const keys = [...apiKeys()]
  if (keys.length === 0) {
    throw new Error('未配置 API Key：请在 src/config.js 中配置 AGNES_API_KEYS')
  }
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[keys[i], keys[j]] = [keys[j], keys[i]]
  }
  return keys
}

/**
 * 调用 agnes 生图模型（OpenAI 兼容 /images/generations 契约）
 * 端点和 Key 使用内置固定配置，直接由浏览器发起。
 */
export async function generateImage({ prompt, size = '1024x1024', n = 1, signal } = {}) {
  const endpoint = AGNES_ENDPOINT
  const apiKey = randomApiKey()

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    signal,
    body: JSON.stringify({
      model: MODEL,
      prompt,
      size,
      n,
      extra_body: {
        response_format: 'url'
      }
    })
  })

  if (!response.ok) {
    let detail = ''
    try {
      const text = await response.text()
      try {
        const json = JSON.parse(text)
        detail = json.error?.message || text
      } catch {
        detail = text
      }
    } catch {
      detail = ''
    }
    throw new Error(`HTTP ${response.status}${detail ? '：' + detail : ''}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message || '生成失败')
  }

  const items = Array.isArray(data.data) ? data.data : []
  if (items.length === 0) {
    throw new Error('接口未返回图像数据')
  }

  const images = items.map((it) => ({
    url: it.url || (it.b64_json ? `data:image/png;base64,${it.b64_json}` : ''),
    revisedPrompt: it.revised_prompt || ''
  }))

  return {
    images,
    revisedPrompt: data.revised_prompt || images[0]?.revisedPrompt || ''
  }
}

/**
 * 文字对话：调用 agnes-2.0-flash 的 /v1/chat/completions
 * messages 为标准 OpenAI 格式：[{ role, content }]
 */
export async function chatText({ messages, signal } = {}) {
  const endpoint = AGNES_CHAT_ENDPOINT
  const apiKey = randomApiKey()

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    signal,
    body: JSON.stringify({
      model: MODEL_CHAT,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
      stream: false
    })
  })

  if (!response.ok) {
    let detail = ''
    try {
      const text = await response.text()
      try {
        const json = JSON.parse(text)
        detail = json.error?.message || text
      } catch {
        detail = text
      }
    } catch {
      detail = ''
    }
    throw new Error(`HTTP ${response.status}${detail ? '：' + detail : ''}`)
  }

  const data = await response.json()
  if (data.error) throw new Error(data.error.message || '生成失败')

  const content = data.choices?.[0]?.message?.content || ''
  return { text: content }
}

/**
 * 视频生成：创建异步任务（agnes-video-v2.0）
 * 返回 video_id 用于后续轮询结果。
 */
export async function createVideo({
  prompt,
  image,
  keyframes,
  mode,
  width,
  height,
  num_frames,
  frame_rate,
  negative_prompt,
  seed,
  signal
} = {}) {
  const endpoint = AGNES_VIDEO_ENDPOINT

  const body = {
    model: MODEL_VIDEO,
    prompt,
    height: height || 768,
    width: width || 1152,
    num_frames: num_frames || 121,
    frame_rate: frame_rate || 24
  }
  if (mode) body.mode = mode
  if (image) body.image = image
  if (negative_prompt) body.negative_prompt = negative_prompt
  if (Number.isFinite(seed)) body.seed = seed
  if (Array.isArray(keyframes) && keyframes.length > 0) {
    body.mode = 'keyframes'
    body.extra_body = {
      mode: 'keyframes',
      image: keyframes
    }
  }

  let lastRateLimitError = null
  for (const apiKey of shuffledApiKeys()) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      signal,
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await createHttpError(response)
      if (error.isRateLimit) {
        lastRateLimitError = error
        continue
      }
      throw error
    }

    const data = await response.json()
    if (data.error) throw new Error(data.error.message || '创建视频任务失败')

    const videoId = data.video_id || ''
    const taskId = data.task_id || data.id || ''
    if (!videoId && !taskId) {
      throw new Error('接口未返回 video_id 或 task_id')
    }

    return {
      video_id: videoId,
      task_id: taskId,
      apiKey,
      seconds: data.seconds,
      size: data.size
    }
  }

  throw lastRateLimitError || new Error('所有 API Key 均创建视频失败')
}

async function createHttpError(response) {
  let detail = ''
  try {
    const text = await response.text()
    try {
      const json = JSON.parse(text)
      detail = json.error?.message || text
    } catch {
      detail = text
    }
  } catch {
    detail = ''
  }
  const retryAfter = Number.parseInt(response.headers.get('retry-after') || '', 10)
  const isVideoCreateRateLimit =
    response.status === 429 && /video generation rate limit/i.test(detail)
  const isVideoStatusRateLimit =
    response.status === 429 && /video status query rate limit/i.test(detail)
  const message = isVideoCreateRateLimit
    ? '视频生成频率限制：每 1 分钟只能创建 1 个视频任务，请稍后再试。'
    : isVideoStatusRateLimit
      ? '视频状态查询频率限制，系统会降低查询频率并继续等待结果。'
      : `HTTP ${response.status}${detail ? '：' + detail : ''}`
  const error = new Error(message)
  error.status = response.status
  error.retryAfter = Number.isFinite(retryAfter) ? retryAfter : undefined
  error.isRateLimit = response.status === 429
  error.isVideoCreateRateLimit = isVideoCreateRateLimit
  error.isVideoStatusRateLimit = isVideoStatusRateLimit
  return error
}

export async function getVideoResult({ video_id, task_id, apiKey, signal } = {}) {
  const key = apiKey || randomApiKey()
  const url = video_id
    ? `${AGNES_VIDEO_RESULT}?video_id=${encodeURIComponent(video_id)}`
    : `${AGNES_VIDEO_ENDPOINT}/${encodeURIComponent(task_id)}`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
    signal
  })
  if (!response.ok) {
    throw await createHttpError(response)
  }
  return response.json()
}

/**
 * 轮询视频结果，直到 completed / failed。
 * onProgress 回调用于更新进度百分比。
 */
export async function pollVideo({
  video_id,
  task_id,
  apiKey,
  signal,
  onProgress,
  onRateLimit,
  interval = 30000,
  timeout = 600000
} = {}) {
  const start = Date.now()
  let nextInterval = interval
  while (true) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

    let data
    try {
      data = await getVideoResult({ video_id, task_id, apiKey, signal })
      nextInterval = interval
    } catch (err) {
      if (!err?.isVideoStatusRateLimit) throw err
      const waitSeconds = Math.max(err.retryAfter || 0, Math.ceil(nextInterval / 1000), 30)
      onRateLimit?.(waitSeconds)
      nextInterval = Math.max(interval, waitSeconds * 1000)
      if (Date.now() - start > timeout) throw new Error('视频生成超时')
      await delay(waitSeconds * 1000, signal)
      continue
    }
    if (typeof data.progress === 'number') onProgress?.(data.progress)

    if (data.status === 'completed') {
      if (!data.url) throw new Error('视频已完成，但接口未返回视频 URL')
      return data
    }
    if (data.status === 'failed') {
      throw new Error(data.error?.message || '视频生成失败')
    }
    if (Date.now() - start > timeout) throw new Error('视频生成超时')

    await delay(nextInterval, signal)
  }
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(t)
          reject(new DOMException('Aborted', 'AbortError'))
        },
        { once: true }
      )
    }
  })
}
