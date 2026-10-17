import request from './request'

export const booksApi = {
  // 书籍列表
  list(params) {
    return request.get('/books', { params })
  },
  // 书籍详情
  detail(id) {
    return request.get(`/books/${id}`)
  },
  // 发布书籍
  create(data) {
    return request.post('/books', data)
  },
  // 编辑书籍
  update(id, data) {
    return request.put(`/books/${id}`, data)
  },
  // 删除书籍
  remove(id) {
    return request.delete(`/books/${id}`)
  },
  // 更新书籍状态
  updateStatus(id, status) {
    return request.patch(`/books/${id}/status`, { status })
  },
  // 某用户发布的书籍
  byUser(userId, params) {
    return request.get(`/books/user/${userId}`, { params })
  },
  // 推荐书籍
  recommend(params) {
    return request.get('/books/recommend', { params })
  }
}
