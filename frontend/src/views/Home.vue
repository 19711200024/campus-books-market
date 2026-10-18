<template>
  <div class="home">
    <!-- Hero 搜索区 -->
    <section class="hero">
      <div class="container hero-inner">
        <h1 class="hero-title">校园二手书交易平台</h1>
        <p class="hero-subtitle">淘好书 · 卖闲书 · 让知识在校园里流动</p>
        <div class="hero-search">
          <el-input
            v-model="keyword"
            size="large"
            placeholder="输入书名、作者或 ISBN 开始搜索"
            @keyup.enter="onSearch"
          >
            <template #append>
              <el-button type="primary" size="large" @click="onSearch">
                <el-icon><Search /></el-icon>
                <span style="margin-left:4px">搜索</span>
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
    </section>

    <div class="container page-section">
      <!-- 分类导航 -->
      <section class="section">
        <h2 class="section-title">分类导航</h2>
        <el-row :gutter="12">
          <el-col
            v-for="c in CATEGORIES"
            :key="c"
            :xs="8"
            :sm="4"
            :md="4"
            class="cat-col"
          >
            <div class="cat-item" @click="goCategory(c)">
              <div class="cat-icon">{{ CATEGORY_ICONS[c] }}</div>
              <div class="cat-name">{{ c }}</div>
            </div>
          </el-col>
        </el-row>
      </section>

      <!-- 平台统计 -->
      <section class="section" v-loading="statsLoading">
        <el-row :gutter="16">
          <el-col :xs="8" :sm="8" :md="8">
            <div class="stat-card" @click="goStat('books')" title="点击查看在售书籍">
              <div class="stat-num">{{ stats.total_books || 0 }}</div>
              <div class="stat-label">在售书籍</div>
            </div>
          </el-col>
          <el-col :xs="8" :sm="8" :md="8">
            <div class="stat-card" @click="goStat('users')" title="点击注册新同学">
              <div class="stat-num">{{ stats.total_users || 0 }}</div>
              <div class="stat-label">注册同学</div>
            </div>
          </el-col>
          <el-col :xs="8" :sm="8" :md="8">
            <div class="stat-card" @click="goStat('orders')" title="点击查看我的订单">
              <div class="stat-num">{{ stats.total_orders || 0 }}</div>
              <div class="stat-label">完成交易</div>
            </div>
          </el-col>
        </el-row>
      </section>

      <!-- 推荐书籍 -->
      <section class="section" v-if="recommendList.length">
        <div class="section-head">
          <h2 class="section-title">为你推荐</h2>
        </div>
        <el-row :gutter="16">
          <el-col
            v-for="b in recommendList"
            :key="'r' + b.id"
            :xs="12"
            :sm="8"
            :md="4"
          >
            <BookCard :book="b" />
          </el-col>
        </el-row>
      </section>

      <!-- 最新发布 -->
      <section class="section" v-loading="latestLoading">
        <div class="section-head">
          <h2 class="section-title">最新发布</h2>
          <router-link to="/books" class="more-link">查看更多 ›</router-link>
        </div>
        <el-row :gutter="16" v-if="latestList.length">
          <el-col
            v-for="b in latestList"
            :key="'l' + b.id"
            :xs="12"
            :sm="8"
            :md="4"
          >
            <BookCard :book="b" />
          </el-col>
        </el-row>
        <el-empty v-else description="暂无书籍" />
      </section>

      <!-- 热门书籍 -->
      <section class="section" v-loading="popularLoading">
        <div class="section-head">
          <h2 class="section-title">热门书籍</h2>
          <router-link to="/books?sort=popular" class="more-link">查看更多 ›</router-link>
        </div>
        <el-row :gutter="16" v-if="popularList.length">
          <el-col
            v-for="b in popularList"
            :key="'p' + b.id"
            :xs="12"
            :sm="8"
            :md="4"
          >
            <BookCard :book="b" />
          </el-col>
        </el-row>
        <el-empty v-else description="暂无书籍" />
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import BookCard from '../components/BookCard.vue'
import { CATEGORIES, CATEGORY_ICONS } from '../constants'
import { booksApi } from '../api/books'
import { statsApi } from '../api/stats'

const router = useRouter()
const keyword = ref('')

const stats = ref({})
const statsLoading = ref(false)

const recommendList = ref([])
const latestList = ref([])
const popularList = ref([])
const latestLoading = ref(false)
const popularLoading = ref(false)

function onSearch() {
  const q = keyword.value.trim()
  router.push({ path: '/books', query: q ? { keyword: q } : {} })
}

function goCategory(c) {
  router.push({ path: '/books', query: { category: c } })
}

// 统计卡片点击跳转：查看对应数据
function goStat(type) {
  if (type === 'books') {
    router.push('/books')
  } else if (type === 'users') {
    // 已登录时注册页会被路由守卫拦截，给出明确提示
    if (localStorage.getItem('token')) {
      ElMessage.info('当前已登录账号，如需注册新同学请先退出登录')
    } else {
      router.push('/register')
    }
  } else if (type === 'orders') {
    router.push('/my/orders')
  }
}

async function loadStats() {
  statsLoading.value = true
  try {
    const data = await statsApi.home()
    stats.value = data || {}
    if (Array.isArray(data?.recent_books) && !latestList.value.length) {
      latestList.value = data.recent_books.slice(0, 10)
    }
  } catch (e) {
    /* 后端未就绪时忽略 */
  } finally {
    statsLoading.value = false
  }
}

async function loadLatest() {
  latestLoading.value = true
  try {
    const data = await booksApi.list({ page: 1, pageSize: 10, sort: 'newest' })
    latestList.value = data?.list || []
  } catch (e) {
    latestList.value = []
  } finally {
    latestLoading.value = false
  }
}

async function loadPopular() {
  popularLoading.value = true
  try {
    const data = await booksApi.list({ page: 1, pageSize: 10, sort: 'popular' })
    popularList.value = data?.list || []
  } catch (e) {
    popularList.value = []
  } finally {
    popularLoading.value = false
  }
}

async function loadRecommend() {
  try {
    const data = await booksApi.recommend({ limit: 10 })
    recommendList.value = data?.list || data || []
  } catch (e) {
    recommendList.value = []
  }
}

onMounted(() => {
  loadStats()
  loadLatest()
  loadPopular()
  loadRecommend()
})
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, #67c23a 0%, #529b2e 100%);
  padding: 60px 0 70px;
  color: #fff;
}

.hero-inner {
  text-align: center;
}

.hero-title {
  margin: 0 0 10px;
  font-size: 34px;
  font-weight: 700;
}

.hero-subtitle {
  margin: 0 0 28px;
  font-size: 15px;
  opacity: 0.92;
}

.hero-search {
  max-width: 640px;
  margin: 0 auto;
}

.section {
  margin-bottom: 32px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-head .section-title {
  margin-bottom: 0;
}

.more-link {
  font-size: 13px;
  color: var(--primary-color);
  text-decoration: none;
}

.cat-col {
  margin-bottom: 12px;
}

.cat-item {
  background: #fff;
  border-radius: 8px;
  padding: 18px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.cat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(103, 194, 58, 0.2);
}

.cat-icon {
  font-size: 28px;
}

.cat-name {
  margin-top: 6px;
  font-size: 14px;
  color: #303133;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(103, 194, 58, 0.2);
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
}

.stat-label {
  margin-top: 6px;
  font-size: 13px;
  color: #909399;
}

@media (max-width: 768px) {
  .hero {
    padding: 40px 0 50px;
  }
  .hero-title {
    font-size: 24px;
  }
}
</style>
