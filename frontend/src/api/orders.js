import request from './request'

export const ordersApi = {
  list(params) {
    return request.get('/orders', { params })
  },
  create(data) {
    return request.post('/orders', data)
  },
  updateStatus(id, status) {
    return request.patch(`/orders/${id}/status`, { status })
  }
}
