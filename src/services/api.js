
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('fintrack_access_token')
    const tokenType =
      localStorage.getItem('fintrack_token_type') || 'Bearer'

    if (accessToken) {
      config.headers.Authorization = `${tokenType} ${accessToken}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

export default api
