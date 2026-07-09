// 固定配置：端点和 Agnes Key 已写入仓库（页面不展示）
export const AGNES_ENDPOINT =
  import.meta.env.VITE_AGNES_ENDPOINT || 'https://apihub.agnes-ai.com/v1/images/generations'
export const AGNES_API_KEYS = [
  'sk-SP0JGB6jUYJhdIrD5dh6NnUO0BbTJkdUEQkW1FbEGjybi4u9',
  'sk-OQy8kjhnWyxIWCjSVXr1homtQx7vqovKnylosLggwXM9fems',
  'sk-VAFd9HMnGvQy2OFkhz4bAFVbA2TlQZc1sS4NGF5ou2EllulI'
]
export const AGNES_API_KEY = AGNES_API_KEYS[0] || ''

// 图床：专用存放图片的 GitHub 仓库（通过 Contents API 上传）
// 填入拥有该仓库「Contents 写」权限的 GitHub Token（建议用仅限此仓库的细粒度令牌）
export const IMAGEBED_REPO = '1parado/myPic'
export const IMAGEBED_BRANCH = 'main'
export const IMAGEBED_TOKEN = ''

// 文字对话端点（agnes-2.0-flash，OpenAI 兼容 /v1/chat/completions）
export const AGNES_CHAT_ENDPOINT =
  import.meta.env.VITE_AGNES_CHAT_ENDPOINT || 'https://apihub.agnes-ai.com/v1/chat/completions'

// 视频生成端点（agnes-video-v2.0，异步任务）
export const AGNES_VIDEO_ENDPOINT =
  import.meta.env.VITE_AGNES_VIDEO_ENDPOINT || 'https://apihub.agnes-ai.com/v1/videos'
export const AGNES_VIDEO_RESULT =
  import.meta.env.VITE_AGNES_VIDEO_RESULT || 'https://apihub.agnes-ai.com/agnesapi'
