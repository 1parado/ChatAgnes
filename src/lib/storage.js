const CHATS_KEY = 'agnes_chats'

export function loadChats() {
  try {
    const raw = localStorage.getItem(CHATS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveChats(chats) {
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats))
}

export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatTime(ts) {
  try {
    return new Date(ts).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return ''
  }
}
