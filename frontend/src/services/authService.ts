import { api, tokenStore } from './apiClient'
import type { AuthUser, LoginResponse, RegisterPayload } from '../types/api'

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
  async register(payload: RegisterPayload): Promise<{ user_id: number; status: string }> {
    return api.post<{ user_id: number; status: string }>('/auth/register', payload)
  },
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } finally {
      tokenStore.clear()
    }
  },
  /** Cheap token-validity probe (no body). Returns the decoded user when
   *  the token is still good, or throws ApiError(401) when it isn't. */
  validate(): Promise<{ valid: boolean; user: AuthUser }> {
    return api.get<{ valid: boolean; user: AuthUser }>('/auth/validate')
  },
  /** Mint a fresh token from the current one (extends the expiry). */
  async refresh(): Promise<AuthUser> {
    const data = await api.post<{ token: string; user: AuthUser }>('/auth/refresh')
    tokenStore.set(data.token)
    return data.user
  },
  /** Change the current user's password. Requires the old password. */
  changePassword(currentPassword: string, newPassword: string): Promise<{ changed: true }> {
    return api.post<{ changed: true }>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
  },
}
