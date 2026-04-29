import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, ChevronRight, Compass, Hand, X } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { completeOnboarding, getCurrentAuthUser, isOnboardingPending } from '../../services/authService'
import {
  TUTORIAL_PROGRESS_EVENT,
  clearTutorialProgress,
  getDefaultTutorialProgress,
  readTutorialProgress,
  startTutorialSession,
  stopTutorialSession,
  type TutorialMode,
  type TutorialProgress,
  writeTutorialProgress,
} from '../../services/tutorialService'

type TutorialStep = {
  id: string
  title: string
  route: string
  targetIds: string[]
  description: string
  instructions: string[]
  requirementLabel: string
  isComplete: (ctx: {
    path: string
    progress: TutorialProgress
    notificationsCount: number
  }) => boolean
  autoAdvance?: boolean
}

function hasVisited(progress: TutorialProgress, route: string) {
  return progress.visitedRoutes.includes(route)
}

function hasClicked(progress: TutorialProgress, targetId: string) {
  return progress.interactedTargets.includes(targetId)
}

function hasClickedAny(progress: TutorialProgress, targetIds: string[]) {
  return targetIds.some((targetId) => hasClicked(progress, targetId))
}

const REQUIRED_INTRO_STEP: TutorialStep = {
  id: 'required-intro',
  title: 'Welcome to Tempo',
  route: '/onboarding',
  targetIds: ['onboarding-start-tutorial'],
  description:
    'This onboarding is guided and required once. Every step highlights the exact place to click before you can continue.',
  instructions: [
    'Read the step details in this coach bubble.',
    'Tap only the highlighted control to complete each step.',
    'Start by tapping the highlighted Start Required Tutorial button.',
  ],
  requirementLabel: 'Tap the highlighted Start Required Tutorial button.',
  isComplete: ({ progress }) => hasClicked(progress, 'onboarding-start-tutorial'),
  autoAdvance: true,
}

const CORE_STEPS: TutorialStep[] = [
  {
    id: 'profile-basics',
    title: 'Profile Page Basics',
    route: '/profile',
    targetIds: ['profile-display-name'],
    description:
      'Profile is where account identity and default scheduling behavior are managed. This is the first place to check for user-specific setup.',
    instructions: [
      'Tap the highlighted Display Name input.',
      'You can edit your name and review your account email on this page.',
      'Profile preferences carry into scheduling behavior.',
    ],
    requirementLabel: 'Tap the highlighted Display Name field.',
    isComplete: ({ progress }) => hasClicked(progress, 'profile-display-name'),
  },
  {
    id: 'calendar-open-modal',
    title: 'Open the Event Creator',
    route: '/',
    targetIds: ['header-new-event'],
    description:
      'Calendar is the main planning surface. The New button is the primary entrypoint for event creation.',
    instructions: [
      'Go to Calendar if needed.',
      'Tap the highlighted New button in the top bar.',
      'This opens the event modal.',
    ],
    requirementLabel: 'Tap the highlighted New button.',
    isComplete: ({ progress }) => hasClicked(progress, 'header-new-event'),
  },
  {
    id: 'calendar-event-title',
    title: 'Event Title',
    route: '/',
    targetIds: ['event-modal-title'],
    description:
      'Title is the only required field. Without a title, the event cannot be created.',
    instructions: [
      'In the event modal, tap the highlighted title field.',
      'Type a clear event name (for example: Study Session).',
      'The Create button stays disabled until this field has text.',
    ],
    requirementLabel: 'Type a title in the highlighted field.',
    isComplete: ({ progress }) => progress.eventTitleEntered,
  },
  {
    id: 'calendar-event-category',
    title: 'Event Category',
    route: '/',
    targetIds: ['event-modal-category-section'],
    description:
      'Category controls color coding and helps Tempo classify event types in calendar and insights.',
    instructions: [
      'Look at the highlighted category chips.',
      'Tap one chip to assign a category.',
      'Choose the option that best matches the event.',
    ],
    requirementLabel: 'Tap a category chip.',
    isComplete: ({ progress }) => hasClicked(progress, 'event-modal-category-chip'),
  },
  {
    id: 'calendar-event-time',
    title: 'Start and End Time',
    route: '/',
    targetIds: ['event-modal-time-start'],
    description:
      'Time fields define duration and placement on the calendar.',
    instructions: [
      'Tap the highlighted Start field.',
      'Tap the End field as well.',
      'Set times that reflect the real event duration.',
    ],
    requirementLabel: 'Interact with both Start and End time fields.',
    isComplete: ({ progress }) =>
      hasClicked(progress, 'event-modal-time-start') && hasClicked(progress, 'event-modal-time-end'),
  },
  {
    id: 'calendar-event-flexibility',
    title: 'Flexibility Rules',
    route: '/',
    targetIds: ['event-modal-flexibility-section'],
    description:
      'Flexibility tells Tempo whether this event can be moved during conflict resolution.',
    instructions: [
      'Review Fixed, Semi-flexible, and Flexible.',
      'Tap one flexibility option.',
      'Use Fixed for immovable events and Flexible for moveable work.',
    ],
    requirementLabel: 'Tap a flexibility option.',
    isComplete: ({ progress }) => hasClicked(progress, 'event-modal-flexibility-option'),
  },
  {
    id: 'calendar-event-details',
    title: 'Notes and Location',
    route: '/',
    targetIds: ['event-modal-description-section'],
    description:
      'Description and location add context so reminders and planning suggestions are more useful.',
    instructions: [
      'Tap the Description field to add notes (agenda, checklist, details).',
      'Tap the Location control to add a place or GPS context.',
      'These are optional but strongly recommended for actionable schedules.',
    ],
    requirementLabel: 'Interact with Description or Location.',
    isComplete: ({ progress }) =>
      hasClickedAny(progress, ['event-modal-description', 'event-modal-location']),
  },
  {
    id: 'calendar-create-event',
    title: 'Create and Save the Event',
    route: '/',
    targetIds: ['event-modal-create'],
    description:
      'Now finalize and save the event. This confirms event creation works correctly for the current logged-in user.',
    instructions: [
      'Check that title and key fields look correct.',
      'Tap the highlighted Create Event button.',
      'After save, the event should appear in your calendar and this step completes.',
    ],
    requirementLabel: 'Create one event successfully.',
    isComplete: ({ progress }) => progress.eventCreated,
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant Access',
    route: '/',
    targetIds: ['header-ai-toggle', 'mobile-ai-toggle', 'sidebar-ai-toggle'],
    description:
      'The AI assistant can suggest schedules and resolve conflicts. You should know exactly where to open it.',
    instructions: [
      'Tap the highlighted AI control (header, bottom nav, or sidebar).',
      'The assistant panel should open.',
      'You can close it after confirming it opens correctly.',
    ],
    requirementLabel: 'Open the AI assistant panel once.',
    isComplete: ({ progress }) => progress.aiOpened,
  },
  {
    id: 'notification-panel',
    title: 'Quick Notifications Panel',
    route: '/',
    targetIds: ['header-notifications'],
    description:
      'The top-right bell opens the quick notification panel. It is separate from the full Notifications page.',
    instructions: [
      'Tap the highlighted bell in the top-right header.',
      'This opens the quick notification panel.',
      'Use this for fast checks without leaving Calendar.',
    ],
    requirementLabel: 'Tap the highlighted top-right bell button.',
    isComplete: ({ progress }) => hasClicked(progress, 'header-notifications'),
  },
  {
    id: 'notification-page',
    title: 'Notifications Page',
    route: '/notifications',
    targetIds: ['notifications-page-first-item', 'notifications-page-list'],
    description:
      'The full Notifications page is for detailed review and deeper actions. Notification items can route you directly to relevant app pages.',
    instructions: [
      'Open the Notifications page.',
      'Tap a notification item if one exists.',
      'If there are none, tap inside the highlighted notifications area.',
    ],
    requirementLabel: 'Interact with the Notifications page content area.',
    isComplete: ({ progress, notificationsCount }) =>
      hasVisited(progress, '/notifications') &&
      (notificationsCount > 0
        ? hasClicked(progress, 'notifications-page-first-item')
        : hasClicked(progress, 'notifications-page-list')),
  },
  {
    id: 'insights-page',
    title: 'Insights Page',
    route: '/insights',
    targetIds: ['insights-title'],
    description:
      'Insights summarizes completion, trends, and productivity patterns to help plan better schedules.',
    instructions: [
      'Navigate to the Insights page.',
      'Review the highlighted page title section.',
      'This is where analytics and planning metrics live.',
    ],
    requirementLabel: 'Open the Insights page.',
    isComplete: ({ progress }) => hasVisited(progress, '/insights'),
  },
  {
    id: 'settings-page',
    title: 'Settings Page',
    route: '/settings',
    targetIds: ['settings-title'],
    description:
      'Settings controls preferences for schedule behavior, reminders, and account-level defaults.',
    instructions: [
      'Navigate to the Settings page.',
      'Review the highlighted page title section.',
      'This is where long-term app behavior is configured.',
    ],
    requirementLabel: 'Open the Settings page.',
    isComplete: ({ progress }) => hasVisited(progress, '/settings'),
  },
]

const FINISH_STEP: TutorialStep = {
  id: 'finish',
  title: 'Tutorial Complete',
  route: '/profile',
  targetIds: [],
  description:
    'You have completed the guided walkthrough of Profile, Calendar, AI, Notifications, Insights, and Settings.',
  instructions: [
    'Use Back if you want to revisit any step before finishing.',
    'Select Finish Tutorial to close this guide.',
  ],
  requirementLabel: 'All guided steps are complete.',
  isComplete: () => true,
}

function getStepsForMode(mode: TutorialMode): TutorialStep[] {
  if (mode === 'required') {
    return [REQUIRED_INTRO_STEP, ...CORE_STEPS, FINISH_STEP]
  }
  return [...CORE_STEPS, FINISH_STEP]
}

function clampStep(step: number, max: number): number {
  return Math.max(0, Math.min(step, max))
}

function sameProgress(a: TutorialProgress, b: TutorialProgress): boolean {
  if (
    a.active !== b.active ||
    a.mode !== b.mode ||
    a.step !== b.step ||
    a.aiOpened !== b.aiOpened ||
    a.baselineEventsCount !== b.baselineEventsCount ||
    a.eventTitleEntered !== b.eventTitleEntered ||
    a.eventCreated !== b.eventCreated
  ) {
    return false
  }
  if (a.visitedRoutes.length !== b.visitedRoutes.length) return false
  if (a.interactedTargets.length !== b.interactedTargets.length) return false
  for (let i = 0; i < a.visitedRoutes.length; i += 1) {
    if (a.visitedRoutes[i] !== b.visitedRoutes[i]) return false
  }
  for (let i = 0; i < a.interactedTargets.length; i += 1) {
    if (a.interactedTargets[i] !== b.interactedTargets[i]) return false
  }
  return true
}

function nextUnique(list: string[], value: string) {
  return list.includes(value) ? list : [...list, value]
}

function findStepTarget(targetIds: string[]) {
  for (const targetId of targetIds) {
    const el = document.querySelector<HTMLElement>(`[data-tutorial-id="${targetId}"]`)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) continue
    return {
      id: targetId,
      rect,
    }
  }
  return null
}

export default function TutorialCoach() {
  const location = useLocation()
  const navigate = useNavigate()
  const { events, notifications, isAIPanelOpen, switchAuthUser } = useAppStore()

  const authUser = getCurrentAuthUser()
  const pending = authUser ? isOnboardingPending(authUser.email) : false
  const [progress, setProgress] = useState<TutorialProgress>(getDefaultTutorialProgress())
  const [target, setTarget] = useState<{ id: string; rect: DOMRect } | null>(null)

  const activeEmail = authUser?.email ?? null

  useEffect(() => {
    if (!activeEmail) {
      setProgress(getDefaultTutorialProgress())
      return
    }
    const saved = readTutorialProgress(activeEmail)
    if (pending && !saved.active) {
      const started = startTutorialSession(activeEmail, 'required', events.length, 0)
      setProgress(started)
      if (location.pathname !== '/onboarding') {
        navigate('/onboarding', { replace: true })
      }
      return
    }
    setProgress(saved)
  }, [activeEmail, pending, events.length, location.pathname, navigate])

  useEffect(() => {
    if (!activeEmail) return
    const normalizedActiveEmail = activeEmail.trim().toLowerCase()
    function handleProgressEvent(event: Event) {
      const detail = (event as CustomEvent<{ email?: string }>).detail
      if (!detail?.email) return
      if (detail.email !== normalizedActiveEmail) return
      setProgress(readTutorialProgress(normalizedActiveEmail))
    }
    window.addEventListener(TUTORIAL_PROGRESS_EVENT, handleProgressEvent as EventListener)
    return () => window.removeEventListener(TUTORIAL_PROGRESS_EVENT, handleProgressEvent as EventListener)
  }, [activeEmail])

  const steps = useMemo(() => getStepsForMode(progress.mode), [progress.mode])
  const stepIndex = clampStep(progress.step, steps.length - 1)
  const step = steps[stepIndex]
  const sessionActive = Boolean(activeEmail && progress.active)

  const updateProgress = useCallback(
    (updater: (prev: TutorialProgress) => TutorialProgress) => {
      if (!activeEmail) return
      setProgress((prev) => {
        const next = updater(prev)
        if (sameProgress(prev, next)) return prev
        writeTutorialProgress(activeEmail, next)
        return next
      })
    },
    [activeEmail]
  )

  useEffect(() => {
    if (!sessionActive) return
    const path = location.pathname
    updateProgress((prev) => {
      if (prev.visitedRoutes.includes(path)) return prev
      return { ...prev, visitedRoutes: [...prev.visitedRoutes, path] }
    })
  }, [sessionActive, location.pathname, updateProgress])

  useEffect(() => {
    if (!sessionActive || !isAIPanelOpen) return
    updateProgress((prev) => {
      if (prev.aiOpened) return prev
      return { ...prev, aiOpened: true }
    })
  }, [sessionActive, isAIPanelOpen, updateProgress])

  useEffect(() => {
    if (!sessionActive) return
    updateProgress((prev) => {
      if (prev.eventCreated) return prev
      if (events.length <= prev.baselineEventsCount) return prev
      return { ...prev, eventCreated: true }
    })
  }, [sessionActive, events.length, updateProgress])

  useEffect(() => {
    if (!sessionActive) return
    function handlePointerDown(event: PointerEvent) {
      const el = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-tutorial-id]')
      const targetId = el?.dataset.tutorialId
      if (!targetId) return
      updateProgress((prev) => ({
        ...prev,
        interactedTargets: nextUnique(prev.interactedTargets, targetId),
      }))
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [sessionActive, updateProgress])

  useEffect(() => {
    if (!sessionActive) return
    function handleInput(event: Event) {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement | null
      if (!target) return
      const el = target.closest<HTMLElement>('[data-tutorial-id]')
      if (el?.dataset.tutorialId !== 'event-modal-title') return
      const value = typeof target.value === 'string' ? target.value : ''
      if (!value.trim()) return
      updateProgress((prev) => {
        if (prev.eventTitleEntered) return prev
        return {
          ...prev,
          eventTitleEntered: true,
          interactedTargets: nextUnique(prev.interactedTargets, 'event-modal-title'),
        }
      })
    }
    document.addEventListener('input', handleInput, true)
    return () => document.removeEventListener('input', handleInput, true)
  }, [sessionActive, updateProgress])

  useEffect(() => {
    if (!sessionActive || !step) {
      setTarget(null)
      return
    }
    function refreshTarget() {
      setTarget(findStepTarget(step.targetIds))
    }

    refreshTarget()
    const intervalId = window.setInterval(refreshTarget, 180)
    window.addEventListener('resize', refreshTarget)
    window.addEventListener('scroll', refreshTarget, true)
    return () => {
      clearInterval(intervalId)
      window.removeEventListener('resize', refreshTarget)
      window.removeEventListener('scroll', refreshTarget, true)
    }
  }, [sessionActive, step?.id, location.pathname])

  useEffect(() => {
    if (!sessionActive || !step || !target) return
    if (location.pathname !== step.route) return
    const el = document.querySelector<HTMLElement>(`[data-tutorial-id="${target.id}"]`)
    el?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
  }, [sessionActive, step?.id, step?.route, target?.id, location.pathname])

  const stepComplete = useMemo(() => {
    if (!step) return false
    return step.isComplete({
      path: location.pathname,
      progress,
      notificationsCount: notifications.length,
    })
  }, [step, location.pathname, progress, notifications.length])

  const isFinalStep = stepIndex >= steps.length - 1

  const goToStepRoute = useCallback(() => {
    if (!step) return
    if (step.targetIds.some((targetId) => targetId.startsWith('event-modal-'))) {
      navigate('/?onboarding=create-event')
      return
    }
    if (step.id === 'ai-assistant') {
      navigate('/?onboarding=open-ai')
      return
    }
    navigate(step.route)
  }, [step, navigate])

  const goPrev = useCallback(() => {
    if (!step || stepIndex <= 0) return
    const prevIndex = stepIndex - 1
    updateProgress((prev) => ({ ...prev, step: prevIndex }))
    navigate(steps[prevIndex].route)
  }, [step, stepIndex, steps, updateProgress, navigate])

  const goNext = useCallback(() => {
    if (!step || !stepComplete || isFinalStep) return
    const nextIndex = stepIndex + 1
    updateProgress((prev) => ({ ...prev, step: nextIndex }))
    navigate(steps[nextIndex].route)
  }, [step, stepComplete, isFinalStep, stepIndex, updateProgress, navigate, steps])

  useEffect(() => {
    if (!sessionActive || !step?.autoAdvance || !stepComplete || isFinalStep) return
    const timeout = window.setTimeout(() => {
      goNext()
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [sessionActive, step?.autoAdvance, stepComplete, isFinalStep, goNext])

  const finishTutorial = useCallback(() => {
    if (!activeEmail || !stepComplete) return
    if (progress.mode === 'required') {
      const updated = completeOnboarding(activeEmail)
      clearTutorialProgress(activeEmail)
      if (updated) {
        switchAuthUser(updated)
      }
      navigate('/')
      return
    }
    clearTutorialProgress(activeEmail)
    navigate('/profile')
  }, [activeEmail, stepComplete, progress.mode, switchAuthUser, navigate])

  const closeManualTutorial = useCallback(() => {
    if (!activeEmail || progress.mode !== 'manual') return
    stopTutorialSession(activeEmail)
  }, [activeEmail, progress.mode])

  if (!sessionActive || !step) return null

  const inRoute = location.pathname === step.route
  const holePadding = 8
  const hole = target
    ? {
        top: Math.max(0, target.rect.top - holePadding),
        left: Math.max(0, target.rect.left - holePadding),
        width: target.rect.width + holePadding * 2,
        height: target.rect.height + holePadding * 2,
      }
    : null

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 720
  const panelWidth = Math.min(380, Math.max(280, viewportWidth - 24))
  const estimatedPanelHeight = 300
  const panelLeft = hole ? Math.min(Math.max(12, hole.left), viewportWidth - panelWidth - 12) : 12
  const panelTop = hole
    ? hole.top + hole.height + 14 + estimatedPanelHeight <= viewportHeight
      ? hole.top + hole.height + 14
      : Math.max(12, hole.top - estimatedPanelHeight - 14)
    : Math.max(12, viewportHeight - estimatedPanelHeight - 12 - (progress.mode === 'required' ? 0 : 20))

  return (
    <>
      {hole ? (
        <>
          <div
            className="fixed z-[85]"
            style={{
              top: 0,
              left: 0,
              width: '100vw',
              height: hole.top,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(1px)',
            }}
          />
          <div
            className="fixed z-[85]"
            style={{
              top: hole.top,
              left: 0,
              width: hole.left,
              height: hole.height,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(1px)',
            }}
          />
          <div
            className="fixed z-[85]"
            style={{
              top: hole.top,
              left: hole.left + hole.width,
              right: 0,
              height: hole.height,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(1px)',
            }}
          />
          <div
            className="fixed z-[85]"
            style={{
              top: hole.top + hole.height,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(1px)',
            }}
          />
          <div
            className="fixed z-[86] rounded-xl pointer-events-none"
            style={{
              top: hole.top,
              left: hole.left,
              width: hole.width,
              height: hole.height,
              border: '2px solid rgba(255,138,0,0.9)',
              boxShadow: '0 0 0 2px rgba(255,106,0,0.25), 0 0 26px rgba(255,106,0,0.45)',
              animation: 'pulse-glow 1.8s ease-in-out infinite',
            }}
          />
        </>
      ) : (
        <div
          className="fixed inset-0 z-[85] pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(1px)' }}
        />
      )}

      <div
        className="fixed z-[90] rounded-2xl p-4"
        style={{
          top: panelTop,
          left: panelLeft,
          width: panelWidth,
          maxWidth: 'calc(100vw - 24px)',
          background: 'rgba(18,18,30,0.98)',
          border: '1px solid rgba(255,106,0,0.35)',
          boxShadow: '0 16px 42px rgba(0,0,0,0.45)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium" style={{ color: '#ffb347' }}>
              Tutorial Step {stepIndex + 1} of {steps.length}
            </div>
            <h3 className="text-sm font-semibold text-text-primary mt-0.5">{step.title}</h3>
          </div>
          {progress.mode === 'manual' && (
            <button
              onClick={closeManualTutorial}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
              aria-label="Close tutorial"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <p className="text-xs text-text-secondary mt-2 leading-relaxed">{step.description}</p>
        <ul className="mt-2 space-y-1.5">
          {step.instructions.map((instruction) => (
            <li key={instruction} className="text-[11px] leading-relaxed text-text-secondary flex items-start gap-1.5">
              <Hand size={11} className="mt-0.5 shrink-0" style={{ color: '#ffb347' }} />
              <span>{instruction}</span>
            </li>
          ))}
        </ul>

        <div className="mt-2 text-[11px]" style={{ color: stepComplete ? '#10b981' : '#f59e0b' }}>
          {stepComplete ? 'Requirement complete.' : `Required: ${step.requirementLabel}`}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={goToStepRoute}
            className="px-3 h-8 rounded-lg text-[11px] font-medium inline-flex items-center gap-1.5"
            style={{ background: 'rgba(255,106,0,0.14)', border: '1px solid rgba(255,106,0,0.3)', color: '#ffb347' }}
          >
            <Compass size={13} />
            {inRoute ? 'Focus target' : 'Go to step page'}
          </button>
          {!inRoute && <span className="text-[10px] text-text-muted">Open the right page, then tap the highlighted area.</span>}
        </div>

        <div className="flex items-center justify-between gap-2 mt-3">
          <button
            onClick={goPrev}
            disabled={stepIndex === 0}
            className="px-3 h-8 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <ChevronLeft size={13} />
            Back
          </button>

          {!isFinalStep ? (
            <button
              onClick={goNext}
              disabled={!stepComplete}
              className="px-3 h-8 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #ff6a00, #ff8a00)' }}
            >
              Next
              <ChevronRight size={13} />
            </button>
          ) : (
            <button
              onClick={finishTutorial}
              disabled={!stepComplete}
              className="px-3 h-8 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #ff6a00, #ff8a00)' }}
            >
              <CheckCircle2 size={13} />
              {progress.mode === 'required' ? 'Complete Onboarding' : 'Finish Tutorial'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
