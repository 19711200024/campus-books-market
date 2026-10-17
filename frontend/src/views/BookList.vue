<template>
  <div class="container page-section">
    <h1 class="page-title" v-if="route.query.keyword">
      “{{ route.query.keyword }}” 的搜索结果
    </h1>

    <BookFilter :model="filter" @change="onFilterChange" />

    <div v-loading="loading">
      <el-row :gutter="16" v-if="list.length">
        <el-col
          v-for="b in list"
          :key="b.id"
          :xs="12"
          :sm="8"
          :md="6"
          :lg="4"
          class="book-col"
        >
          <BookCard :book="b" />
        </el-col>
      </el-row>
      <el-empty v-else-if="!loading" description="暂无符合条件的书籍" />
    </div>

    <div class="pager" v-if="total > pageSize">
      <el-pagination
        background
        layout="prev, pager, next, total"
        :total="total"
        :current-page="page"
        :page-size="pageSize"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import BookCard from '../components/BookCard.vue'
import BookFilter from '../components/BookFilter.vue'
import { booksApi } from '../api/books'

const route = useRoute()

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(12)
const loading = ref(false)

const filter = reactive({
  keyword: route.query.keyword || '',
  category: route.query.category || '',
  condition: route.query.condition || '',
  sort: route.query.sort || 'newest'
})

async function loadBooks() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      sort: filter.sort,
      status: 'on_sale'
    }
    if (filter.keyword) params.keyword = filter.keyword
    if (filter.category) params.category = filter.category
    if (filter.condition) params.condition = filter.condition
    const data = await booksApi.list(params)
    list.value = data?.list || []
    total.value = data?.total || 0
  } catch (e) {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onFilterChange(newFilter) {
  Object.assign(filter, newFilter)
  page.value = 1
  loadBooks()
}

function onPageChange(p) {
  page.value = p
  loadBooks()
}

// 监听路由 query 变化（从顶部导航搜索跳转）
watch(
  () => route.query,
  (q) => {
    filter.keyword = q.keyword || ''
    filter.category = q.category || ''
    filter.condition = q.condition || ''
    filter.sort = q.sort || 'newest'
    page.value = 1
    loadBooks()
  }
)

onMounted(loadBooks)
</script>

<style scoped>
.page-title {
  font-size: 20px;
  margin: 0 0 16px;
  color: #303133;
}

.book-col {
  margin-bottom: 16px;
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
