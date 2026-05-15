import { api } from './apiClient'
import type { StaticProfile, UpdateUserPayload } from '../types/api'

interface GetUserResponse {
  user: {
    id: number
    auth_user_id?: number | null
    nombre: string
    email?: string | null
    sexo?: 'M' | 'F' | null
    altura?: number | null
    envergadura?: number | null
    fecha_nacimiento?: string | null
    telefono?: string | null
    circ_cuello?: number | null
    circ_muneca?: number | null
    circ_tobillo?: number | null
    created_at?: string
    updated_at?: string | null
  }
  perfil_dinamico?: unknown
  objetivo?: unknown
}

export const userService = {
  /** GET /users/<id> — adapted into the `StaticProfile` shape the UI expects.
   *  The local backend exposes `/users/<id>` (returning { user, perfil_dinamico, objetivo });
   *  we project the patient row into StaticProfile and derive `perfil_completo`. */
  async getStaticProfile(userId: number | string): Promise<StaticProfile> {
    const r = await api.get<GetUserResponse>(`/users/${userId}`)
    const u = r.user
    return {
      user_id: String(userId),
      patient_id: u.id,
      auth_user_id: u.auth_user_id ?? null,
      nombre: u.nombre,
      email: u.email ?? null,
      sexo: u.sexo ?? null,
      altura: u.altura ?? null,
      envergadura: u.envergadura ?? null,
      fecha_nacimiento: u.fecha_nacimiento ?? null,
      telefono: u.telefono ?? null,
      circ_cuello: u.circ_cuello ?? null,
      circ_muneca: u.circ_muneca ?? null,
      circ_tobillo: u.circ_tobillo ?? null,
      created_at: u.created_at ?? '',
      updated_at: u.updated_at ?? '',
      perfil_completo: Boolean(u.sexo && u.altura && u.circ_cuello),
    }
  },

  /** Update constitutional fields (sexo / altura / circ_cuello / etc).
   *  Returns the merged user record from the backend. */
  update(userId: number | string, payload: UpdateUserPayload): Promise<unknown> {
    return api.put<unknown>(`/users/${userId}`, payload)
  },

  /** Hard delete on the clinical patient row + cascade. Admin only. */
  delete(userId: number | string): Promise<{ user_id: string }> {
    return api.delete<{ user_id: string }>(`/users/${userId}`)
  },
}
