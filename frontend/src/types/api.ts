/** UI role used by the frontend (drives sidebar nav, color scheme, etc). */
export type Role = 'patient' | 'doctor' | 'nutritionist' | 'trainer' | 'admin'

export interface ApiSuccess<T> {
  success: true
  data: T
  meta: { timestamp: string; version: string }
}

export interface ApiError {
  success: false
  error: { code: string; message: string; details?: unknown }
  meta: { timestamp: string; version: string }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

/** Shape returned by the v3 backend. `rol` may be a comma-separated string. */
export interface AuthUser {
  id: string
  dni?: string | null
  email: string
  nombre_apellido?: string | null
  rol: string
  is_admin: boolean
  sexo?: string | null
  altura?: number | null
  telefono?: string | null
  fecha_nacimiento?: string | null
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

/** Map the backend's `rol` string (which can be 'user', 'doctor', 'admin' or
 * comma-separated combinations) to one of the UI role buckets. */
export function backendRoleToUIRole(rol: string, isAdmin: boolean): Role {
  const parts = (rol || '').split(',').map((r) => r.trim().toLowerCase())
  if (isAdmin || parts.includes('admin')) return 'admin'
  if (parts.includes('doctor') || parts.includes('medico') || parts.includes('médico')) return 'doctor'
  if (parts.includes('nutritionist') || parts.includes('nutricionista')) return 'nutritionist'
  if (parts.includes('trainer') || parts.includes('entrenador')) return 'trainer'
  return 'patient'
}
