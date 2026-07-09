<template>
  <div class="gallery">
    <header class="g-head">
      <div class="g-head__inner">
        <h1 class="g-title">AI 画廊</h1>
        <p class="g-sub">来自 1parado/myPic 的公开图片</p>

        <div class="g-tools">
          <div class="g-sources">
            <button class="src" :class="{ active: source === 'public' }" @click="source = 'public'">公共画廊</button>
            <button class="src" :class="{ active: source === 'chat' }" @click="source = 'chat'">公共对话</button>
            <button class="src" :class="{ active: source === 'mine' }" @click="source = 'mine'">我的作品</button>
          </div>

          <div class="g-right">
            <div v-if="source !== 'mine'" class="g-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              <input v-model="query" type="search" :placeholder="source === 'chat' ? '搜索问题或回答…' : '搜索标题或提示词…'" />
            </div>
            <button v-else-if="source === 'mine' && mineItems.length" class="export-btn" @click="exportMine">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              导出为公共内容
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="g-body">
      <div v-if="source === 'public' && loadingPublic" class="g-empty">正在加载公共画廊…</div>
      <div v-else-if="source === 'public' && publicError" class="g-empty">{{ publicError }}</div>

      <div v-else-if="items.length === 0" class="g-empty">
        <template v-if="source === 'mine'">
          你还没有生成过图片。<a @click="$emit('goto-chat')">去生图里画一张 →</a>
        </template>
        <template v-else>没有匹配的结果</template>
      </div>

      <div v-else-if="source === 'chat'" class="qa-list">
        <div v-for="it in items" :key="it.id" class="qa">
          <div class="qa__q"><span class="qa__badge">Q</span>{{ it.question }}</div>
          <div class="qa__a"><span class="qa__badge qa__badge--a">A</span>{{ it.answer }}</div>
          <div v-if="it.author" class="qa__author">@{{ it.author }}</div>
        </div>
      </div>

      <div v-else class="masonry">
        <figure
          v-for="(it, i) in items"
          :key="it.id"
          class="card"
          @click="open(items, i)"
        >
          <img :src="it.image" :alt="it.title" loading="lazy" />
          <figcaption class="card__cap">
            <span class="card__title">{{ it.title }}</span>
            <span v-if="it.prompt" class="card__prompt">{{ it.prompt }}</span>
            <span v-if="it.author" class="card__author">@{{ it.author }}</span>
          </figcaption>
        </figure>
      </div>
    </div>

    <transition name="fade">
      <div v-if="lb" class="lightbox" @click="lb = null">
        <button class="lb-nav lb-prev" aria-label="上一张" @click.stop="step(-1)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" /></svg>
        </button>

        <div class="lb-stage" @click.stop>
          <img :src="lb.items[lb.index].image" :alt="lb.items[lb.index].title" class="lb-img" />
          <div class="lb-meta">
            <h3 class="lb-title">{{ lb.items[lb.index].title }}</h3>
            <p v-if="lb.items[lb.index].prompt" class="lb-prompt">{{ lb.items[lb.index].prompt }}</p>
            <p v-if="lb.items[lb.index].author" class="lb-author">@{{ lb.items[lb.index].author }}</p>
            <a class="lb-dl" :href="lb.items[lb.index].image" download target="_blank" rel="noopener">下载原图</a>
          </div>
        </div>

        <button class="lb-nav lb-next" aria-label="下一张" @click.stop="step(1)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>

        <button class="lb-close" aria-label="关闭" @click="lb = null">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>

        <span class="lb-count">{{ lb.index + 1 }} / {{ lb.items.length }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { loadChats } from '../lib/storage'

const emit = defineEmits(['goto-chat', 'toast'])

const source = ref('public')
const query = ref('')
const lb = ref(null)

const publicItems = ref([])
const loadingPublic = ref(false)
const publicError = ref('')
const chatItems = ref([])

const GITHUB_IMAGE_REPO = 'https://cdn.jsdelivr.net/gh/1parado/myPic@master'
const PUBLIC_IMAGE_NAMES = [
  'Pasted image 20260709142414.png',
  'Pasted image 20260709142427.png',
  'Pasted image 20260709142432.png',
  'Pasted image 20260709142438.png',
  'Pasted image 20260709142442.png',
  'Pasted image 20260709142451.png',
  'Pasted image 20260709151309.png',
  'Pasted image 20260709151336.png',
  'Pasted image 20260709151351.png',
  'Pasted image 20260709151407.png',
  'Pasted image 20260709151420.png',
  'Pasted image 20260709151428.png',
  'Pasted image 20260709151500.png'
]

const publicGithubItems = PUBLIC_IMAGE_NAMES.map((name, index) => ({
  id: `github-${index}-${name}`,
  title: name.replace(/\.[^.]+$/, ''),
  prompt: '',
  image: `${GITHUB_IMAGE_REPO}/${encodeURIComponent(name)}`,
  author: '1parado'
}))

const mineItems = computed(() => {
  const chats = loadChats()
  const out = []
  for (const chat of chats) {
    for (const m of chat.messages || []) {
      if (m.role === 'assistant' && m.status === 'done' && Array.isArray(m.images)) {
        for (const img of m.images) {
          if (img.url) {
            out.push({
              id: m.id + img.url.slice(-8),
              title: m.prompt || '未命名',
              prompt: m.prompt || '',
              image: img.url,
              category: '我的作品',
              author: '我'
            })
          }
        }
      }
    }
  }
  return out
})

const items = computed(() => {
  let list
  if (source.value === 'chat') list = chatItems.value
  else if (source.value === 'public') list = publicItems.value
  else list = mineItems.value

  const q = query.value.trim().toLowerCase()
  if (q) {
    list = list.filter((g) => {
      const a = (g.question || g.title || '').toLowerCase()
      const b = (g.answer || g.prompt || '').toLowerCase()
      return a.includes(q) || b.includes(q)
    })
  }
  return list
})

async function loadPublic() {
  loadingPublic.value = true
  publicError.value = ''
  try {
    publicItems.value = publicGithubItems
  } catch (e) {
    publicError.value = e.message || '加载失败'
  } finally {
    loadingPublic.value = false
  }
}

async function loadChat() {
  try {
    const res = await fetch('./community-chat.json', { cache: 'no-cache' })
    if (!res.ok) throw new Error('无法加载公共对话')
    const data = await res.json()
    chatItems.value = Array.isArray(data) ? data : []
  } catch (e) {
    chatItems.value = []
  }
}

function exportMine() {
  const data = mineItems.value.map((it, i) => ({
    id: i + 1,
    title: it.title,
    prompt: it.prompt,
    image: it.image,
    category: it.category,
    author: '我'
  }))
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'community.json'
  a.click()
  URL.revokeObjectURL(a.href)
  emit('toast', '已导出，将其覆盖 public/community.json 并推送即可公开')
}

function open(list, index) {
  lb.value = { items: list, index }
}
function step(dir) {
  if (!lb.value) return
  const len = lb.value.items.length
  lb.value.index = (lb.value.index + dir + len) % len
}
function onKey(e) {
  if (!lb.value) return
  if (e.key === 'Escape') lb.value = null
  else if (e.key === 'ArrowLeft') step(-1)
  else if (e.key === 'ArrowRight') step(1)
}
onMounted(() => {
  window.addEventListener('keydown', onKey)
  loadPublic()
  loadChat()
})
onUnmounted(() => window.removeEventListener('keydown', onKey))

watch(source, (v) => {
  lb.value = null
  if (v === 'public' && publicItems.value.length === 0) loadPublic()
  if (v === 'chat' && chatItems.value.length === 0) loadChat()
})
</script>

<style scoped>
.gallery {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  background: var(--bg);
}

.g-head {
  position: sticky;
  top: 0;
  z-index: 5;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}
.g-head__inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 20px 16px;
}
.g-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
}
.g-sub {
  margin: 4px 0 0;
  color: var(--text-soft);
  font-size: 14px;
}

.g-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.g-sources {
  display: flex;
  gap: 6px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 3px;
}
.src {
  border: none;
  background: transparent;
  color: var(--text-soft);
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 999px;
  transition: background 0.15s, color 0.15s;
}
.src.active {
  background: var(--bg);
  color: var(--text);
  box-shadow: var(--shadow);
}
.g-right {
  display: flex;
  align-items: center;
}
.g-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-soft);
  background: var(--bg);
  min-width: 220px;
}
.g-search input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--text);
  width: 100%;
}
.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 13px;
  padding: 8px 14px;
  border-radius: 999px;
  transition: background 0.15s;
}
.export-btn:hover {
  background: #d6efe6;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}
.chip {
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-soft);
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 999px;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.chip:hover {
  border-color: var(--accent);
  color: var(--text);
}
.chip.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.g-body {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
}
.g-empty {
  text-align: center;
  color: var(--text-soft);
  padding: 60px 0;
  font-size: 15px;
}
.g-empty a {
  color: var(--accent);
  cursor: pointer;
}

.masonry {
  column-count: 4;
  column-gap: 16px;
}
@media (max-width: 1024px) {
  .masonry { column-count: 3; }
}
@media (max-width: 720px) {
  .masonry { column-count: 2; }
}
@media (max-width: 460px) {
  .masonry { column-count: 1; }
}

.card {
  margin: 0 0 16px;
  break-inside: avoid;
  border-radius: 14px;
  overflow: hidden;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  cursor: zoom-in;
  position: relative;
  animation: fadeUp 0.3s ease;
}
.card img {
  display: block;
  width: 100%;
  height: auto;
}
.card__cap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 28px 14px 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.72), transparent);
  color: #fff;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.2s, transform 0.2s;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.card:hover .card__cap {
  opacity: 1;
  transform: translateY(0);
}
.card__title {
  font-size: 15px;
  font-weight: 600;
}
.card__prompt {
  font-size: 12px;
  opacity: 0.85;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card__author {
  font-size: 11px;
  opacity: 0.75;
}

/* 灯箱 */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  cursor: zoom-out;
}
.lb-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 92vw;
  max-height: 88vh;
  cursor: default;
}
.lb-img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 10px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.lb-meta {
  color: #fff;
  text-align: center;
  max-width: 560px;
}
.lb-title {
  margin: 0 0 6px;
  font-size: 18px;
}
.lb-prompt {
  margin: 0 0 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}
.lb-author {
  margin: 0 0 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
.lb-dl {
  color: #fff;
  font-size: 13px;
  text-decoration: none;
  padding: 8px 18px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 999px;
}
.lb-dl:hover {
  background: rgba(255, 255, 255, 0.3);
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
.lb-prev { left: 18px; }
.lb-next { right: 18px; }
.lb-close {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
}
.lb-close:hover {
  background: rgba(255, 255, 255, 0.22);
}
.lb-count {
  position: absolute;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.qa-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 760px;
  margin: 0 auto;
}
.qa {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px 18px;
  animation: fadeUp 0.25s ease;
}
.qa__q {
  display: flex;
  gap: 10px;
  align-items: baseline;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.6;
}
.qa__a {
  display: flex;
  gap: 10px;
  align-items: baseline;
  margin-top: 10px;
  font-size: 14px;
  color: var(--text-soft);
  line-height: 1.7;
}
.qa__badge {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: var(--accent);
}
.qa__badge--a {
  background: var(--text-soft);
}
.qa__author {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-soft);
}
</style>
