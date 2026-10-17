<template>
  <div class="auth-page">
    <div class="auth-card register-card">
      <div class="auth-header">
        <div class="auth-logo">📖</div>
        <h2>创建账号</h2>
        <p>加入校园二手书交易平台</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent>
        <el-row :gutter="12">
          <el-col :xs="24" :sm="12">
            <el-form-item prop="username">
              <el-input v-model="form.username" placeholder="用户名" size="large" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item prop="nickname">
              <el-input v-model="form.nickname" placeholder="昵称" size="large" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码（至少 6 位）"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="确认密码"
            size="large"
            show-password
          />
        </el-form-item>

        <el-row :gutter="12">
          <el-col :xs="24" :sm="12">
            <el-form-item prop="student_id">
              <el-input v-model="form.student_id" placeholder="学号" size="large" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item prop="college">
              <el-select v-model="form.college" placeholder="请选择学院" size="large" style="width: 100%">
                <el-option v-for="c in collegeList" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item prop="phone">
          <el-input v-model="form.phone" placeholder="手机号" size="large" />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="loading"
            @click="onSubmit"
          >
            注 册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="auth-footer">
        已有账号？<router-link to="/login">去登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)

const collegeList = [
  '计算机学院', '软件学院', '数学与统计学院', '物理学院',
  '外国语学院', '经济管理学院', '文学院', '法学院',
  '化学与材料学院', '生命科学学院', '机械工程学院', '电子工程学院',
  '艺术学院', '马克思主义学院', '教育科学学院', '医学院',
  '建筑学院', '新闻传播学院', '其他'
]

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  student_id: '',
  college: '',
  phone: ''
})

const validateConfirm = (rule, value, callback) => {
  if (value !== form.password) callback(new Error('两次输入的密码不一致'))
  else callback()
}

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ],
  student_id: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  college: [{ required: true, message: '请输入学院', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

async function onSubmit() {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const { confirmPassword, ...payload } = form
      await userStore.register(payload)
      ElMessage.success('注册成功，已自动登录')
      router.push('/')
    } catch (e) {
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  padding: 20px;
}

.auth-card {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 8px 30px rgba(103, 194, 58, 0.12);
}

.auth-header {
  text-align: center;
  margin-bottom: 24px;
}

.auth-logo {
  font-size: 40px;
}

.auth-header h2 {
  margin: 8px 0 4px;
  font-size: 22px;
}

.auth-header p {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.submit-btn {
  width: 100%;
}

.auth-footer {
  text-align: center;
  font-size: 13px;
  color: #909399;
}

.auth-footer a {
  color: var(--primary-color);
  text-decoration: none;
}
</style>
