import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// 后端服务地址（云端云托管）——已写死，如后端域名变化只改这一行
const API_BASE = 'https://campus-books-backend-330540-11-1509339634.sh.run.tcloudbase.com'

// 本地开发时想连本地后端，把上面那行改成：const API_BASE = ''
const request = axios.create({
  baseURL: API_BASE + '/api',
  timeout: 15000
})

// 请求拦截器：自动携带 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一处理 { code, message, data }
request.interceptors.response.use(
  (response) => {
    const res = response.data
    // 二进制或非标准响应直接返回
    if (res == null || typeof res !== 'object' || res.code === undefined) {
      return res
    }
    if (res.code === 0) {
      return res.data
    }
    // 业务错误
    ElMessage.error(res.message || '请求失败')
    if (res.code === 401) {
      localStorage.removeItem('token')
      router.push('/login')
    }
    return Promise.reject(new Error(res.message || 'Error'))
  },
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('token')
      ElMessage.error('登录已过期，请重新登录')
      router.push('/login')
    } else if (status === 403) {
      ElMessage.error('没有权限执行此操作')
    } else if (status === 404) {
      ElMessage.error('请求的资源不存在')
    } else if (status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else {
      ElMessage.error(error.response?.data?.message || error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request

// 图片地址解析工具：上传的图片在后端服务器，拼接后端域名
export function resolveImageUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith('/uploads')) return API_BASE + path
  if (path.startsWith('/')) return path
  return '/' + path
}
