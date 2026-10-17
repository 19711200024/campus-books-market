import request from './request'

export const favoritesApi = {
  list(params) {
    return request.get('/favorites', { params })
  },
  add(bookId) {
    return request.post('/favorites', { book_id: bookId })
  },
  remove(bookId) {
    return request.delete(`/favorites/${bookId}`)
  }
}
