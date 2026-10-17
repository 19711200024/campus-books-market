<template>
  <div class="container page-section">
    <h1 class="page-title">我的收藏</h1>

    <div v-loading="loading">
      <el-row :gutter="16" v-if="list.length">
        <el-col
          v-for="item in list"
          :key="item.id"
          :xs="12"
          :sm="8"
          :md="6"
          :lg="4"
          class="book-col"
        >
          <div class="fav-wrapper">
            <BookCard :book="bookOf(item)" />
            <el-button
              class="unfav-btn"
              size="small"
              type="danger"
              plain
              circle
              @click="remove(item)"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </el-col>
      </el-row>
      <el-empty v-else-if="!loading" description="还没有收藏任何书籍" />
    </div>

    <div class="pager" v-if="total > pageSize">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :current-page="page"
        :page-size="pageSize"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import BookCard from '../components/BookCard.vue'
import { favoritesApi } from '../api/favorites'

const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 收藏列表项可能是 { id, book_id, book } 或直接 book 字段
function bookOf(item) {
  return item.book || item.book_info || item
}

async function loadList() {
  loading.value = true
  try {
    const data = await favoritesApi.list({ page: page.value, pageSize: pageSize.value })
    list.value = data?.list || []
    total.value = data?.total || list.value.length
  } catch (e) {
    list.value = []
  } finally {
    loading.value = false
  }
}

async function remove(item) {
  const bookId = item.book_id || bookOf(item).id
  try {
    await favoritesApi.remove(bookId)
    ElMessage.success('已取消收藏')
    loadList()
  } catch (e) {
  }
}

function onPageChange(p) {
  page.value = p
  loadList()
}

onMounted(loadList)
</script>

<style scoped>
.page-title {
  margin: 0 0 16px;
  font-size: 20px;
}

.book-col {
  margin-bottom: 16px;
}

.fav-wrapper {
  position: relative;
}

.unfav-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 2;
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
