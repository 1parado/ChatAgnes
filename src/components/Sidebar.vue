<template>
  <aside class="sidebar" :class="{ open, collapsed }">
    <div class="sidebar__head">
      <button class="new-chat" @click="$emit('new')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        新建对话
      </button>
      <button class="close-btn" aria-label="关闭" @click="$emit('close')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    <nav class="chat-list">
      <p v-if="chats.length === 0" class="chat-list__empty">还没有对话</p>
      <button
        v-for="c in chats"
        :key="c.id"
        class="chat-item"
        :class="{ active: c.id === activeId }"
        @click="$emit('select', c.id)"
      >
        <span class="chat-item__title">{{ c.title || '新对话' }}</span>
        <span class="chat-item__del" title="删除" @click.stop="$emit('delete', c.id)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6" />
          </svg>
        </span>
      </button>
    </nav>

    <div class="sidebar__foot">
      <div class="foot-info">Agnes 生图 ·by Paradox</div>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  chats: { type: Array, default: () => [] },
  activeId: { type: String, default: null },
  open: { type: Boolean, default: false },
  collapsed: { type: Boolean, default: false }
})
defineEmits(['new', 'select', 'delete', 'close'])
</script>

<style scoped>
.sidebar {
  width: 260px;
  flex-shrink: 0;
  background: var(--sidebar);
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: margin-left 0.25s ease;
}
@media (min-width: 769px) {
  .sidebar.collapsed {
    margin-left: -260px;
  }
}
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 40;
    transform: translateX(-100%);
    transition: transform 0.25s ease, margin-left 0.25s ease;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.4);
  }
  .sidebar.open {
    transform: translateX(0);
  }
}

.sidebar__head {
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 8px;
}

.new-chat {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: transparent;
  color: var(--sidebar-text);
  border-radius: 10px;
  font-size: 14px;
  transition: background 0.15s;
}
.new-chat:hover {
  background: var(--sidebar-hover);
}

.close-btn {
  width: 40px;
  height: 40px;
  display: none;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--sidebar-muted);
  border-radius: 10px;
}
.close-btn:hover {
  background: var(--sidebar-hover);
  color: var(--sidebar-text);
}
@media (max-width: 768px) {
  .close-btn {
    display: inline-flex;
  }
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chat-list__empty {
  color: var(--sidebar-muted);
  font-size: 13px;
  text-align: center;
  padding: 24px 0;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: var(--sidebar-text);
  border-radius: 9px;
  text-align: left;
  font-size: 14px;
  transition: background 0.15s;
}
.chat-item:hover {
  background: var(--sidebar-hover);
}
.chat-item.active {
  background: var(--sidebar-hover);
}

.chat-item__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-item__del {
  opacity: 0;
  display: inline-flex;
  color: var(--sidebar-muted);
  border-radius: 6px;
  padding: 4px;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
}
.chat-item:hover .chat-item__del {
  opacity: 1;
}
.chat-item__del:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.sidebar__foot {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.foot-info {
  font-size: 12px;
  color: var(--sidebar-muted);
  text-align: center;
}
</style>
