import request from './request'

export const authApi = {
  // 登录
  login(data) {
    return request.post('/auth/login', data)
  },
  // 注册
  register(data) {
    return request.post('/auth/register', data)
  },
  // 获取当前用户
  me() {
    return request.get('/auth/me')
  },
  // 更新个人信息
  updateProfile(data) {
    return request.put('/auth/profile', data)
  }
}
