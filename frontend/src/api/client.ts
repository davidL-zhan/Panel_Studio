// DDD §07-component-architecture.md — REST API Client
// 职责边界：仅负责 HTTP 传输和错误分类，不持有状态、不操作 Store
import axios, { type AxiosInstance, type AxiosError } from 'axios'
import { ApiError } from '@/types/api'

const BASE_URL = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'
const TIMEOUT = 15000

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
})

// 响应拦截：统一错误分类 (SDD §02-api-contract §4)
client.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ detail?: string | Array<{ msg: string }> }>) => {
    const status = error.response?.status ?? 500
    let detail = '未知错误'

    const data = error.response?.data
    if (data?.detail) {
      detail = Array.isArray(data.detail)
        ? data.detail.map((d) => d.msg).join('; ')
        : data.detail
    } else if (error.message) {
      detail = error.message
    }

    throw new ApiError(status, detail)
  },
)

export default client
