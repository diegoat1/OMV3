import { api, tokenStore } from './apiClient'
import type { AuthUser, LoginResponse } from '../types/api'

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    const data = await api.post<LoginResponse>('/auth/login', { email, password })
    tokenStore.set(data.token)
    return data.user
  },
  /** /auth/me wraps the payload as { user: {...} }, unwrap it. */
  async me(): Promise<AuthUser> {
    const data = await api.get<{ user: AuthUser }>('/auth/me')
    return data.user
  },
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } finally {
      tokenStore.clear()
    }
  },
}
