export interface AuthUser {
  id: string
  name: string
  email: string
  password: string
  createdAt: string
}

const USERS_KEY = 'tempo-auth-users'
const SESSION_KEY = 'tempo-auth-session'

function readUsers(): AuthUser[] {
  const raw = localStorage.getItem(USERS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as AuthUser[] : []
  } catch {
    return []
  }
}

function writeUsers(users: AuthUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function getCurrentUserEmail(): string | null {
  return localStorage.getItem(SESSION_KEY)
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY)
}

export function signupUser(name: string, email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const users = readUsers()
  const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail)
  if (existing) {
    throw new Error('An account with this email already exists.')
  }

  const created: AuthUser = {
    id: `u-${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    password,
    createdAt: new Date().toISOString(),
  }

  users.push(created)
  writeUsers(users)
  localStorage.setItem(SESSION_KEY, normalizedEmail)
  return created
}

export function loginUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const users = readUsers()
  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail)
  if (!user || user.password !== password) {
    throw new Error('Invalid email or password.')
  }

  localStorage.setItem(SESSION_KEY, normalizedEmail)
  return user
}
