<template>
  <div class="container page-section" v-loading="loading">
    <el-row :gutter="20">
      <!-- 左侧用户信息卡 -->
      <el-col :xs="24" :md="8">
        <div class="profile-card">
          <el-avatar :size="80" :src="avatarUrl">{{ userInitial }}</el-avatar>
          <h2 class="nickname">{{ user?.nickname || user?.username }}</h2>
          <p class="username">@{{ user?.username }}</p>

          <div class="credit-box">
            <span class="credit-label">信用分</span>
            <span class="credit-score">{{ user?.credit_score ?? 100 }}</span>
          </div>

          <el-descriptions :column="1" size="small" class="info-desc">
            <el-descriptions-item label="学号">{{ user?.student_id || '—' }}</el-descriptions-item>
            <el-descriptions-item label="学院">{{ user?.college || '—' }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ user?.phone || '—' }}</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ formatTime(user?.created_at) }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-col>

      <!-- 右侧：统计 + 编辑 -->
      <el-col :xs="24" :md="16">
        <!-- 统计 -->
        <el-row :gutter="16" class="stats-row">
          <el-col :xs="8">
            <div class="stat-card" @click="$router.push('/my/books')">
              <div class="num">{{ stats.published }}</div>
              <div class="label">我的发布</div>
            </div>
          </el-col>
          <el-col :xs="8">
            <div class="stat-card" @click="$router.push('/my/orders?role=buyer')">
              <div class="num">{{ stats.bought }}</div>
              <div class="label">我买到的</div>
            </div>
          </el-col>
          <el-col :xs="8">
            <div class="stat-card" @click="$router.push('/my/orders?role=seller')">
              <div class="num">{{ stats.sold }}</div>
              <div class="label">我卖出的</div>
            </div>
          </el-col>
        </el-row>

        <!-- 编辑资料 -->
        <div class="edit-card">
          <h3 class="card-title">编辑资料</h3>
          <el-form :model="editForm" label-width="80px">
            <el-form-item label="昵称">
              <el-input v-model="editForm.nickname" />
            </el-form-item>
            <el-form-item label="学院">
              <el-input v-model="editForm.college" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="editForm.phone" />
            </el-form-item>
            <el-form-item label="头像URL">
              <el-input v-model="editForm.avatar" placeholder="选填，头像图片链接" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="saveProfile">
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import { booksApi } from '../api/books'
import { ordersApi } from '../api/orders'
import { resolveImageUrl } from '../api/request'

const userStore = useUserStore()
const loading = ref(false)
const saving = ref(false)
const user = computed(() => userStore.user)

const editForm = reactive({
  nickname: '',
  college: '',
  phone: '',
  avatar: ''
})

const stats = ref({ published: 0, bought: 0, sold: 0 })

const avatarUrl = computed(() =>
  user.value?.avatar ? resolveImageUrl(user.value.avatar) : ''
)
const userInitial = computed(() => {
  const n = user.value?.nickname || user.value?.username || 'U'
  return n.charAt(0).toUpperCase()
})

function formatTime(t) {
  if (!t) return '—'
  return new Date(t).toLocaleDateString('zh-CN')
}

async function loadStats() {
  try {
    const [pub, bought, sold] = await Promise.all([
      booksApi.byUser(userStore.userId, { page: 1, pageSize: 1 }).catch(() => ({ total: 0 })),
      ordersApi.list({ role: 'buyer', page: 1, pageSize: 1 }).catch(() => ({ total: 0 })),
      ordersApi.list({ role: 'seller', page: 1, pageSize: 1 }).catch(() => ({ total: 0 }))
    ])
    stats.value = {
      published: pub?.total || 0,
      bought: bought?.total || 0,
      sold: sold?.total || 0
    }
  } catch (e) {
    /* ignore */
  }
}

async function loadUser() {
  loading.value = true
  try {
    const u = await userStore.fetchProfile()
    if (u) {
      editForm.nickname = u.nickname || ''
      editForm.college = u.college || ''
      editForm.phone = u.phone || ''
      editForm.avatar = u.avatar || ''
    }
    await loadStats()
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  saving.value = true
  try {
    await userStore.updateProfile(editForm)
    ElMessage.success('资料已更新')
  } catch (e) {
  } finally {
    saving.value = false
  }
}

onMounted(loadUser)
</script>

<style scoped>
.profile-card {
  background: #fff;
  border-radius: 8px;
  padding: 28px 20px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.nickname {
  margin: 12px 0 2px;
  font-size: 20px;
}

.username {
  margin: 0 0 16px;
  color: #909399;
  font-size: 13px;
}

.credit-box {
  background: var(--primary-lighter);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.credit-label {
  color: #529b2e;
  font-size: 13px;
}

.credit-score {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary-dark);
}

.info-desc {
  text-align: left;
}

.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 6px 16px rgba(103, 194, 58, 0.18);
}

.stat-card .num {
  font-size: 26px;
  font-weight: 700;
  color: var(--primary-color);
}

.stat-card .label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.edit-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.card-title {
  margin: 0 0 16px;
  font-size: 16px;
}
</style>
