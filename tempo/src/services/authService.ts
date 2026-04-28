export interface AuthUser {
  id: string
  name: string
  email: string
  password: string
  profile?: AuthUserProfile
  onboardingPending?: boolean
  createdAt: string
}

export interface AuthUserProfile {
  timezone: string
  workdayStart: string
  workdayEnd: string
  quietStart: string
  quietEnd: string
  travelBufferMinutes: number
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

export function getCurrentAuthUser(): AuthUser | null {
  const email = getCurrentUserEmail()
  if (!email) return null
  const users = readUsers()
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY)
}

export function signupUser(
  name: string,
  email: string,
  password: string,
  profileOverrides?: Partial<AuthUserProfile>
) {
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
    profile: {
      timezone: profileOverrides?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      workdayStart: profileOverrides?.workdayStart ?? '08:00',
      workdayEnd: profileOverrides?.workdayEnd ?? '22:00',
      quietStart: profileOverrides?.quietStart ?? '23:00',
      quietEnd: profileOverrides?.quietEnd ?? '07:00',
      travelBufferMinutes: profileOverrides?.travelBufferMinutes ?? 30,
    },
    onboardingPending: true,
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

export function isOnboardingPending(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase()
  const users = readUsers()
  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail)
  return Boolean(user?.onboardingPending)
}

export function completeOnboarding(email: string): AuthUser | null {
  const normalizedEmail = email.trim().toLowerCase()
  const users = readUsers()
  const idx = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail)
  if (idx < 0) return null
  const updated = { ...users[idx], onboardingPending: false }
  users[idx] = updated
  writeUsers(users)
  return updated
}

export function updateAuthUserProfile(
  email: string,
  updates: Partial<AuthUserProfile> & { name?: string }
): AuthUser | null {
  const normalizedEmail = email.trim().toLowerCase()
  const users = readUsers()
  const idx = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail)
  if (idx < 0) return null

  const existing = users[idx]
  const merged: AuthUser = {
    ...existing,
    name: updates.name ?? existing.name,
    profile: {
      timezone: existing.profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      workdayStart: existing.profile?.workdayStart ?? '08:00',
      workdayEnd: existing.profile?.workdayEnd ?? '22:00',
      quietStart: existing.profile?.quietStart ?? '23:00',
      quietEnd: existing.profile?.quietEnd ?? '07:00',
      travelBufferMinutes: existing.profile?.travelBufferMinutes ?? 30,
      ...updates,
    },
  }

  users[idx] = merged
  writeUsers(users)
  return merged
}
