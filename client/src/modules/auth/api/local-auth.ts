export type AuthRole = "admin" | "teacher" | "student"

export type AuthUser = {
  id: string
  fullName: string
  email: string
  role: AuthRole
  studentId?: number
}

type StoredUser = AuthUser & {
  password: string
  createdAt: string
}

const usersKey = "school-system.auth.users"
const sessionKey = "school-system.auth.session"

const defaultUsers: StoredUser[] = [
  {
    id: "demo-teacher",
    fullName: "Dr. Faraday",
    email: "teacher@edumanager.test",
    password: "Teacher123!",
    role: "teacher",
    createdAt: new Date(0).toISOString(),
  },
  {
    id: "demo-student",
    fullName: "Maya Student",
    email: "student@edumanager.test",
    password: "Student123!",
    role: "student",
    studentId: 1,
    createdAt: new Date(0).toISOString(),
  },
]

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

function getStoredUsers() {
  const raw = window.localStorage.getItem(usersKey)

  if (!raw) {
    window.localStorage.setItem(usersKey, JSON.stringify(defaultUsers))
    return defaultUsers
  }

  try {
    const users = JSON.parse(raw) as StoredUser[]
    return Array.isArray(users) ? users : defaultUsers
  } catch {
    window.localStorage.setItem(usersKey, JSON.stringify(defaultUsers))
    return defaultUsers
  }
}

function setStoredUsers(users: StoredUser[]) {
  window.localStorage.setItem(usersKey, JSON.stringify(users))
}

function publicUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    studentId: user.studentId,
  }
}

function setSession(user: AuthUser) {
  window.localStorage.setItem(sessionKey, JSON.stringify(user))
}

export function getSession(): AuthUser | null {
  const raw = window.localStorage.getItem(sessionKey)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    window.localStorage.removeItem(sessionKey)
    return null
  }
}

export function logout() {
  window.localStorage.removeItem(sessionKey)
}

export function loginAccount(payload: LoginPayload) {
  const email = payload.email.trim().toLowerCase()
  const user = getStoredUsers().find((item) => item.email === email)

  if (!user || user.password !== payload.password) {
    throw new Error("Email or password is incorrect.")
  }

  const session = publicUser(user)
  setSession(session)
  return session
}

export function registerAccount(payload: RegisterPayload) {
  const fullName = payload.fullName.trim()
  const email = payload.email.trim().toLowerCase()
  const password = payload.password

  if (fullName.length < 2) {
    throw new Error("Enter your full name.")
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.")
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.")
  }

  const users = getStoredUsers()

  if (users.some((user) => user.email === email)) {
    throw new Error("An account with this email already exists.")
  }

  const nextStudentId = Math.max(1, ...users.map((user) => user.studentId ?? 0)) + 1
  const user: StoredUser = {
    id: crypto.randomUUID(),
    fullName,
    email,
    password,
    role: payload.role,
    studentId: payload.role === "student" ? nextStudentId : undefined,
    createdAt: new Date().toISOString(),
  }

  setStoredUsers([...users, user])

  const session = publicUser(user)
  setSession(session)
  return session
}
