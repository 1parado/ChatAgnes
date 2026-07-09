<template>
  <div class="chat">
    <div ref="scrollEl" class="messages" @scroll="onScroll">
      <!-- 空状态 -->
      <div v-if="!chat || chat.messages.length === 0" class="empty">
        <div class="empty__logo">
          <svg width="34" height="34" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="7" fill="#10a37f" />
            <path d="M9 21l5-10 3 6 2-3 4 7z" fill="#fff" />
            <circle cx="12.5" cy="12.5" r="1.6" fill="#fff" />
          </svg>
        </div>
        <h1 class="empty__title">{{ emptyTitle }}</h1>
        <p class="empty__sub">{{ emptySub }}</p>

        <div class="suggestions">
          <button
            v-for="s in suggestions"
            :key="s"
            class="suggestion"
            @click="useSuggestion(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <!-- 消息流 -->
      <template v-else>
        <div
          v-for="m in chat.messages"
          :key="m.id"
          class="msg"
          :class="'msg--' + m.role"
        >
          <div class="msg__avatar" v-if="m.role === 'assistant'">
            <svg width="18" height="18" viewBox="0 0 32 32">
              <rect width="32" height="32" rx="7" fill="#10a37f" />
              <path d="M9 21l5-10 3 6 2-3 4 7z" fill="#fff" />
            </svg>
          </div>

          <div class="msg__body">
            <!-- 用户消息 -->
            <div v-if="m.role === 'user'" class="bubble bubble--user">
              {{ m.content }}
              <div class="bubble__actions">
                <button class="mini" title="复制提示词" @click="copyPrompt(m.content)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
                </button>
                <button class="mini" title="编辑并重发" @click="editPrompt(m.content)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                </button>
                <button class="mini mini--danger" title="删除消息" @click="$emit('delete-message', m.id)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6" /></svg>
                </button>
              </div>
            </div>

            <!-- 助手消息 -->
            <template v-else>
              <!-- 文字回复 -->
              <div v-if="m.kind === 'text'" class="text-answer">
                <div v-if="m.status === 'loading'" class="typing"><span></span><span></span><span></span></div>
                <div v-else-if="m.status === 'cancelled'" class="status-box">
                  <span>{{ m.error }}</span>
                  <button class="text-btn" @click="$emit('regenerate', m.id)">重新生成</button>
                </div>
                <div v-else-if="m.status === 'error'" class="error">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{{ m.error }}</span>
                  <button class="text-btn" @click="$emit('regenerate', m.id)">重试</button>
                </div>
                <div v-else class="text-body">{{ m.text }}</div>
                <div v-if="m.status === 'done'" class="msg__foot">
                  <button class="text-btn" @click="$emit('regenerate', m.id)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 15-3.4L23 10M1 14l4.5 4.4A9 9 0 0 0 20.5 15"/></svg>
                    重新生成
                  </button>
                </div>
              </div>

              <!-- 视频回复 -->
              <div v-else-if="m.kind === 'video'" class="video-answer">
                <div v-if="m.status === 'loading'" class="video-progress">
                  <div class="vp-bar"><div class="vp-fill" :style="{ width: (m.progress || 0) + '%' }" /></div>
                  <span class="vp-text">{{ m.statusText || `视频生成中 ${m.progress || 0}%` }}</span>
                </div>
                <div v-else-if="m.status === 'cancelled'" class="status-box">
                  <span>{{ m.error }}</span>
                  <button class="text-btn" @click="$emit('regenerate', m.id)">重新生成</button>
                </div>
                <div v-else-if="m.status === 'error'" class="error">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{{ m.error }}</span>
                  <button class="text-btn" @click="$emit('regenerate', m.id)">重试</button>
                </div>
                <div v-else class="video-done">
                  <video :src="m.videoUrl" controls class="video-player" />
                  <div class="msg__foot">
                    <span class="meta">{{ videoMetaOf(m) }}</span>
                    <div class="foot-btns">
                      <a class="text-btn" :href="m.videoUrl" download target="_blank" rel="noopener">下载视频</a>
                      <button class="text-btn" @click="$emit('regenerate', m.id)">重新生成</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 图片回复 -->
              <template v-else>
                <!-- 生成中骨架 -->
                <div v-if="m.status === 'loading'" class="grid">
                  <div v-for="n in (m.options?.n || 1)" :key="n" class="skeleton">
                    <div class="skeleton__spin" />
                  </div>
                </div>

                <!-- 已停止 -->
                <div v-else-if="m.status === 'cancelled'" class="status-box">
                  <span>{{ m.error }}</span>
                  <button class="text-btn" @click="$emit('regenerate', m.id)">重新生成</button>
                </div>

                <!-- 错误 -->
                <div v-else-if="m.status === 'error'" class="error">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{{ m.error }}</span>
                  <button class="text-btn" @click="$emit('regenerate', m.id)">重试</button>
                </div>

                <!-- 结果 -->
                <div v-else>
                  <div class="grid" :class="'grid--' + (m.images.length > 1 ? 'multi' : 'single')">
                    <figure
                      v-for="(img, i) in m.images"
                      :key="i"
                      class="card"
                      @click="$emit('open-image', { urls: m.images.map(x => x.url), index: i })"
                    >
                      <img :src="img.url" :alt="m.prompt" loading="lazy" />
                      <figcaption class="card__bar">
                        <span class="card__hint">点击查看</span>
                        <span class="card__actions">
                          <button
                            class="card__btn"
                            title="上传到图床"
                            @click.stop="uploadImage(img)"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                          </button>
                          <a
                            class="card__dl"
                            :href="img.url"
                            download
                            target="_blank"
                            rel="noopener"
                            @click.stop
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                            </svg>
                          </a>
                        </span>
                      </figcaption>
                    </figure>
                  </div>

                  <div class="msg__foot">
                    <span class="meta">{{ sizeLabelOf(m.options) }} · {{ m.options?.n || 1 }} 张</span>
                    <button class="text-btn" @click="$emit('regenerate', m.id)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 15-3.4L23 10M1 14l4.5 4.4A9 9 0 0 0 20.5 15"/></svg>
                      重新生成
                    </button>
                  </div>

                  <p v-if="m.revisedPrompt" class="revised">
                    <span class="revised__tag">改写</span>{{ m.revisedPrompt }}
                  </p>
                </div>
              </template>
            </template>
            <div v-if="m.role === 'assistant' && m.status !== 'loading'" class="assistant-actions">
              <button class="text-btn text-btn--danger" @click="$emit('delete-message', m.id)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6" />
                </svg>
                删除回复
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 回到底部 -->
    <transition name="fade">
      <button v-if="!atBottom && chat && chat.messages.length" class="to-bottom" aria-label="回到底部" @click="scrollToBottom">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
      </button>
    </transition>

    <!-- 输入区 -->
    <div class="composer">
      <div v-if="mode === 'video'" class="video-opts">
        <div v-if="videoCooldown > 0" class="cooldown">
          视频生成每分钟最多创建 1 个任务，还需等待 {{ videoCooldown }} 秒
        </div>
        <div class="vo-group vo-group--mode">
          <span class="vo-label">模式</span>
          <button
            v-for="m in VIDEO_MODE_OPTIONS"
            :key="m.value"
            class="chip"
            :class="{ active: (options.videoMode || 'text') === m.value }"
            @click="options.videoMode = m.value"
          >{{ m.label }}</button>
        </div>
        <div class="vo-group">
          <span class="vo-label">时长</span>
          <button
            v-for="d in DURATION_OPTIONS"
            :key="d"
            class="chip chip--num"
            :class="{ active: (options.duration || 5) === d }"
            @click="options.duration = d"
          >{{ d }}秒</button>
        </div>
        <div class="vo-group">
          <span class="vo-label">比例</span>
          <button
            v-for="a in ASPECT_OPTIONS"
            :key="a"
            class="chip"
            :class="{ active: (options.aspect || '16:9') === a }"
            @click="options.aspect = a"
          >{{ a }}</button>
        </div>
        <input
          v-if="options.videoMode === 'image'"
          class="vo-input"
          v-model="options.image"
          type="url"
          placeholder="图片 URL"
        />
        <textarea
          v-else-if="options.videoMode === 'keyframes'"
          class="vo-input vo-input--area"
          v-model="options.keyframes"
          rows="2"
          placeholder="关键帧图片 URL，每行一个，至少 2 个"
        />
      </div>

      <div class="composer__box">
        <div class="composer__opts" v-if="mode === 'image'">
          <button class="opt" @click="optionsOpen = !optionsOpen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            {{ sizeLabel }} · {{ options.n }} 张
          </button>

          <transition name="pop">
            <div v-if="optionsOpen" class="popover" @click.stop>
              <div class="popover__group">
                <span class="popover__label">比例</span>
                <div class="chips">
                  <button
                    v-for="s in SIZE_OPTIONS"
                    :key="s.value"
                    class="chip"
                    :class="{ active: options.size === s.value }"
                    @click="options.size = s.value"
                  >
                    {{ s.label }}<em>{{ s.hint }}</em>
                  </button>
                </div>
              </div>
              <div class="popover__group">
                <span class="popover__label">每提示词张数</span>
                <div class="chips">
                  <button
                    v-for="n in COUNT_OPTIONS"
                    :key="n"
                    class="chip chip--num"
                    :class="{ active: options.n === n }"
                    @click="options.n = n"
                  >
                    {{ n }}
                  </button>
                </div>
              </div>
            </div>
          </transition>
        </div>

          <textarea
            ref="inputEl"
            v-model="prompt"
            class="composer__input"
            rows="1"
            :placeholder="placeholder"
            :disabled="loading"
            @input="autoGrow"
            @keydown.enter.exact.prevent="submit"
          />

        <button
          v-if="!loading"
          class="send"
          :disabled="!canSend"
          :title="sendTitle"
          @click="submit"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
        <button v-else class="send send--stop" title="停止生成" @click="$emit('stop')">
          <span class="stop-square" />
        </button>
      </div>
      <p class="composer__tip">AI 也有可能会犯错，内容请您仔细甄别</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { SIZE_OPTIONS, COUNT_OPTIONS } from '../lib/agnes'
import { uploadToImageBed, blobToBase64, randomImagePath } from '../lib/imageBed'
import { IMAGEBED_TOKEN } from '../config'

const props = defineProps({
  chat: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  mode: { type: String, default: 'image' },
  videoCooldown: { type: Number, default: 0 }
})
const emit = defineEmits(['send', 'stop', 'regenerate', 'delete-message', 'open-image', 'toast'])

const scrollEl = ref(null)
const inputEl = ref(null)
const prompt = ref('')
const optionsOpen = ref(false)
const options = ref({
  size: '1024x1024',
  n: 1,
  duration: 5,
  aspect: '16:9',
  videoMode: 'text',
  image: '',
  keyframes: ''
})
const atBottom = ref(true)

const imageSuggestions = [
  '一只橘猫在窗边晒太阳，水彩风格',
  '赛博朋克城市夜景，霓虹灯，电影感',
  '极简插画：一个人在山顶看日出',
  '治愈系小屋，温暖灯光，吉卜力风格'
]
const videoSuggestions = [
  '电影感镜头：清晨街角的咖啡店，雨停后水面反光，缓慢推进',
  '一位宇航员穿过花园小径，镜头环绕，柔和阳光，细节丰富',
  '产品展示视频：透明玻璃香水瓶在黑色台面旋转，聚光灯扫过',
  '竖版短视频：未来城市夜景，霓虹招牌闪烁，轻微手持镜头'
]
const textSuggestions = [
  '帮我把这个画面提示词优化得更适合生图',
  '给我 5 个国风漫画分镜创意',
  '把这段剧情改写成更有镜头感的提示词',
  '分析这个角色设定还能怎么强化'
]

const DURATION_OPTIONS = [3, 5, 10]
const ASPECT_OPTIONS = ['16:9', '9:16', '1:1', '4:3', '3:4']
const VIDEO_MODE_OPTIONS = [
  { value: 'text', label: '文生视频' },
  { value: 'image', label: '图生视频' },
  { value: 'keyframes', label: '关键帧' }
]

const sizeLabel = computed(
  () => SIZE_OPTIONS.find((s) => s.value === options.value.size)?.label || '正方形'
)

const suggestions = computed(() => {
  if (props.mode === 'video') return videoSuggestions
  if (props.mode === 'text') return textSuggestions
  return imageSuggestions
})

const emptyTitle = computed(() => {
  if (props.mode === 'video') return '想生成什么视频？'
  if (props.mode === 'text') return '想聊点什么？'
  return '想画点什么？'
})

const emptySub = computed(() => {
  if (props.mode === 'video') return '选择文生、图生或关键帧模式，Agnes 视频模型会异步生成结果。'
  if (props.mode === 'text') return '用 agnes-2.0-flash 继续创作提示词、分镜和设定。'
  return '用一句话描述画面，Agnes 生图模型替你画出来。'
})

const placeholder = computed(() => {
  if (props.loading) return '生成中…'
  if (props.mode === 'image') return '描述你想生成的画面…（多行=不同提示词）'
  if (props.mode === 'video') return '描述视频内容、动作、镜头运动和画面风格…'
  return '和 agnes-2.0-flash 聊点什么…'
})

function splitUrls(value) {
  return String(value || '')
    .split(/[\n,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

const canSend = computed(() => {
  if (!prompt.value.trim() || props.loading) return false
  if (props.mode === 'video' && props.videoCooldown > 0) return false
  if (props.mode !== 'video') return true
  if (options.value.videoMode === 'image') return Boolean(options.value.image.trim())
  if (options.value.videoMode === 'keyframes') return splitUrls(options.value.keyframes).length >= 2
  return true
})

const sendTitle = computed(() => {
  if (props.mode === 'video' && props.videoCooldown > 0) {
    return `请等待 ${props.videoCooldown} 秒后再生成视频`
  }
  return '发送'
})

function sizeLabelOf(opts) {
  if (!opts) return '正方形'
  return SIZE_OPTIONS.find((s) => s.value === opts.size)?.label || '正方形'
}

function videoModeLabelOf(opts) {
  return VIDEO_MODE_OPTIONS.find((m) => m.value === (opts?.videoMode || 'text'))?.label || '文生视频'
}

function videoMetaOf(message) {
  const parts = [videoModeLabelOf(message.options)]
  if (message.seconds) parts.push(message.seconds + ' 秒')
  if (message.options?.aspect) parts.push(message.options.aspect)
  return parts.join(' · ')
}

function useSuggestion(text) {
  prompt.value = text
  nextTick(autoGrow)
  inputEl.value?.focus()
}

function submit() {
  if (!canSend.value) return
  emit('send', prompt.value, { ...options.value, mode: props.mode })
  prompt.value = ''
  nextTick(() => {
    autoGrow()
    inputEl.value?.focus()
  })
}

function editPrompt(text) {
  prompt.value = text
  nextTick(() => {
    autoGrow()
    inputEl.value?.focus()
  })
}

async function copyPrompt(text) {
  try {
    await navigator.clipboard.writeText(text)
    emit('toast', '已复制提示词')
  } catch {
    emit('toast', '复制失败')
  }
}

async function uploadImage(img) {
  if (!IMAGEBED_TOKEN) {
    emit('toast', '未配置图床 Token，请在 src/config.js 填入')
    return
  }
  try {
    const blob = await (await fetch(img.url)).blob()
    const base64 = await blobToBase64(blob)
    const raw = await uploadToImageBed({
      path: randomImagePath('png'),
      base64,
      message: 'upload agnes image'
    })
    img.url = raw
    emit('toast', '已上传到图床，链接已替换')
  } catch (err) {
    emit('toast', '上传失败：' + (err.message || '未知错误'))
  }
}

function autoGrow() {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 180) + 'px'
}

function onScroll() {
  const el = scrollEl.value
  if (!el) return
  atBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 80
}

function scrollToBottom() {
  const el = scrollEl.value
  if (!el) return
  el.scrollTop = el.scrollHeight
  atBottom.value = true
}

watch(
  () => props.chat?.messages.length,
  async () => {
    await nextTick()
    if (atBottom.value) scrollToBottom()
  }
)
watch(
  () => props.loading,
  async () => {
    await nextTick()
    if (atBottom.value) scrollToBottom()
  }
)
</script>

<style scoped>
.chat {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--bg);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 28px 0 12px;
}

/* 空状态 */
.empty {
  max-width: 720px;
  margin: 6vh auto 0;
  padding: 0 20px;
  text-align: center;
}
.empty__logo {
  display: inline-flex;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 18px;
  box-shadow: var(--shadow);
}
.empty__title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px;
}
.empty__sub {
  color: var(--text-soft);
  margin: 0 0 26px;
  font-size: 15px;
}
.suggestions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  text-align: left;
}
.suggestion {
  border: 1px solid var(--border);
  background: var(--bg-soft);
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 14px;
  color: var(--text);
  line-height: 1.5;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
}
.suggestion:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.suggestion:active {
  transform: scale(0.99);
}
@media (max-width: 600px) {
  .suggestions {
    grid-template-columns: 1fr;
  }
}

/* 消息 */
.msg {
  max-width: 760px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  gap: 14px;
  animation: fadeUp 0.25s ease;
}
.msg--user {
  justify-content: flex-end;
}
.msg__avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  align-self: flex-start;
}
.msg__body {
  min-width: 0;
  max-width: 100%;
}
.msg--user .msg__body {
  display: flex;
  justify-content: flex-end;
}

.bubble {
  border-radius: 18px;
  padding: 12px 16px;
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
.bubble--user {
  background: var(--bg-hover);
  color: var(--text);
  border-bottom-right-radius: 4px;
  max-width: 560px;
  position: relative;
}
.bubble__actions {
  position: absolute;
  top: -14px;
  right: 6px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.15s, transform 0.15s;
}
.bubble--user:hover .bubble__actions {
  opacity: 1;
  transform: translateY(0);
}
.mini {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-soft);
  border-radius: 8px;
  box-shadow: var(--shadow);
}
.mini:hover {
  color: var(--text);
  border-color: var(--accent);
}
.mini--danger:hover {
  color: var(--danger);
  border-color: var(--danger);
}

/* 图像网格 */
.grid {
  display: grid;
  gap: 12px;
}
.grid--single {
  grid-template-columns: minmax(0, 420px);
}
.grid--multi {
  grid-template-columns: repeat(2, 1fr);
}
@media (max-width: 560px) {
  .grid--multi {
    grid-template-columns: 1fr;
  }
  .grid--single {
    grid-template-columns: minmax(0, 100%);
  }
}

.card {
  margin: 0;
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  cursor: zoom-in;
  animation: fadeUp 0.3s ease;
}
.card img {
  display: block;
  width: 100%;
  height: auto;
}
.card__bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.55), transparent);
  color: #fff;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.18s;
}
.card:hover .card__bar {
  opacity: 1;
}
.card__actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.card__dl {
  color: #fff;
  display: inline-flex;
  padding: 4px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.16);
}
.card__dl:hover {
  background: rgba(255, 255, 255, 0.3);
}
.card__btn {
  color: #fff;
  display: inline-flex;
  padding: 4px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.16);
  cursor: pointer;
  transition: background 0.15s;
}
.card__btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.msg__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}
.assistant-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 8px;
}
.meta {
  font-size: 12px;
  color: var(--text-soft);
}
.text-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: var(--accent);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 8px;
  transition: background 0.15s;
}
.text-btn:hover {
  background: var(--accent-soft);
}
.text-btn--danger {
  color: var(--danger);
}
.text-btn--danger:hover {
  background: #fdeeea;
}

.revised {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--text-soft);
  background: var(--bg-soft);
  border-left: 3px solid var(--accent);
  padding: 8px 12px;
  border-radius: 0 8px 8px 0;
  line-height: 1.6;
}
.revised__tag {
  display: inline-block;
  font-size: 11px;
  color: var(--accent);
  margin-right: 8px;
  font-weight: 600;
}

/* 错误 / 状态 */
.error,
.status-box {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--danger);
  background: #fdeeea;
  border: 1px solid #f6cfc5;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
}
.status-box {
  color: var(--text-soft);
  background: var(--bg-soft);
  border-color: var(--border);
}

/* 骨架 */
.skeleton {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  background: var(--bg-soft);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.skeleton__spin {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(16, 163, 127, 0.25);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* 回到底部 */
.to-bottom {
  position: absolute;
  bottom: 92px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-soft);
  border-radius: 50%;
  box-shadow: var(--shadow);
  z-index: 10;
}
.to-bottom:hover {
  color: var(--text);
}

/* 输入区 */
.composer {
  flex-shrink: 0;
  padding: 10px 20px 16px;
  background: linear-gradient(to top, var(--bg) 70%, transparent);
}
.composer__box {
  position: relative;
  max-width: 760px;
  margin: 0 auto;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--bg);
  box-shadow: var(--shadow);
  padding: 8px 8px 8px 14px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  transition: border-color 0.15s;
}
.composer__box:focus-within {
  border-color: var(--accent);
}

.composer__opts {
  position: relative;
}
.opt {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-soft);
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 6px 12px;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}
.opt:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.text-answer {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
  animation: fadeUp 0.25s ease;
}
.typing {
  display: inline-flex;
  gap: 5px;
  padding: 6px 2px;
}
.typing span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-soft);
  opacity: 0.5;
  animation: blink 1.2s infinite both;
}
.typing span:nth-child(2) {
  animation-delay: 0.2s;
}
.typing span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes blink {
  0%, 80%, 100% {
    transform: scale(0.7);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 0.9;
  }
}

.video-opts {
  max-width: 760px;
  margin: 0 auto 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
  padding: 12px 14px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.cooldown {
  flex-basis: 100%;
  color: #8a5a00;
  background: #fff6db;
  border: 1px solid #f3dda5;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
}
.vo-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.vo-group--mode {
  flex-basis: 100%;
}
.vo-label {
  font-size: 12px;
  color: var(--text-soft);
}
.vo-input {
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  background: var(--bg);
  color: var(--text);
}
.vo-input--area {
  min-width: 260px;
  min-height: 58px;
  resize: vertical;
  line-height: 1.5;
}
.vo-input:focus {
  outline: none;
  border-color: var(--accent);
}

.video-answer {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  animation: fadeUp 0.25s ease;
}
.video-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 8px;
}
.vp-bar {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  overflow: hidden;
}
.vp-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.4s ease;
}
.vp-text {
  font-size: 13px;
  color: var(--text-soft);
  white-space: nowrap;
}
.video-player {
  width: 100%;
  max-height: 480px;
  border-radius: 10px;
  background: #000;
  display: block;
}
.foot-btns {
  display: flex;
  gap: 12px;
  align-items: center;
}

.popover {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 0;
  width: 260px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow);
  padding: 14px;
  z-index: 20;
}
.popover__group + .popover__group {
  margin-top: 14px;
}
.popover__label {
  display: block;
  font-size: 12px;
  color: var(--text-soft);
  margin-bottom: 8px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 56px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  background: var(--bg-soft);
  border-radius: 10px;
  font-size: 13px;
  color: var(--text);
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.chip em {
  font-style: normal;
  font-size: 11px;
  color: var(--text-soft);
}
.chip--num {
  min-width: 44px;
  flex-direction: row;
}
.chip:hover {
  border-color: var(--accent);
}
.chip.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.composer__input {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-size: 15px;
  line-height: 1.6;
  max-height: 180px;
  padding: 8px 0;
  background: transparent;
  color: var(--text);
}
.composer__input:disabled {
  color: var(--text-soft);
}

.send {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border: none;
  border-radius: 12px;
  background: var(--accent);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, opacity 0.15s;
}
.send:hover:not(:disabled) {
  background: #0d8c6c;
}
.send:disabled {
  background: #c9d6d1;
  cursor: not-allowed;
}
.send--stop {
  background: var(--text-soft);
}
.send--stop:hover {
  background: #4a4a4a;
}
.stop-square {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: #fff;
}

.composer__tip {
  max-width: 760px;
  margin: 8px auto 0;
  text-align: center;
  font-size: 11px;
  color: var(--text-soft);
}

.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
