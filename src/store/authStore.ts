import { create } from 'zustand'
import { PublicUser } from '@/types'
import { apiClient } from '@/lib/axios'

interface AuthState {
  user: PublicUser | null
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  setUser: (user: PublicUser | null) => void
  fetchMe: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),

  fetchMe: async () => {
    try {
      set({ isLoading: true })
      const res = await apiClient.get('/auth/me')
      set({
        user: res.data.data.user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false })
      window.location.href = '/login'
    }
  },
}))