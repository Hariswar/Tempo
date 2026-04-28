import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass, ChevronRight } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { getCurrentAuthUser } from '../services/authService'
import { readTutorialProgress, writeTutorialProgress } from '../services/tutorialService'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const firstName = useMemo(() => user.displayName.split(' ')[0] || user.displayName, [user.displayName])

  function startTutorialNow() {
    const authUser = getCurrentAuthUser()
    if (authUser) {
      const progress = readTutorialProgress(authUser.email)
      if (progress.step < 1) {
        writeTutorialProgress(authUser.email, { ...progress, step: 1 })
      }
    }
    navigate('/profile')
  }

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="max-w-2xl mx-auto space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <h2 className="text-lg font-bold text-text-primary">Welcome, {firstName}</h2>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Tempo now requires a guided onboarding. You will be walked through each major page,
            with required actions on each step before continuing.
          </p>
          <ul className="mt-3 text-xs text-text-secondary space-y-1">
            <li>1. Profile setup</li>
            <li>2. Calendar event creation</li>
            <li>3. AI assistant usage</li>
            <li>4. Notifications, Insights, and Settings walkthrough</li>
          </ul>
          <button
            onClick={startTutorialNow}
            className="mt-4 px-4 h-9 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #ff6a00, #ff8a00)' }}
          >
            <Compass size={14} />
            Start Required Tutorial
            <ChevronRight size={14} />
          </button>
        </motion.div>
      </div>
    </div>
  )
}
