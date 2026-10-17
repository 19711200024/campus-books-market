<template>
  <div class="container page-section">
    <div class="publish-card">
      <h1 class="page-title">发布二手书</h1>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="right"
        @submit.prevent
      >
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="书名" prop="title">
              <el-input v-model="form.title" placeholder="请输入书名" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="作者" prop="author">
              <el-input v-model="form.author" placeholder="请输入作者" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="ISBN">
              <el-input v-model="form.isbn" placeholder="选填" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="关联课程">
              <el-input v-model="form.course" placeholder="如：高等数学 A" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="售价" prop="price">
              <el-input v-model.number="form.price" placeholder="¥ 0.00">
                <template #prepend>¥</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="原价">
              <el-input v-model.number="form.original_price" placeholder="¥ 0.00">
                <template #prepend>¥</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="成色" prop="condition">
              <el-select v-model="form.condition" placeholder="请选择成色" style="width: 100%">
                <el-option v-for="c in CONDITIONS" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
                <el-option v-for="c in CATEGORIES" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="书籍描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="介绍一下这本书的情况、笔记情况、转手原因等"
          />
        </el-form-item>

        <el-form-item label="书籍图片">
          <el-upload
            list-type="picture-card"
            :action="uploadAction"
            :headers="uploadHeaders"
            :on-success="onUploadSuccess"
            :on-error="onUploadError"
            :before-upload="beforeUpload"
            :file-list="fileList"
            :limit="6"
            multiple
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">最多上传 6 张，支持 JPG / PNG。未上传时将使用占位图。</div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" :loading="submitting" @click="submit">
            立即发布
          </el-button>
          <el-button size="large" @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { booksApi } from '../api/books'
import { useUserStore } from '../stores/user'
import { CATEGORIES, CONDITIONS } from '../constants'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)

// 上传地址与 token
const uploadAction = '/api/books/upload'
const uploadHeaders = {
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`
}

const fileList = ref([])
const images = ref([])
const submitting = ref(false)

const form = reactive({
  title: '',
  author: '',
  isbn: '',
  price: '',
  original_price: '',
  condition: '',
  category: '',
  course: '',
  description: ''
})

const rules = {
  title: [{ required: true, message: '请输入书名', trigger: 'blur' }],
  author: [{ required: true, message: '请输入作者', trigger: 'blur' }],
  price: [{ required: true, message: '请输入售价', trigger: 'blur' }],
  condition: [{ required: true, message: '请选择成色', trigger: 'change' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

function beforeUpload(file) {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  return true
}

function onUploadSuccess(res, file) {
  // 兼容后端返回 { code, data: { url } } 或 { url }
  let url = ''
  if (res?.data?.url) url = res.data.url
  else if (res?.url) url = res.url
  else if (res?.code === 0 && res.data) url = res.data.url || res.data
  if (url) {
    images.value.push(url)
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.warning('图片已选择，但后端未返回 URL')
  }
}

function onUploadError() {
  ElMessage.error('图片上传失败（后端上传接口不可用，仍可发布文字信息）')
}

function resetForm() {
  formRef.value?.resetFields()
  images.value = []
  fileList.value = []
}

async function submit() {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await booksApi.create({
        ...form,
        price: Number(form.price),
        original_price: Number(form.original_price) || 0,
        images: images.value
      })
      ElMessage.success('发布成功！')
      router.push('/my/books')
    } catch (e) {
    } finally {
      submitting.value = false
    }
  })
}
</script>

<style scoped>
.publish-card {
  background: #fff;
  border-radius: 8px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.page-title {
  margin: 0 0 24px;
  font-size: 22px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .publish-card {
    padding: 16px;
  }
}
</style>
