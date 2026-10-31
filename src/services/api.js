
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

const publicAuthEndpoints = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
]

api.interceptors.request.use(
  (config) => {
    const requestUrl = (config.url || '').split('?')[0].replace(/\/+$/, '')

    const isPublicAuthRequest = publicAuthEndpoints.some(
      (endpoint) => requestUrl === endpoint,
    )

    if (isPublicAuthRequest) {
      // Public auth requests must not carry an old JWT.
      if (config.headers) {
        delete config.headers.Authorization
        delete config.headers.authorization
      }

      return config
    }

    const accessToken = localStorage.getItem('fintrack_access_token')
    const tokenType =
      localStorage.getItem('fintrack_token_type') || 'Bearer'

    if (accessToken) {
      config.headers.Authorization = `${tokenType} ${accessToken}`
    } else if (config.headers) {
      delete config.headers.Authorization
      delete config.headers.authorization
    }

    return config
  },
  (error) => Promise.reject(error),
)

export default api
