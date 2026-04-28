import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, ChevronRight, Compass } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { completeOnboarding, getCurrentAuthUser, isOnboardingPending } from '../../services/authService'
import { clearTutorialProgress, readTutorialProgress, writeTutorialProgress, type TutorialProgress } from '../../services/tutorialService'

type TutorialStep = {
  title: string
  route: string
  description: string
  requirementLabel: string
  isComplete: (ctx: { path: string; progress: TutorialProgress; eventsCount: number }) => boolean
}

const STEPS: TutorialStep[] = [
  {
    title: 'Welcome & Tour Intro',
    route: '/onboarding',
    description: 'This tutorial is required once. We will walk through Profile, Calendar, AI, Notifications, Insights, and Settings.',
    requirementLabel: 'Open the onboarding page.',
    isComplete: ({ path }) => path === '/onboarding',
  },
  {
    title: 'Profile Page',
    route: '/profile',
    description: 'Profile controls your identity and scheduling defaults. Update your name or time preferences here.',
    requirementLabel: 'Visit the Profile page.',
    isComplete: ({ progress }) => progress.visitedRoutes.includes('/profile'),
  },
  {
    title: 'Calendar Page',
    route: '/',
    description: 'Calendar is your core workspace. Create at least one event to continue.',
    requirementLabel: 'Create at least one event.',
    isComplete: ({ eventsCount }) => eventsCount > 0,
  },
  {
    title: 'AI Assistant',
    route: '/',
    description: 'Use the AI panel for conflict resolution and schedule suggestions.',
    requirementLabel: 'Open the AI Assistant once.',
    isComplete: ({ progress }) => progress.aiOpened,
  },
  {
    title: 'Notifications Page',
    route: '/notifications',
    description: 'Notifications are actionable. Each item can take you to relevant pages/events.',
    requirementLabel: 'Visit Notifications page.',
    isComplete: ({ progress }) => progress.visitedRoutes.includes('/notifications'),
  },
  {
    title: 'Insights Page',
    route: '/insights',
    description: 'Insights helps you review completion trends and productivity signals.',
    requirementLabel: 'Visit Insights page.',
    isComplete: ({ progress }) => progress.visitedRoutes.includes('/insights'),
  },
  {
    title: 'Settings Page',
    route: '/settings',
    description: 'Settings lets you tune reminder and preference behavior.',
    requirementLabel: 'Visit Settings page.',
    isComplete: ({ progress }) => progress.visitedRoutes.includes('/settings'),
  },
]

export default function TutorialCoach() {
  const location = useLocation()
  const navigate = useNavigate()
  const { events, isAIPanelOpen, switchAuthUser } = useAppStore()

  const authUser = getCurrentAuthUser()
  const pending = authUser ? isOnboardingPending(authUser.email) : false
  const [progress, setProgress] = useState<TutorialProgress>(() =>
    authUser ? readTutorialProgress(authUser.email) : { step: 0, visitedRoutes: [], aiOpened: false }
  )

  useEffect(() => {
    if (!authUser) return
    setProgress(readTutorialProgress(authUser.email))
  }, [authUser?.email])

  useEffect(() => {
    if (!authUser || !pending) return
    const path = location.pathname
    if (progress.visitedRoutes.includes(path)) return
    const next = { ...progress, visitedRoutes: [...progress.visitedRoutes, path] }
    setProgress(next)
    writeTutorialProgress(authUser.email, next)
  }, [location.pathname, authUser?.email, pending, progress])

  useEffect(() => {
    if (!authUser || !pending || !isAIPanelOpen || progress.aiOpened) return
    const next = { ...progress, aiOpened: true }
    setProgress(next)
    writeTutorialProgress(authUser.email, next)
  }, [isAIPanelOpen, authUser?.email, pending, progress])

  const activeStepIndex = Math.min(progress.step, STEPS.length - 1)
  const step = STEPS[activeStepIndex]
  const done = useMemo(
    () => step?.isComplete({ path: location.pathname, progress, eventsCount: events.length }) ?? false,
    [step, location.pathname, progress, events.length]
  )

  if (!authUser || !pending || !step) return null
  const activeEmail = authUser.email

  function saveProgress(next: TutorialProgress) {
    setProgress(next)
    writeTutorialProgress(activeEmail, next)
  }

  function goToStepRoute() {
    navigate(step.route)
  }

  function goPrev() {
    if (activeStepIndex === 0) return
    const prevStep = activeStepIndex - 1
    saveProgress({ ...progress, step: prevStep })
    navigate(STEPS[prevStep].route)
  }

  function goNext() {
    if (!done) return
    if (activeStepIndex >= STEPS.length - 1) return
    const nextStep = activeStepIndex + 1
    saveProgress({ ...progress, step: nextStep })
    navigate(STEPS[nextStep].route)
  }

  function finishTutorial() {
    if (!done) return
    const updated = completeOnboarding(activeEmail)
    clearTutorialProgress(activeEmail)
    if (updated) {
      switchAuthUser(updated)
    }
    navigate('/')
  }

  return (
    <div
      className="fixed z-[80] left-1/2 -translate-x-1/2 w-[calc(100vw-16px)] max-w-2xl"
      style={{ bottom: 'calc(8px + var(--safe-bottom))' }}
    >
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'rgba(19,19,31,0.97)',
          border: '1px solid rgba(255,106,0,0.35)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium" style={{ color: '#ffb347' }}>
              Tutorial Step {activeStepIndex + 1} of {STEPS.length}
            </div>
            <h3 className="text-sm font-semibold text-text-primary mt-0.5">{step.title}</h3>
          </div>
          <button
            onClick={goToStepRoute}
            className="px-3 h-8 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 shrink-0"
            style={{ background: 'rgba(255,106,0,0.14)', border: '1px solid rgba(255,106,0,0.3)', color: '#ffb347' }}
          >
            <Compass size={13} />
            Go to page
          </button>
        </div>

        <p className="text-xs text-text-secondary mt-2 leading-relaxed">{step.description}</p>
        <div className="mt-2 text-[11px]" style={{ color: done ? '#10b981' : '#f59e0b' }}>
          {done ? 'Requirement complete.' : `Required: ${step.requirementLabel}`}
        </div>

        <div className="flex items-center justify-between gap-2 mt-3">
          <button
            onClick={goPrev}
            disabled={activeStepIndex === 0}
            className="px-3 h-8 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <ChevronLeft size={13} />
            Back
          </button>

          {activeStepIndex < STEPS.length - 1 ? (
            <button
              onClick={goNext}
              disabled={!done}
              className="px-3 h-8 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #ff6a00, #ff8a00)' }}
            >
              Next
              <ChevronRight size={13} />
            </button>
          ) : (
            <button
              onClick={finishTutorial}
              disabled={!done}
              className="px-3 h-8 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 disabled:opacity-40"
              style={{ background: done ? '#10b981' : 'linear-gradient(135deg, #ff6a00, #ff8a00)' }}
            >
              <CheckCircle2 size={13} />
              Complete Tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
