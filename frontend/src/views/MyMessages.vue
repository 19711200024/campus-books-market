<template>
  <div class="container page-section">
    <h1 class="page-title">我的消息</h1>

    <el-row :gutter="16">
      <!-- 会话列表 -->
      <el-col :xs="24" :md="8">
        <div class="conv-panel">
          <div
            v-for="conv in conversations"
            :key="conv.key"
            class="conv-item"
            :class="{ active: activeKey === conv.key }"
            @click="selectConv(conv)"
          >
            <div class="conv-title">
              {{ conv.book_title || `书籍 #${conv.book_id}` }}
            </div>
            <div class="conv-last">
              {{ conv.messages[conv.messages.length - 1]?.content || '' }}
            </div>
          </div>
          <el-empty v-if="!conversations.length && !loading" description="暂无消息" :image-size="60" />
        </div>
      </el-col>

      <!-- 对话内容 -->
      <el-col :xs="24" :md="16">
        <div class="chat-panel" v-loading="loading">
          <template v-if="activeConv">
            <div class="chat-header">
              关于《{{ activeConv.book_title || '书籍' }}》的对话
            </div>
            <div class="chat-body" ref="chatBodyRef">
              <div
                v-for="m in activeConv.messages"
                :key="m.id"
                class="bubble-row"
                :class="{ mine: m.sender_id === userStore.userId }"
              >
                <el-avatar :size="32" class="bubble-avatar">
                  {{ (m.sender_nickname || '同').charAt(0) }}
                </el-avatar>
                <div class="bubble">
                  <div class="bubble-content">{{ m.content }}</div>
                  <div class="bubble-time">{{ formatTime(m.created_at) }}</div>
                </div>
              </div>
            </div>
            <div class="chat-input">
              <el-input
                v-model="replyContent"
                placeholder="输入回复…"
                @keyup.enter="sendReply"
              />
              <el-button type="primary" @click="sendReply" :loading="sending">
                发送
              </el-button>
            </div>
          </template>
          <el-empty v-else description="选择一个会话开始查看" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { messagesApi } from '../api/messages'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const messages = ref([])
const conversations = ref([])
const activeConv = ref(null)
const activeKey = ref('')
const replyContent = ref('')
const sending = ref(false)
const loading = ref(false)
const chatBodyRef = ref(null)

function formatTime(t) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN', { hour12: false })
}

// 将消息按 book_id + 对端聚合为会话
function groupConversations(list) {
  const map = new Map()
  const myId = userStore.userId
  list.forEach((m) => {
    const peer = m.sender_id === myId ? m.receiver_id : m.sender_id
    const key = `${m.book_id}_${peer}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        book_id: m.book_id,
        book_title: m.book?.title || m.book_title || '',
        peer_id: peer,
        messages: []
      })
    }
    map.get(key).messages.push(m)
  })
  // 每个会话内按时间排序
  const arr = Array.from(map.values())
  arr.forEach((c) => c.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)))
  // 会话列表按最新消息时间倒序
  arr.sort((a, b) => {
    const ta = a.messages[a.messages.length - 1].created_at
    const tb = b.messages[b.messages.length - 1].created_at
    return new Date(tb) - new Date(ta)
  })
  return arr
}

async function loadMessages() {
  loading.value = true
  try {
    const data = await messagesApi.list({ page: 1, pageSize: 200 })
    messages.value = data?.list || []
    conversations.value = groupConversations(messages.value)
    if (conversations.value.length && !activeConv.value) {
      selectConv(conversations.value[0])
    }
  } catch (e) {
    conversations.value = []
  } finally {
    loading.value = false
  }
}

function selectConv(conv) {
  activeConv.value = conv
  activeKey.value = conv.key
  // 标记已读
  conv.messages
    .filter((m) => m.receiver_id === userStore.userId && !m.is_read)
    .forEach((m) => messagesApi.markRead(m.id).catch(() => {}))
  nextTick(() => scrollToBottom())
}

function scrollToBottom() {
  const el = chatBodyRef.value
  if (el) el.scrollTop = el.scrollHeight
}

async function sendReply() {
  const content = replyContent.value.trim()
  if (!content) {
    ElMessage.warning('请输入回复内容')
    return
  }
  sending.value = true
  try {
    await messagesApi.send({
      book_id: activeConv.value.book_id,
      receiver_id: activeConv.value.peer_id,
      content
    })
    replyContent.value = ''
    ElMessage.success('已发送')
    await loadMessages()
  } catch (e) {
  } finally {
    sending.value = false
  }
}

onMounted(loadMessages)
</script>

<style scoped>
.page-title {
  margin: 0 0 16px;
  font-size: 20px;
}

.conv-panel {
  background: #fff;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  max-height: 600px;
  overflow-y: auto;
}

.conv-item {
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.conv-item:hover,
.conv-item.active {
  background: var(--primary-lighter);
}

.conv-title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-last {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-panel {
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  height: 600px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.chat-header {
  padding: 14px 16px;
  border-bottom: 1px solid #ebeef5;
  font-weight: 600;
}

.chat-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #fafafa;
}

.bubble-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  align-items: flex-start;
}

.bubble-row.mine {
  flex-direction: row-reverse;
}

.bubble-avatar {
  flex-shrink: 0;
}

.bubble {
  max-width: 70%;
}

.bubble-content {
  background: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.bubble-row.mine .bubble-content {
  background: var(--primary-color);
  color: #fff;
}

.bubble-time {
  font-size: 11px;
  color: #b0b6bf;
  margin-top: 4px;
}

.bubble-row.mine .bubble-time {
  text-align: right;
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
}

@media (max-width: 768px) {
  .chat-panel {
    height: 480px;
    margin-top: 12px;
  }
}
</style>
