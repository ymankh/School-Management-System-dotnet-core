import axios, { type AxiosRequestConfig } from "axios"

import type { AuthRole } from "@/modules/auth/api/local-auth"

const api = axios.create({
  baseURL: "/api",
})

export type AdminUser = {
  id: number
  fullName: string
  email: string
  role: AuthRole
  studentId?: number | null
  createdAtUtc: string
}

export type Subject = {
  id: number
  name: string
  code: string
  description: string
  isActive: boolean
}

export type UserFilters = {
  role?: string
  search?: string
}

export type SubjectFilters = {
  includeInactive?: boolean
  search?: string
}

async function request<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await api.request<T>({ url: path, ...config })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = typeof error.response?.data === "string"
        ? error.response.data
        : error.response?.data?.error
      throw new Error(detail ?? `API request failed for ${path}`, { cause: error })
    }

    throw new Error(`API request failed for ${path}`, { cause: error })
  }
}

function toQuery(params: Record<string, string | boolean | undefined>) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      query.set(key, String(value))
    }
  })

  return query.toString()
}

export async function getUsers(filters: UserFilters = {}) {
  const query = toQuery(filters)
  const users = await request<AdminUser[]>(`/users${query ? `?${query}` : ""}`)
  return Array.isArray(users) ? users : []
}

export async function createUser(payload: {
  fullName: string
  email: string
  password: string
  role: AuthRole
}) {
  return request<AdminUser>("/users", { method: "POST", data: payload })
}

export async function updateUser(payload: {
  id: number
  fullName: string
  email: string
}) {
  return request<AdminUser>(`/users/${payload.id}`, { method: "PUT", data: payload })
}

export async function updateUserRole(payload: { id: number; role: AuthRole }) {
  return request<AdminUser>(`/users/${payload.id}/role`, { method: "PUT", data: { role: payload.role } })
}

export async function deleteUser(id: number) {
  await request<void>(`/users/${id}`, { method: "DELETE" })
}

export async function getSubjects(filters: SubjectFilters = {}) {
  const query = toQuery(filters)
  const subjects = await request<Subject[]>(`/subjects${query ? `?${query}` : ""}`)
  return Array.isArray(subjects) ? subjects : []
}

export async function createSubject(payload: {
  name: string
  code: string
  description: string
}) {
  return request<Subject>("/subjects", { method: "POST", data: payload })
}

export async function updateSubject(payload: {
  id: number
  name: string
  code: string
  description: string
  isActive: boolean
}) {
  return request<Subject>(`/subjects/${payload.id}`, { method: "PUT", data: payload })
}

export async function deleteSubject(id: number) {
  await request<void>(`/subjects/${id}`, { method: "DELETE" })
}
