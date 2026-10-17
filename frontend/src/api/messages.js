import request from './request'

export const messagesApi = {
  list(params) {
    return request.get('/messages', { params })
  },
  send(data) {
    return request.post('/messages', data)
  },
  markRead(id) {
    return request.patch(`/messages/${id}/read`)
  }
}
