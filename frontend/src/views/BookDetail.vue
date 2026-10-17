<template>
  <div class="container page-section" v-loading="loading">
    <!-- 面包屑导航 -->
    <el-breadcrumb separator="/" class="breadcrumb-bar">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/books' }">书籍列表</el-breadcrumb-item>
      <el-breadcrumb-item>{{ book?.title || '书籍详情' }}</el-breadcrumb-item>
    </el-breadcrumb>
    <template v-if="book">
      <el-row :gutter="24">
        <!-- 图片轮播 -->
        <el-col :xs="24" :sm="24" :md="10">
          <div class="detail-gallery">
            <el-carousel v-if="images.length" height="380px" indicator-position="outside">
              <el-carousel-item v-for="(img, i) in images" :key="i">
                <img :src="resolveImageUrl(img)" class="gallery-img" @error="onImgErr" />
              </el-carousel-item>
            </el-carousel>
            <div v-else class="gallery-placeholder">
              <span class="ph-title">{{ book.title }}</span>
              <span class="ph-text">暂无图片</span>
            </div>
          </div>
        </el-col>

        <!-- 书籍信息 -->
        <el-col :xs="24" :sm="24" :md="14">
          <h1 class="book-title">{{ book.title }}</h1>
          <div class="book-tags">
            <span class="condition-badge" :class="conditionClass">{{ book.condition }}</span>
            <el-tag size="small" effect="plain">{{ book.category }}</el-tag>
            <el-tag size="small" effect="plain" v-if="book.course">课程：{{ book.course }}</el-tag>
          </div>

          <div class="price-block">
            <span class="current-price">¥{{ formatPrice(book.price) }}</span>
            <span class="original-price" v-if="book.original_price">
              原价 ¥{{ formatPrice(book.original_price) }}
            </span>
          </div>

          <el-descriptions :column="1" border class="info-desc">
            <el-descriptions-item label="作者">{{ book.author || '—' }}</el-descriptions-item>
            <el-descriptions-item label="ISBN">{{ book.isbn || '—' }}</el-descriptions-item>
            <el-descriptions-item label="发布时间">
              {{ formatTime(book.created_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="浏览 / 收藏">
              {{ book.view_count || 0 }} / {{ book.favorite_count || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusTagType(book.status)" size="small">
                {{ BOOK_STATUS_MAP[book.status] || book.status }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div class="action-bar">
            <el-button
              type="primary"
              size="large"
              :disabled="!canBuy"
              @click="openBuyDialog"
            >
              {{ book.status === 'reserved' ? '已预订' : '立即购买 / 预订' }}
            </el-button>
            <el-button
              size="large"
              :type="isFav ? 'danger' : 'default'"
              :icon="Star"
              @click="toggleFavorite"
            >
              {{ isFav ? '已收藏' : '收藏' }}
            </el-button>
            <el-button size="large" :icon="ChatDotRound" @click="focusMessage">
              留言咨询
            </el-button>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="24" class="bottom-row">
        <!-- 书籍描述 -->
        <el-col :xs="24" :md="16">
          <div class="card">
            <h3 class="card-title">书籍描述</h3>
            <div class="desc-text">{{ book.description || '卖家暂未填写描述。' }}</div>
          </div>

          <!-- 留言咨询区 -->
          <div class="card">
            <h3 class="card-title">留言咨询</h3>
            <div class="msg-list">
              <div
                v-for="m in messages"
                :key="m.id"
                class="msg-item"
                :class="{ mine: m.sender_id === userStore.userId }"
              >
                <span class="msg-user">
                  {{ m.sender_id === userStore.userId ? '我' : (m.sender_nickname || '同学') }}：
                </span>
                <span class="msg-content">{{ m.content }}</span>
                <span class="msg-time">{{ formatTime(m.created_at) }}</span>
              </div>
              <el-empty v-if="!messages.length" description="暂无留言，快来咨询卖家吧" :image-size="60" />
            </div>
            <div class="msg-send">
              <el-input
                v-model="messageContent"
                type="textarea"
                :rows="2"
                placeholder="写下你想问的问题…"
                ref="msgInputRef"
              />
              <el-button type="primary" class="send-btn" :loading="sendingMsg" @click="sendMessage">
                发送
              </el-button>
            </div>
          </div>
        </el-col>

        <!-- 卖家信息 -->
        <el-col :xs="24" :md="8">
          <div class="card seller-card">
            <h3 class="card-title">卖家信息</h3>
            <div class="seller-row">
              <el-avatar :size="48">{{ sellerInitial }}</el-avatar>
              <div class="seller-meta">
                <div class="seller-name">{{ seller?.nickname || seller?.username }}</div>
                <div class="seller-college" v-if="seller?.college">{{ seller.college }}</div>
              </div>
            </div>
            <div class="seller-stats">
              <div class="stat">
                <div class="stat-num">{{ seller?.credit_score ?? 100 }}</div>
                <div class="stat-label">信用分</div>
              </div>
              <div class="stat">
                <div class="stat-num">{{ seller?.student_id ? '已认证' : '未认证' }}</div>
                <div class="stat-label">学号</div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 购买对话框 -->
      <el-dialog v-model="buyDialogVisible" title="确认购买" width="420px">
        <el-alert
          v-if="book.status !== 'on_sale'"
          :title="`当前状态：${BOOK_STATUS_MAP[book.status] || book.status}`"
          type="warning"
          :closable="false"
          style="margin-bottom: 12px"
        />
        <p>书籍：{{ book.title }}</p>
        <p>成交价格：<b style="color:#f56c6c">¥{{ formatPrice(book.price) }}</b></p>
        <el-input
          v-model="pickupLocation"
          placeholder="请填写自提点（如：图书馆一楼 / 宿舍楼下）"
          style="margin-top: 8px"
        />
        <template #footer>
          <el-button @click="buyDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="creatingOrder" @click="createOrder">
            确认下单
          </el-button>
        </template>
      </el-dialog>
    </template>

    <el-empty v-else-if="!loading" description="书籍不存在或已下架" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star, ChatDotRound } from '@element-plus/icons-vue'
import { booksApi } from '../api/books'
import { favoritesApi } from '../api/favorites'
import { ordersApi } from '../api/orders'
import { messagesApi } from '../api/messages'
import { useUserStore } from '../stores/user'
import { CONDITION_TAG_CLASS, BOOK_STATUS_MAP } from '../constants'
import { resolveImageUrl } from '../api/request'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const book = ref(null)
const seller = ref(null)
const loading = ref(false)
const images = ref([])
const messages = ref([])
const messageContent = ref('')
const sendingMsg = ref(false)
const msgInputRef = ref(null)

const isFav = ref(false)
const buyDialogVisible = ref(false)
const pickupLocation = ref('')
const creatingOrder = ref(false)

const conditionClass = computed(() =>
  book.value ? CONDITION_TAG_CLASS[book.value.condition] : ''
)
const sellerInitial = computed(() => {
  const n = seller.value?.nickname || seller.value?.username || '卖'
  return n.charAt(0).toUpperCase()
})
const canBuy = computed(() => {
  if (!book.value) return false
  return book.value.status === 'on_sale'
})

function parseImages(imgs) {
  if (!imgs) return []
  if (Array.isArray(imgs)) return imgs
  try {
    const arr = JSON.parse(imgs)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function formatPrice(p) {
  const n = Number(p)
  return isNaN(n) ? p : n.toFixed(2)
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return d.toLocaleString('zh-CN')
}

function statusTagType(s) {
  return { on_sale: 'success', reserved: 'warning', sold: 'info' }[s] || ''
}

function onImgErr(e) {
  e.target.style.opacity = 0.3
}

async function loadDetail() {
  loading.value = true
  try {
    const data = await booksApi.detail(route.params.id)
    book.value = data?.book || data
    seller.value = data?.seller
    images.value = parseImages(book.value?.images)
    await checkFavorite()
    await loadMessages()
  } catch (e) {
    book.value = null
  } finally {
    loading.value = false
  }
}

async function checkFavorite() {
  if (!userStore.isLoggedIn) return
  try {
    const data = await favoritesApi.list({ page: 1, pageSize: 100 })
    const favs = data?.list || data || []
    isFav.value = favs.some((f) => f.book_id === Number(route.params.id) || f.id === Number(route.params.id))
  } catch (e) {
    isFav.value = false
  }
}

async function toggleFavorite() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login', { query: { redirect: route.fullPath } })
    return
  }
  try {
    if (isFav.value) {
      await favoritesApi.remove(book.value.id)
      isFav.value = false
      ElMessage.success('已取消收藏')
    } else {
      await favoritesApi.add(book.value.id)
      isFav.value = true
      ElMessage.success('收藏成功')
    }
  } catch (e) {
    /* 错误已拦截器提示 */
  }
}

async function loadMessages() {
  try {
    const data = await messagesApi.list({ book_id: book.value.id, pageSize: 50 })
    messages.value = data?.list || data || []
  } catch (e) {
    messages.value = []
  }
}

function focusMessage() {
  nextTick(() => msgInputRef.value?.focus())
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
}

async function sendMessage() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  const content = messageContent.value.trim()
  if (!content) {
    ElMessage.warning('请输入留言内容')
    return
  }
  sendingMsg.value = true
  try {
    await messagesApi.send({
      book_id: book.value.id,
      receiver_id: seller.value.id,
      content
    })
    messageContent.value = ''
    ElMessage.success('留言已发送')
    await loadMessages()
  } catch (e) {
  } finally {
    sendingMsg.value = false
  }
}

function openBuyDialog() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login', { query: { redirect: route.fullPath } })
    return
  }
  pickupLocation.value = ''
  buyDialogVisible.value = true
}

async function createOrder() {
  if (!pickupLocation.value.trim()) {
    ElMessage.warning('请填写自提点')
    return
  }
  creatingOrder.value = true
  try {
    await ordersApi.create({
      book_id: book.value.id,
      pickup_location: pickupLocation.value.trim()
    })
    ElMessage.success('下单成功，请等待卖家确认')
    buyDialogVisible.value = false
    router.push('/my/orders')
  } catch (e) {
  } finally {
    creatingOrder.value = false
  }
}

onMounted(loadDetail)
</script>

<style scoped>
.breadcrumb-bar {
  margin-bottom: 16px;
}

.book-title {
  margin: 0 0 12px;
  font-size: 24px;
}

.book-tags {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.condition-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.price-block {
  background: #fff5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.current-price {
  color: #f56c6c;
  font-size: 28px;
  font-weight: 700;
}

.original-price {
  color: #b0b6bf;
  text-decoration: line-through;
  font-size: 14px;
}

.info-desc {
  margin-bottom: 16px;
}

.action-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-gallery {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.gallery-img {
  width: 100%;
  height: 380px;
  object-fit: contain;
  background: #f5f7fa;
}

.gallery-placeholder {
  height: 380px;
  background: linear-gradient(135deg, #67c23a, #529b2e);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  gap: 10px;
}

.ph-title {
  font-size: 18px;
  font-weight: 600;
  padding: 0 20px;
  text-align: center;
}

.ph-text {
  font-size: 13px;
  opacity: 0.9;
}

.bottom-row {
  margin-top: 24px;
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.card-title {
  margin: 0 0 16px;
  font-size: 16px;
}

.desc-text {
  color: #606266;
  line-height: 1.8;
  white-space: pre-wrap;
}

.msg-list {
  min-height: 80px;
  max-height: 260px;
  overflow-y: auto;
}

.msg-item {
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.6;
}

.msg-item.mine {
  text-align: right;
}

.msg-user {
  color: var(--primary-dark);
  font-weight: 500;
}

.msg-time {
  display: block;
  font-size: 11px;
  color: #b0b6bf;
}

.msg-send {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  align-items: flex-start;
}

.msg-send .el-textarea {
  flex: 1;
}

.seller-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.seller-name {
  font-weight: 600;
}

.seller-college {
  font-size: 12px;
  color: #909399;
}

.seller-stats {
  display: flex;
  margin-top: 16px;
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
}

.seller-stats .stat {
  flex: 1;
  text-align: center;
}

.seller-stats .stat-num {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
}

.seller-stats .stat-label {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .gallery-img,
  .gallery-placeholder {
    height: 260px;
  }
  .book-title {
    font-size: 20px;
  }
}
</style>
