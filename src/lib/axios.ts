import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true, // send cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Response interceptor: handle 401 → refresh token ────────────────────────

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

function processQueue(error: unknown) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(undefined)
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const requestUrl = originalRequest?.url ?? ''
    const isPublicAuthRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/otp/') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout')

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isPublicAuthRequest
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await apiClient.post('/auth/refresh')
        processQueue(null)
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
