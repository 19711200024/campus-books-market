<template>
  <header class="nav-bar">
    <div class="nav-inner container">
      <div class="nav-left">
        <router-link to="/" class="logo">
          <span class="logo-icon">📖</span>
          <span class="logo-text" v-if="!isMobile">校园二手书</span>
        </router-link>
        <el-button text class="home-btn" @click="router.push('/')">
          <el-icon><HomeFilled /></el-icon>
          <span v-if="!isMobile">首页</span>
        </el-button>
      </div>

      <div class="nav-search">
        <el-input
          v-model="keyword"
          placeholder="搜索书名 / 作者 / ISBN"
          clearable
          @keyup.enter="onSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button @click="onSearch" :icon="Search"></el-button>
          </template>
        </el-input>
      </div>

      <div class="nav-right">
        <el-button
          type="primary"
          class="publish-btn"
          @click="onPublish"
        >
          <el-icon v-if="!isMobile"><Plus /></el-icon>
          <span>我要发布</span>
        </el-button>

        <template v-if="userStore.isLoggedIn">
          <el-dropdown trigger="click" @command="onUserCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="userAvatar">
                {{ userInitial }}
              </el-avatar>
              <span class="username" v-if="!isMobile">
                {{ userStore.user?.nickname || userStore.user?.username }}
              </span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="myBooks">我的发布</el-dropdown-item>
                <el-dropdown-item command="myFavorites">我的收藏</el-dropdown-item>
                <el-dropdown-item command="myOrders">我的订单</el-dropdown-item>
                <el-dropdown-item command="myMessages">我的消息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>

        <template v-else>
          <el-button text @click="router.push('/login')">登录</el-button>
          <el-button type="primary" plain @click="router.push('/register')">注册</el-button>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import { resolveImageUrl } from '../api/request'

const router = useRouter()
const userStore = useUserStore()
const keyword = ref('')
const isMobile = ref(window.innerWidth < 768)

const userAvatar = computed(() =>
  userStore.user?.avatar ? resolveImageUrl(userStore.user.avatar) : ''
)
const userInitial = computed(() => {
  const name = userStore.user?.nickname || userStore.user?.username || ''
  return name ? name.charAt(0).toUpperCase() : 'U'
})

function onSearch() {
  const q = keyword.value.trim()
  router.push({ path: '/books', query: q ? { keyword: q } : {} })
}

function onPublish() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再发布书籍')
    router.push('/login', { query: { redirect: '/publish' } })
    return
  }
  router.push('/publish')
}

function onUserCommand(command) {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'myBooks':
      router.push('/my/books')
      break
    case 'myFavorites':
      router.push('/my/favorites')
      break
    case 'myOrders':
      router.push('/my/orders')
      break
    case 'myMessages':
      router.push('/my/messages')
      break
    case 'logout':
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/')
      break
  }
}

function handleResize() {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
</script>

<style scoped>
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 1000;
}

.nav-inner {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-left {
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: var(--primary-color);
  font-weight: 700;
  font-size: 18px;
}

.logo-icon {
  font-size: 24px;
}

.home-btn {
  color: #606266;
  font-size: 14px;
}
.home-btn:hover {
  color: var(--primary-color);
}

.nav-search {
  flex: 1;
  max-width: 480px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  outline: none;
}

.username {
  font-size: 14px;
  color: #303133;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .nav-bar,
  .nav-inner {
    height: 56px;
  }
  .nav-inner {
    gap: 8px;
  }
  .publish-btn span {
    display: none;
  }
  .username {
    display: none;
  }
}
</style>
