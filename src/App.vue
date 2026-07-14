<template>
  <div class="app" :class="{ 'sidebar-open': sidebarOpen, 'sidebar-collapsed': collapsed }">
    <Sidebar
      v-if="showConversationChrome"
      :chats="chats"
      :active-id="activeId"
      :open="sidebarOpen"
      :collapsed="collapsed"
      @new="newChat"
      @select="selectChat"
      @delete="deleteChat"
      @close="sidebarOpen = false"
    />

    <main class="main">
      <header class="topbar">
        <button v-if="showConversationChrome" class="icon-btn" aria-label="菜单" @click="toggleSidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <span class="topbar__logo">Agnes 生图</span>

        <nav class="tabs">
          <button class="tab" :class="{ active: view === 'chat' }" @click="view = 'chat'">对话</button>
          <button class="tab" :class="{ active: view === 'image' }" @click="view = 'image'">生图</button>
          <button class="tab" :class="{ active: view === 'video' }" @click="view = 'video'">视频</button>
          <button class="tab" :class="{ active: view === 'skills' }" @click="view = 'skills'">Skills</button>
          <button class="tab" :class="{ active: view === 'gallery' }" @click="view = 'gallery'">画廊</button>
        </nav>

        <span class="model-badge" title="模型已固定">{{ activeModel }}</span>

        <div class="topbar__actions">
          <button v-if="showConversationChrome" class="icon-btn" aria-label="新建对话" @click="newChat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </header>

      <ChatView
        v-if="view === 'chat' || view === 'image' || view === 'video'"
        :chat="activeChat"
        :loading="loading"
        :mode="view === 'image' ? 'image' : view === 'video' ? 'video' : 'text'"
        :video-cooldown="videoCooldownRemaining"
        :active-skill="activeSkill"
        @send="sendPrompt"
        @stop="stopGeneration"
        @regenerate="regenerate"
        @delete-message="deleteMessage"
        @open-image="openLightbox"
        @toast="showToast"
        @browse-skills="view = 'skills'"
        @clear-skill="activeSkillId = ''"
        @select-skill="selectSkill"
      />
      <SkillsView v-else-if="view === 'skills'" :active-skill-id="activeSkillId" @select="selectSkill" />
      <Gallery v-else @goto-chat="view = 'image'" @toast="showToast" />
    </main>

    <transition name="fade">
      <div v-if="lightbox" class="lightbox" @click="lightbox = null">
        <button class="lb-nav lb-prev" aria-label="上一张" @click.stop="stepImage(-1)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" /></svg>
        </button>

        <img :src="lightbox.urls[lightbox.index]" :alt="`图片 ${lightbox.index + 1}`" class="lb-img" @click.stop />

        <button class="lb-nav lb-next" aria-label="下一张" @click.stop="stepImage(1)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>

        <div class="lb-bar" @click.stop>
          <span class="lb-count">{{ lightbox.index + 1 }} / {{ lightbox.urls.length }}</span>
          <a class="lb-dl" :href="lightbox.urls[lightbox.index]" download target="_blank" rel="noopener">下载原图</a>
          <button class="lb-close" aria-label="关闭" @click="lightbox = null">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </transition>

    <transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <div v-if="sidebarOpen" class="scrim" @click="sidebarOpen = false" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import ChatView from './components/ChatView.vue'
import Gallery from './components/Gallery.vue'
import SkillsView from './components/SkillsView.vue'
import { MODEL, MODEL_CHAT, MODEL_VIDEO, generateImage, chatText, createVideo, pollVideo } from './lib/agnes'
import { loadChats, saveChats, createId } from './lib/storage'
import { applySkill, getSkill } from './lib/skills'

const chats = ref(loadChats())
const activeId = ref(chats.value[0]?.id || null)
const sidebarOpen = ref(false)
const collapsed = ref(false)
const view = ref('chat')
const lightbox = ref(null)
const loading = ref(false)
const abortController = ref(null)
const toast = ref('')
const activeSkillId = ref(localStorage.getItem('agnes_active_skill') || '')
let toastTimer = null
let clockTimer = null

const activeChat = computed(() => chats.value.find((c) => c.id === activeId.value) || null)
const activeSkill = computed(() => getSkill(activeSkillId.value))
const showConversationChrome = computed(() => ['chat', 'image', 'video'].includes(view.value))
const activeModel = computed(() => {
  if (view.value === 'skills') return '风格配方库'
  if (view.value === 'gallery') return '作品画廊'
  if (view.value === 'chat') return MODEL_CHAT
  if (view.value === 'video') return MODEL_VIDEO
  return MODEL
})
const VIDEO_COOLDOWN_KEY = 'agnes_video_cooldown_until'
const now = ref(Date.now())
const videoCooldownUntil = ref(Number(localStorage.getItem(VIDEO_COOLDOWN_KEY) || 0))
const videoCooldownRemaining = computed(() =>
  Math.max(0, Math.ceil((videoCooldownUntil.value - now.value) / 1000))
)

function toggleSidebar() {
  if (window.matchMedia('(max-width: 768px)').matches) {
    sidebarOpen.value = !sidebarOpen.value
  } else {
    collapsed.value = !collapsed.value
  }
}

watch(
  chats,
  (val) => saveChats(val),
  { deep: true }
)

watch(activeSkillId, (value) => {
  if (value) localStorage.setItem('agnes_active_skill', value)
  else localStorage.removeItem('agnes_active_skill')
})

function selectSkill(skill) {
  activeSkillId.value = skill.id
  view.value = 'image'
  showToast(`已启用「${skill.name}」Skill`)
}

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2200)
}

function setVideoCooldown(seconds = 60) {
  const until = Date.now() + seconds * 1000
  videoCooldownUntil.value = Math.max(videoCooldownUntil.value, until)
  localStorage.setItem(VIDEO_COOLDOWN_KEY, String(videoCooldownUntil.value))
  now.value = Date.now()
}

function clearExpiredVideoCooldown() {
  if (videoCooldownUntil.value && videoCooldownUntil.value <= Date.now()) {
    videoCooldownUntil.value = 0
    localStorage.removeItem(VIDEO_COOLDOWN_KEY)
  }
}

function assertVideoCooldown() {
  clearExpiredVideoCooldown()
  if (videoCooldownRemaining.value > 0) {
    throw new Error(`视频生成限流中，请等待 ${videoCooldownRemaining.value} 秒后再试。`)
  }
}

function handleVideoError(err) {
  if (err?.isRateLimit || err?.status === 429) {
    setVideoCooldown(err.retryAfter || 60)
    return `视频生成频率限制：每 1 分钟只能创建 1 个视频任务，请等待 ${videoCooldownRemaining.value} 秒后再试。`
  }
  return err?.message || '生成失败'
}

function newChat() {
  const chat = { id: createId(), title: '新对话', messages: [], createdAt: Date.now() }
  chats.value.unshift(chat)
  activeId.value = chat.id
  sidebarOpen.value = false
}

function selectChat(id) {
  activeId.value = id
  sidebarOpen.value = false
}

function deleteChat(id) {
  const idx = chats.value.findIndex((c) => c.id === id)
  if (idx === -1) return
  chats.value.splice(idx, 1)
  if (activeId.value === id) {
    activeId.value = chats.value[0]?.id || null
  }
}

function deleteMessage(messageId) {
  const chat = activeChat.value
  if (!chat) return
  const idx = chat.messages.findIndex((m) => m.id === messageId)
  if (idx === -1) return
  const role = chat.messages[idx].role
  chat.messages.splice(idx, 1)
  showToast(role === 'user' ? '已删除消息' : '已删除 AI 回复')
}

function openLightbox(payload) {
  lightbox.value = { urls: payload.urls, index: payload.index || 0 }
}

function stepImage(dir) {
  if (!lightbox.value) return
  const len = lightbox.value.urls.length
  lightbox.value.index = (lightbox.value.index + dir + len) % len
}

function stopGeneration() {
  abortController.value?.abort()
}

const CONCURRENCY = 2
const MAX_TOTAL = 8

// 对单行提示词生成 perLine 张图：每张独立调用接口，确保同提示词也能产出不同结果
async function executeLineTasks(assistant, line, perLine, opts) {
  assistant.status = 'loading'
  assistant.images = []
  assistant.error = ''
  assistant.revisedPrompt = ''

  const queue = Array.from({ length: perLine }, () => line)
  let cursor = 0

  const worker = async () => {
    while (cursor < queue.length) {
      const t = queue[cursor++]
      try {
        const res = await generateImage({
          prompt: t,
          size: opts.size,
          n: 1,
          signal: abortController.value?.signal
        })
        assistant.images.push(...res.images)
        if (res.revisedPrompt) assistant.revisedPrompt = assistant.revisedPrompt || res.revisedPrompt
        if (assistant.status === 'loading') assistant.status = 'done'
      } catch (err) {
        if (err.name === 'AbortError') {
          if (assistant.status === 'loading') assistant.status = 'cancelled'
          assistant.error = assistant.error || '已停止生成'
          throw err
        }
        assistant.error = err.message || '生成失败'
      }
    }
  }

  const runners = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker)
  try {
    await Promise.all(runners)
  } catch (err) {
    if (err.name !== 'AbortError') throw err
  }
  if (assistant.status === 'loading') {
    assistant.status = assistant.error ? 'error' : 'cancelled'
  }
}

// 收集某条助手消息之前的文字对话上下文（用于多轮对话）
function contextFor(chat, uptoAssistantId) {
  const msgs = []
  for (const m of chat.messages) {
    if (m.kind !== 'text') continue
    if (m.id === uptoAssistantId) break
    if (m.role === 'user') msgs.push({ role: 'user', content: m.content })
    else if (m.role === 'assistant' && m.status === 'done') {
      msgs.push({ role: 'assistant', content: m.text || '' })
    }
  }
  return msgs
}

const DURATION_MAP = { 3: [81, 24], 5: [121, 24], 10: [241, 24] }
const ASPECT_MAP = {
  '16:9': [1152, 768],
  '9:16': [768, 1152],
  '1:1': [768, 768],
  '4:3': [1024, 768],
  '3:4': [768, 1024]
}

function videoParams(options) {
  const [num_frames, frame_rate] = DURATION_MAP[options.duration] || [121, 24]
  const [width, height] = ASPECT_MAP[options.aspect] || [1152, 768]
  return { num_frames, frame_rate, width, height }
}

function parseUrlList(value) {
  return String(value || '')
    .split(/[\n,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function videoPayload(options = {}) {
  const videoMode = options.videoMode || 'text'
  const seed = Number.parseInt(options.seed, 10)
  const base = {
    negative_prompt: String(options.negativePrompt || '').trim(),
    seed: Number.isFinite(seed) ? seed : undefined
  }

  if (videoMode === 'image') {
    const image = String(options.image || '').trim()
    if (!image) throw new Error('图生视频需要填写图片 URL')
    return { ...base, mode: 'ti2vid', image }
  }

  if (videoMode === 'keyframes') {
    const keyframes = parseUrlList(options.keyframes)
    if (keyframes.length < 2) throw new Error('关键帧动画至少需要 2 个图片 URL')
    return { ...base, mode: 'keyframes', keyframes }
  }

  return base
}

async function sendPrompt(rawPrompt, options) {
  if (loading.value) return
  const mode = options.mode || 'image'
  const text = rawPrompt.trim()
  if (!text) return

  let chat = activeChat.value
  if (!chat) {
    chat = { id: createId(), title: '新对话', messages: [], createdAt: Date.now() }
    chats.value.unshift(chat)
    activeId.value = chat.id
  }

  if (chat.messages.length === 0) {
    chat.title = text.length > 18 ? text.slice(0, 18) + '…' : text
  }

  chat.messages.push({
    id: createId(),
    role: 'user',
    content: text,
    options,
    kind: mode,
    createdAt: Date.now()
  })

  // 文字对话模式
  if (mode === 'text') {
    const assistant = {
      id: createId(),
      role: 'assistant',
      kind: 'text',
      status: 'loading',
      images: [],
      text: '',
      revisedPrompt: '',
      error: '',
      prompt: text,
      options,
      createdAt: Date.now()
    }
    chat.messages.push(assistant)

    loading.value = true
    abortController.value = new AbortController()
    try {
      const res = await chatText({
        messages: contextFor(chat, assistant.id),
        signal: abortController.value.signal
      })
      assistant.text = res.text
      assistant.status = 'done'
    } catch (err) {
      if (err.name === 'AbortError') {
        assistant.status = 'cancelled'
        assistant.error = '已停止生成'
      } else {
        assistant.error = err.message || '生成失败'
        assistant.status = 'error'
      }
    } finally {
      loading.value = false
      abortController.value = null
    }
    return
  }

  // 视频模式：创建异步任务并轮询结果
  if (mode === 'video') {
    const { num_frames, frame_rate, width, height } = videoParams(options)
    const assistant = {
      id: createId(),
      role: 'assistant',
      kind: 'video',
      status: 'loading',
      progress: 0,
      statusText: '',
      videoUrl: '',
      seconds: '',
      error: '',
      prompt: text,
      options,
      createdAt: Date.now()
    }
    chat.messages.push(assistant)

    loading.value = true
    abortController.value = new AbortController()
    try {
      assertVideoCooldown()
      const payload = videoPayload(options)
      const created = await createVideo({
        prompt: text,
        ...payload,
        width,
        height,
        num_frames,
        frame_rate,
        signal: abortController.value.signal
      })
      const result = await pollVideo({
        video_id: created.video_id,
        task_id: created.task_id,
        apiKey: created.apiKey,
        signal: abortController.value.signal,
        onProgress: (p) => {
          assistant.progress = p
          assistant.statusText = ''
        },
        onRateLimit: (seconds) => {
          assistant.statusText = `状态查询限流，约 ${seconds} 秒后继续查询`
        }
      })
      assistant.videoUrl = result.url || ''
      assistant.seconds = result.seconds || ''
      assistant.status = 'done'
    } catch (err) {
      if (err.name === 'AbortError') {
        assistant.status = 'cancelled'
        assistant.error = '已停止生成'
      } else {
        assistant.error = handleVideoError(err)
        assistant.status = 'error'
      }
    } finally {
      loading.value = false
      abortController.value = null
    }
    return
  }

  // 生图模式：按行拆分，每行一个独立提示词
  const skill = getSkill(options.skillId)
  const lines = text.split('\n').map((s) => s.trim()).filter(Boolean)
  let perLine = options.n || 1
  if (lines.length * perLine > MAX_TOTAL) {
    perLine = Math.max(1, Math.floor(MAX_TOTAL / lines.length))
    showToast(`已限制为每提示词 ${perLine} 张（共 ${lines.length * perLine} 张）`)
  }

  const assistants = lines.map((line) => {
    const generatedPrompt = applySkill(line, skill)
    const a = {
      id: createId(),
      role: 'assistant',
      kind: 'image',
      status: 'loading',
      images: [],
      revisedPrompt: '',
      error: '',
      prompt: generatedPrompt,
      sourcePrompt: line,
      skillId: skill?.id || '',
      options: { ...options, n: perLine },
      createdAt: Date.now()
    }
    chat.messages.push(a)
    return a
  })

  loading.value = true
  abortController.value = new AbortController()
  try {
    await Promise.allSettled(
      assistants.map((a) => executeLineTasks(a, a.prompt, perLine, options))
    )
  } finally {
    loading.value = false
    abortController.value = null
  }
}

async function regenerate(messageId) {
  if (loading.value) return
  const chat = activeChat.value
  if (!chat) return
  const msg = chat.messages.find((m) => m.id === messageId)
  if (!msg || !msg.prompt) return

  // 文字对话重新生成
  if (msg.kind === 'text') {
    loading.value = true
    abortController.value = new AbortController()
    try {
      const res = await chatText({
        messages: contextFor(chat, msg.id),
        signal: abortController.value.signal
      })
      msg.text = res.text
      msg.error = ''
      msg.status = 'done'
    } catch (err) {
      if (err.name === 'AbortError') {
        msg.status = 'cancelled'
        msg.error = '已停止生成'
      } else {
        msg.error = err.message || '生成失败'
        msg.status = 'error'
      }
    } finally {
      loading.value = false
      abortController.value = null
    }
    return
  }

  // 视频重新生成
  if (msg.kind === 'video') {
    const { num_frames, frame_rate, width, height } = videoParams(msg.options || {})
    loading.value = true
    abortController.value = new AbortController()
    try {
      msg.progress = 0
      msg.statusText = ''
      msg.videoUrl = ''
      msg.seconds = ''
      assertVideoCooldown()
      msg.error = ''
      msg.status = 'loading'
      const payload = videoPayload(msg.options || {})
      const created = await createVideo({
        prompt: msg.prompt,
        ...payload,
        width,
        height,
        num_frames,
        frame_rate,
        signal: abortController.value.signal
      })
      const result = await pollVideo({
        video_id: created.video_id,
        task_id: created.task_id,
        apiKey: created.apiKey,
        signal: abortController.value.signal,
        onProgress: (p) => {
          msg.progress = p
          msg.statusText = ''
        },
        onRateLimit: (seconds) => {
          msg.statusText = `状态查询限流，约 ${seconds} 秒后继续查询`
        }
      })
      msg.videoUrl = result.url || ''
      msg.seconds = result.seconds || ''
      msg.error = ''
      msg.status = 'done'
    } catch (err) {
      if (err.name === 'AbortError') {
        msg.status = 'cancelled'
        msg.error = '已停止生成'
      } else {
        msg.error = handleVideoError(err)
        msg.status = 'error'
      }
    } finally {
      loading.value = false
      abortController.value = null
    }
    return
  }

  // 生图重新生成
  loading.value = true
  abortController.value = new AbortController()
  try {
    await executeLineTasks(
      msg,
      msg.prompt,
      msg.options?.n || 1,
      msg.options || { size: '1024x1024', n: 1 }
    )
  } catch (e) {
    /* 中止等错误已在任务内处理 */
  } finally {
    loading.value = false
    abortController.value = null
  }
}

function onKey(e) {
  if (!lightbox.value) return
  if (e.key === 'Escape') lightbox.value = null
  else if (e.key === 'ArrowLeft') stepImage(-1)
  else if (e.key === 'ArrowRight') stepImage(1)
}
onMounted(() => {
  window.addEventListener('keydown', onKey)
  clockTimer = setInterval(() => {
    now.value = Date.now()
    clearExpiredVideoCooldown()
  }, 1000)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  clearInterval(clockTimer)
})
</script>

<style scoped>
.app {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
}

.topbar {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}

.topbar__title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.topbar__logo {
  font-weight: 600;
  font-size: 15px;
  white-space: nowrap;
}

.tabs {
  display: flex;
  gap: 2px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 3px;
}
.tab {
  border: none;
  background: transparent;
  color: var(--text-soft);
  font-size: 13px;
  padding: 6px 16px;
  border-radius: 999px;
  transition: background 0.15s, color 0.15s;
}
.tab.active {
  background: var(--bg);
  color: var(--text);
  box-shadow: var(--shadow);
}

.model-badge {
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 999px;
  padding: 2px 9px;
  white-space: nowrap;
}

.topbar__actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-soft);
  border-radius: 10px;
  transition: background 0.15s, color 0.15s;
}
.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.scrim {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 30;
}

/* 灯箱 */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.86);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  cursor: zoom-out;
}
.lb-img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.lb-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.15s;
}
.lb-nav:hover {
  background: rgba(255, 255, 255, 0.22);
}
.lb-prev {
  left: 18px;
}
.lb-next {
  right: 18px;
}
.lb-bar {
  position: absolute;
  bottom: 26px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  backdrop-filter: blur(8px);
}
.lb-count {
  color: #fff;
  font-size: 13px;
}
.lb-dl {
  color: #fff;
  font-size: 13px;
  text-decoration: none;
  padding: 5px 14px;
  background: rgba(255, 255, 255, 0.16);
  border-radius: 999px;
}
.lb-dl:hover {
  background: rgba(255, 255, 255, 0.3);
}
.lb-close {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
}
.lb-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Toast */
.toast {
  position: fixed;
  bottom: 88px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 70;
  background: #1b1b1b;
  color: #fff;
  font-size: 13px;
  padding: 10px 18px;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  pointer-events: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
