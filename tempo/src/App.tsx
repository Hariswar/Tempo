import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import CalendarPage from './pages/CalendarPage'
import InsightsPage from './pages/InsightsPage'
import SettingsPage from './pages/SettingsPage'
import NotificationsPage from './pages/NotificationsPage'
import AuthPage from './pages/AuthPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProfilePage from './pages/ProfilePage'
import OnboardingPage from './pages/OnboardingPage'
import { getCurrentAuthUser, isOnboardingPending } from './services/authService'
import { useAppStore } from './stores/appStore'
import './App.css'

function GuestOnly({ children }: { children: ReactNode }) {
  const authUser = getCurrentAuthUser()
  if (!authUser) return children
  return <Navigate to={isOnboardingPending(authUser.email) ? '/onboarding' : '/'} replace />
}

function ProtectedShell() {
  const authUser = getCurrentAuthUser()
  if (!authUser) return <Navigate to="/auth" replace />

  return <AppShell />
}

export default function App() {
  const switchAuthUser = useAppStore((s) => s.switchAuthUser)

  useEffect(() => {
    switchAuthUser(getCurrentAuthUser())
  }, [switchAuthUser])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="auth" element={<GuestOnly><AuthPage /></GuestOnly>} />
        <Route path="login" element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="signup" element={<GuestOnly><SignupPage /></GuestOnly>} />
        <Route element={<ProtectedShell />}>
          <Route index element={<CalendarPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="onboarding" element={<OnboardingPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
