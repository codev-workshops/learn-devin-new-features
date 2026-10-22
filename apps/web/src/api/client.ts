import axios, { AxiosError } from 'axios'
import type { ApiErrorBody } from './types'

export const TOKEN_KEY = 'ldnf.token'

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function errorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined
    if (body?.error) {
      return body.error.details?.length ? `${body.error.message}: ${body.error.details.join('; ')}` : body.error.message
    }
    return error.message
  }
  return error instanceof Error ? error.message : 'Unexpected error'
}
