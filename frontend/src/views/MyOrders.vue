<template>
  <div class="container page-section">
    <h1 class="page-title">我的订单</h1>

    <el-tabs v-model="activeRole" @tab-change="loadOrders">
      <el-tab-pane label="全部订单" name="" />
      <el-tab-pane label="我买到的" name="buyer" />
      <el-tab-pane label="我卖出的" name="seller" />
    </el-tabs>

    <div v-loading="loading">
      <el-empty v-if="!list.length && !loading" description="暂无订单" />

      <div v-for="order in list" :key="order.id" class="order-card">
        <div class="order-head">
          <span class="order-no">订单号：#{{ order.id }}</span>
          <el-tag :type="ORDER_STATUS_MAP[order.status]?.type" size="small">
            {{ ORDER_STATUS_MAP[order.status]?.text || order.status }}
          </el-tag>
        </div>

        <div class="order-body" @click="goBook(order)">
          <div class="order-cover">
            <img
              v-if="coverOf(order)"
              :src="coverOf(order)"
              @error="(e) => (e.target.style.display='none')"
            />
            <span v-else class="order-cover-text">📕</span>
          </div>
          <div class="order-info">
            <div class="order-title">{{ bookTitle(order) }}</div>
            <div class="order-sub">
              {{ order.pickup_location ? '自提点：' + order.pickup_location : '' }}
            </div>
            <div class="order-time">
              {{ formatTime(order.created_at) }}
              <span v-if="order.buyer_id === userStore.userId" class="role-tag buyer">买家</span>
              <span v-else class="role-tag seller">卖家</span>
            </div>
          </div>
          <div class="order-price">¥{{ order.price }}</div>
        </div>

        <div class="order-actions">
          <!-- 买家操作 -->
          <template v-if="order.buyer_id === userStore.userId">
            <el-button
              v-if="order.status === 'pending'"
              size="small"
              type="danger"
              @click="updateStatus(order, 'cancelled')"
            >
              取消订单
            </el-button>
            <el-button
              v-if="order.status === 'confirmed'"
              size="small"
              type="primary"
              @click="updateStatus(order, 'completed')"
            >
              确认收货
            </el-button>
          </template>
          <!-- 卖家操作 -->
          <template v-else>
            <el-button
              v-if="order.status === 'pending'"
              size="small"
              type="primary"
              @click="updateStatus(order, 'confirmed')"
            >
              确认交易
            </el-button>
            <el-button
              v-if="order.status === 'confirmed'"
              size="small"
              type="success"
              @click="updateStatus(order, 'completed')"
            >
              完成交易
            </el-button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ordersApi } from '../api/orders'
import { useUserStore } from '../stores/user'
import { ORDER_STATUS_MAP } from '../constants'
import { resolveImageUrl } from '../api/request'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const list = ref([])
const loading = ref(false)
const activeRole = ref(route.query.role || '')

function parseImages(images) {
  if (!images) return []
  if (Array.isArray(images)) return images
  try {
    const a = JSON.parse(images)
    return Array.isArray(a) ? a : []
  } catch {
    return []
  }
}

function bookTitle(order) {
  return order.book?.title || order.book_title || `书籍 #${order.book_id}`
}

function coverOf(order) {
  const imgs = parseImages(order.book?.images)
  return imgs.length ? resolveImageUrl(imgs[0]) : ''
}

function formatTime(t) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN')
}

function goBook(order) {
  router.push(`/books/${order.book_id}`)
}

async function loadOrders() {
  loading.value = true
  try {
    const params = { page: 1, pageSize: 50 }
    if (activeRole.value) params.role = activeRole.value
    const data = await ordersApi.list(params)
    list.value = data?.list || []
  } catch (e) {
    list.value = []
  } finally {
    loading.value = false
  }
}

async function updateStatus(order, status) {
  try {
    await ElMessageBox.confirm('确定执行此操作吗？', '提示', { type: 'warning' })
    await ordersApi.updateStatus(order.id, status)
    ElMessage.success('操作成功')
    loadOrders()
  } catch (e) {
    /* 取消 */
  }
}

watch(() => route.query.role, (r) => {
  activeRole.value = r || ''
  loadOrders()
})

onMounted(loadOrders)
</script>

<style scoped>
.page-title {
  margin: 0 0 16px;
  font-size: 20px;
}

.order-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.order-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.order-no {
  font-size: 13px;
  color: #909399;
}

.order-body {
  display: flex;
  gap: 12px;
  cursor: pointer;
  align-items: center;
}

.order-cover {
  width: 56px;
  height: 72px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--primary-lighter);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.order-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.order-cover-text {
  font-size: 24px;
}

.order-info {
  flex: 1;
  min-width: 0;
}

.order-title {
  font-size: 15px;
  font-weight: 600;
}

.order-sub {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.order-time {
  font-size: 12px;
  color: #b0b6bf;
  margin-top: 4px;
}

.role-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 0 6px;
  border-radius: 3px;
  font-size: 11px;
}

.role-tag.buyer {
  background: #ecf5ff;
  color: #409eff;
}

.role-tag.seller {
  background: #f0f9eb;
  color: #67c23a;
}

.order-price {
  color: #f56c6c;
  font-weight: 700;
  font-size: 16px;
}

.order-actions {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed #ebeef5;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
