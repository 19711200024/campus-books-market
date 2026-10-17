<template>
  <div class="container page-section">
    <div class="page-head">
      <h1 class="page-title">我的发布</h1>
      <el-button type="primary" @click="$router.push('/publish')">发布新书</el-button>
    </div>

    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <el-tab-pane label="全部" name="" />
      <el-tab-pane label="在售" name="on_sale" />
      <el-tab-pane label="已预订" name="reserved" />
      <el-tab-pane label="已售出" name="sold" />
    </el-tabs>

    <div v-loading="loading">
      <el-table :data="list" stripe v-if="list.length">
        <el-table-column label="书籍" min-width="220">
          <template #default="{ row }">
            <div class="book-cell" @click="$router.push(`/books/${row.id}`)">
              <div class="cell-cover">
                <img v-if="coverOf(row)" :src="coverOf(row)" @error="(e) => (e.target.style.display='none')" />
                <span v-else class="cell-cover-text">{{ row.title?.slice(0, 4) }}</span>
              </div>
              <div class="cell-info">
                <div class="cell-title">{{ row.title }}</div>
                <div class="cell-author">{{ row.author }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="售价" width="100">
          <template #default="{ row }">
            <span class="price">¥{{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column label="成色" width="100">
          <template #default="{ row }">
            <span class="condition-badge" :class="conditionClass(row.condition)">
              {{ row.condition }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">
              {{ BOOK_STATUS_MAP[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="浏览/收藏" width="100">
          <template #default="{ row }">
            {{ row.view_count || 0 }} / {{ row.favorite_count || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-select
              :model-value="row.status"
              size="small"
              style="width: 90px; margin-right: 6px"
              @change="(val) => changeStatus(row, val)"
            >
              <el-option label="在售" value="on_sale" />
              <el-option label="预订" value="reserved" />
              <el-option label="售出" value="sold" />
            </el-select>
            <el-button size="small" @click="onEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else-if="!loading" description="还没有发布任何书籍" />
    </div>

    <!-- 编辑对话框 -->
    <el-dialog v-model="editVisible" title="编辑书籍" width="560px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="书名">
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="editForm.author" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="售价">
              <el-input v-model.number="editForm.price" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原价">
              <el-input v-model.number="editForm.original_price" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { booksApi } from '../api/books'
import { useUserStore } from '../stores/user'
import { CONDITION_TAG_CLASS, BOOK_STATUS_MAP } from '../constants'
import { resolveImageUrl } from '../api/request'

const userStore = useUserStore()
const list = ref([])
const loading = ref(false)
const activeTab = ref('')

const editVisible = ref(false)
const saving = ref(false)
const editId = ref(null)
const editForm = reactive({
  title: '',
  author: '',
  price: 0,
  original_price: 0,
  description: ''
})

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

function coverOf(row) {
  const imgs = parseImages(row.images)
  return imgs.length ? resolveImageUrl(imgs[0]) : ''
}

function conditionClass(c) {
  return CONDITION_TAG_CLASS[c] || ''
}

function statusType(s) {
  return { on_sale: 'success', reserved: 'warning', sold: 'info' }[s] || ''
}

async function loadList() {
  loading.value = true
  try {
    const params = { page: 1, pageSize: 50 }
    if (activeTab.value) params.status = activeTab.value
    const data = await booksApi.byUser(userStore.userId, params)
    list.value = data?.list || []
  } catch (e) {
    list.value = []
  } finally {
    loading.value = false
  }
}

function onTabChange() {
  loadList()
}

function onEdit(row) {
  editId.value = row.id
  Object.assign(editForm, {
    title: row.title,
    author: row.author,
    price: row.price,
    original_price: row.original_price,
    description: row.description
  })
  editVisible.value = true
}

async function saveEdit() {
  saving.value = true
  try {
    await booksApi.update(editId.value, { ...editForm })
    ElMessage.success('保存成功')
    editVisible.value = false
    loadList()
  } catch (e) {
  } finally {
    saving.value = false
  }
}

async function changeStatus(row, status) {
  try {
    await booksApi.updateStatus(row.id, status)
    ElMessage.success('状态已更新')
    row.status = status
  } catch (e) {
    loadList()
  }
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除《${row.title}》吗？此操作不可恢复。`, '提示', {
      type: 'warning'
    })
    await booksApi.remove(row.id)
    ElMessage.success('已删除')
    loadList()
  } catch (e) {
    /* 取消 */
  }
}

onMounted(loadList)
</script>

<style scoped>
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 20px;
}

.book-cell {
  display: flex;
  gap: 10px;
  cursor: pointer;
}

.cell-cover {
  width: 44px;
  height: 56px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--primary-lighter);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cell-cover-text {
  font-size: 11px;
  color: var(--primary-dark);
}

.cell-title {
  font-size: 14px;
  font-weight: 500;
}

.cell-author {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.price {
  color: #f56c6c;
  font-weight: 600;
}

.condition-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}
</style>
