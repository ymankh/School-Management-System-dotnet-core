import axios from "axios"

export type AuthRole = "admin" | "teacher" | "student"

export type AuthUser = {
  id: string
  fullName: string
  email: string
  role: AuthRole
  studentId?: number
}

export type RegisterPayload = {
  fullName: string
  email: string
  password: string
  role: AuthRole
}

export type LoginPayload = {
  email: string
  password: string
}

const sessionKey = "school-system.auth.session-user-id"

const api = axios.create({
  baseURL: "/api",
})

function setSession(user: AuthUser) {
  window.localStorage.setItem(sessionKey, user.id)
}

function toAuthError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = typeof error.response?.data === "string"
      ? error.response.data
      : error.response?.data?.error

    return new Error(message ?? fallback, { cause: error })
  }

  return new Error(fallback, { cause: error })
}

export async function getSession(): Promise<AuthUser | null> {
  const userId = window.localStorage.getItem(sessionKey)

  if (!userId) {
    return null
  }

  try {
    const response = await api.get<AuthUser>(`/auth/session/${userId}`)
    return response.data
  } catch {
    window.localStorage.removeItem(sessionKey)
    return null
  }
}

export function logout() {
  window.localStorage.removeItem(sessionKey)
}

export async function loginAccount(payload: LoginPayload) {
  try {
    const response = await api.post<AuthUser>("/auth/login", payload)
    setSession(response.data)
    return response.data
  } catch (error) {
    throw toAuthError(error, "Unable to log in.")
  }
}

export async function registerAccount(payload: RegisterPayload) {
  try {
    const response = await api.post<AuthUser>("/auth/register", payload)
    setSession(response.data)
    return response.data
  } catch (error) {
    throw toAuthError(error, "Unable to register.")
  }
}
