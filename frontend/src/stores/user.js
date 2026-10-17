import { defineStore } from 'pinia'
import { authApi } from '../api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userId: (state) => state.user?.id || null
  },

  actions: {
    setAuth({ token, user }) {
      this.token = token
      this.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },

    async login(credentials) {
      const data = await authApi.login(credentials)
      // data: { token, user }
      this.setAuth(data)
      return data
    },

    async register(payload) {
      const data = await authApi.register(payload)
      this.setAuth(data)
      return data
    },

    async fetchProfile() {
      if (!this.token) return null
      try {
        const data = await authApi.me()
        this.user = data.user
        localStorage.setItem('user', JSON.stringify(data.user))
        return data.user
      } catch (e) {
        return null
      }
    },

    async updateProfile(payload) {
      const data = await authApi.updateProfile(payload)
      if (data && data.user) {
        this.user = data.user
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      return data
    },

    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})
