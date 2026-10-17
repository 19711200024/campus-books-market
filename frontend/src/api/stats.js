import request from './request'

export const statsApi = {
  home() {
    return request.get('/stats/home')
  }
}
