import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  pageOverview?: boolean
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
      'If you leave it blank, Tempo will auto-assign a default title on save.',
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
    targetIds: ['event-modal-time-section', 'event-modal-time-start', 'event-modal-time-end'],
    description:
      'Time fields define duration and placement on the calendar.',
    instructions: [
      'Use the highlighted time block that contains both Start and End.',
      'Tap the Start field first.',
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
      'If the modal is closed, tap New to open it again.',
      'If title is empty, Tempo will create it with a default title, but naming it now is recommended.',
      'Then tap the highlighted Create Event button.',
      'After save, the event should appear in your calendar and this step completes.',
    ],
    requirementLabel: 'Create one event successfully.',
    isComplete: ({ progress }) => progress.eventCreated,
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant: How to Use It',
    route: '/',
    targetIds: ['header-ai-toggle', 'mobile-ai-toggle', 'sidebar-ai-toggle'],
    description:
      'Tempo AI is your scheduling co-pilot. Use it for conflict resolution, free-time checks, and schedule optimization based on your current events.',
    instructions: [
      'Tap the highlighted AI control (header, bottom nav, or sidebar) to open the panel.',
      'Inside the panel, ask practical questions like "When am I free today?" or "Optimize my schedule".',
      'Use quick actions for common tasks, or type your own prompt for custom planning help.',
      'When a conflict banner appears, review suggested slots before accepting changes.',
    ],
    requirementLabel: 'Open the AI assistant panel once (then review its controls).',
    isComplete: ({ progress }) => progress.aiOpened,
  },
  {
    id: 'notification-panel',
    title: 'Quick Notifications Panel (Top Right)',
    route: '/',
    targetIds: ['header-notifications'],
    description:
      'This panel is your fast inbox. It is designed for quick checks while staying on the current page, especially while planning in Calendar.',
    instructions: [
      'Tap the highlighted bell in the top-right header.',
      'Review unread items and urgency indicators.',
      'Use this panel when you need quick context without leaving Calendar.',
      'For deeper review and full history, use the Notifications page next.',
    ],
    requirementLabel: 'Tap the highlighted top-right bell button.',
    isComplete: ({ progress }) => hasClicked(progress, 'header-notifications'),
  },
  {
    id: 'notification-page',
    title: 'Notifications Page: Action Center',
    route: '/notifications',
    targetIds: ['notifications-page-first-item', 'notifications-page-list'],
    pageOverview: true,
    description:
      'This is your full notification dashboard. Each item is actionable and can route you directly to related events, conflicts, or pages.',
    instructions: [
      'Open the Notifications page and review item types (conflicts, reminders, insights, AI).',
      'Tap a notification item to follow its route and take action.',
      'Use this page to process everything in one place instead of only quick-checking the bell panel.',
      'If there are no items yet, tap inside the notifications list area to continue.',
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
    title: 'Insights Dashboard',
    route: '/insights',
    targetIds: ['insights-title'],
    pageOverview: true,
    description:
      'The Insights dashboard explains how your time is actually being used. It helps you spot patterns and improve planning decisions week-to-week.',
    instructions: [
      'Navigate to Insights and scan completion rate, streaks, and recent productivity trend.',
      'Use category breakdowns and heatmaps to see where time is concentrated.',
      'Treat this as feedback for adjusting work blocks, meetings, and focus windows.',
      'This page is your analytics dashboard for schedule quality.',
    ],
    requirementLabel: 'Open the Insights page.',
    isComplete: ({ progress }) => hasVisited(progress, '/insights'),
  },
  {
    id: 'settings-page',
    title: 'Settings and Preference Controls',
    route: '/settings',
    targetIds: ['settings-title'],
    pageOverview: true,
    description:
      'Settings defines default behavior across Tempo, including reminder behavior, scheduling preferences, and account-level controls.',
    instructions: [
      'Navigate to Settings and review profile, schedule, and notification sections.',
      'Use these controls to tune how aggressive reminders and suggestions should be.',
      'When behavior feels off, this is the first place to calibrate your defaults.',
      'Think of Settings as your long-term control panel.',
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

function getVisibleRect(targetId: string): DOMRect | null {
  const el = document.querySelector<HTMLElement>(`[data-tutorial-id="${targetId}"]`)
  if (!el) return null
  const rect = el.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null
  return rect
}

function mergeRects(a: DOMRect, b: DOMRect): DOMRect {
  const left = Math.min(a.left, b.left)
  const top = Math.min(a.top, b.top)
  const right = Math.max(a.right, b.right)
  const bottom = Math.max(a.bottom, b.bottom)
  return new DOMRect(left, top, right - left, bottom - top)
}

function getTargetInputValue(targetId: string): string {
  const el = document.querySelector<HTMLElement>(`[data-tutorial-id="${targetId}"]`)
  if (!el) return ''
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value ?? ''
  }
  return ''
}

function findTimeStepTarget(progress: TutorialProgress) {
  const sectionRect = getVisibleRect('event-modal-time-section')
  const startRect = getVisibleRect('event-modal-time-start')
  const endRect = getVisibleRect('event-modal-time-end')
  const startClicked = hasClicked(progress, 'event-modal-time-start')
  const endClicked = hasClicked(progress, 'event-modal-time-end')

  if (startClicked && !endClicked && endRect) {
    return { id: 'event-modal-time-end', rect: endRect }
  }

  if (endClicked && !startClicked && startRect) {
    return { id: 'event-modal-time-start', rect: startRect }
  }

  if (sectionRect) {
    return { id: 'event-modal-time-section', rect: sectionRect }
  }

  if (startRect && endRect) {
    return { id: 'event-modal-time-section', rect: mergeRects(startRect, endRect) }
  }

  if (startRect) {
    return { id: 'event-modal-time-start', rect: startRect }
  }

  if (endRect) {
    return { id: 'event-modal-time-end', rect: endRect }
  }

  return null
}

function findCreateEventStepTarget() {
  const modalCreateRect = getVisibleRect('event-modal-create')
  const modalTitleRect = getVisibleRect('event-modal-title')
  const newEventRect = getVisibleRect('header-new-event')
  const titleValue = getTargetInputValue('event-modal-title').trim()

  if (!modalCreateRect) {
    if (newEventRect) {
      return { id: 'header-new-event', rect: newEventRect }
    }
    return null
  }

  if (!titleValue && modalTitleRect) {
    return { id: 'event-modal-title', rect: modalTitleRect }
  }

  return { id: 'event-modal-create', rect: modalCreateRect }
}

function findStepTarget(step: TutorialStep, progress: TutorialProgress) {
  if (step.id === 'calendar-event-time') {
    return findTimeStepTarget(progress)
  }
  if (step.id === 'calendar-create-event') {
    return findCreateEventStepTarget()
  }

  const targetIds = step.targetIds
  for (const targetId of targetIds) {
    const rect = getVisibleRect(targetId)
    if (!rect) continue
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
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [panelHeight, setPanelHeight] = useState(320)

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
      setTarget(findStepTarget(step, progress))
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
  }, [sessionActive, step?.id, location.pathname, progress.interactedTargets])

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

  useEffect(() => {
    if (!sessionActive) return
    const el = panelRef.current
    if (!el) return
    const updateHeight = () => {
      const nextHeight = el.getBoundingClientRect().height
      if (nextHeight > 0) {
        setPanelHeight(nextHeight)
      }
    }
    updateHeight()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateHeight) : null
    observer?.observe(el)
    window.addEventListener('resize', updateHeight)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', updateHeight)
    }
  }, [sessionActive, step?.id, progress.step, stepComplete, location.pathname])

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

  const skipTutorial = useCallback(() => {
    if (!activeEmail) return
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
  }, [activeEmail, progress.mode, switchAuthUser, navigate])

  const closeManualTutorial = useCallback(() => {
    if (!activeEmail || progress.mode !== 'manual') return
    stopTutorialSession(activeEmail)
  }, [activeEmail, progress.mode])

  if (!sessionActive || !step) return null

  const inRoute = location.pathname === step.route
  const holePadding = 8
  const disableBackdrop = Boolean(step.pageOverview)
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
  const isMobileViewport = viewportWidth < 768
  const panelWidth = Math.min(380, Math.max(280, viewportWidth - 24))
  const panelMargin = 12
  const panelGap = 14
  const clampedPanelHeight = Math.min(panelHeight, viewportHeight - panelMargin * 2)
  const panelLeftBase = hole ? Math.min(Math.max(panelMargin, hole.left), viewportWidth - panelWidth - panelMargin) : panelMargin
  const panelLeft = Math.max(panelMargin, Math.min(panelLeftBase, viewportWidth - panelWidth - panelMargin))

  const clampPanelTop = (candidateTop: number) =>
    Math.max(panelMargin, Math.min(candidateTop, viewportHeight - clampedPanelHeight - panelMargin))

  let panelTop = Math.max(
    panelMargin,
    viewportHeight - clampedPanelHeight - panelMargin - (progress.mode === 'required' ? 0 : 20)
  )

  if (hole) {
    const belowTop = hole.top + hole.height + panelGap
    const aboveTop = hole.top - clampedPanelHeight - panelGap
    const fitsBelow = belowTop + clampedPanelHeight <= viewportHeight - panelMargin
    const fitsAbove = aboveTop >= panelMargin

    if (isMobileViewport && step.id === 'calendar-create-event' && target?.id === 'event-modal-create') {
      panelTop = fitsAbove ? aboveTop : panelMargin
    } else if (fitsBelow) {
      panelTop = belowTop
    } else if (fitsAbove) {
      panelTop = aboveTop
    } else {
      const spaceBelow = viewportHeight - panelMargin - belowTop
      const spaceAbove = hole.top - panelGap - panelMargin
      panelTop = spaceAbove >= spaceBelow ? aboveTop : belowTop
    }
  }

  panelTop = clampPanelTop(panelTop)

  return (
    <>
      {!disableBackdrop &&
        (hole ? (
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
          </>
        ) : (
          <div
            className="fixed inset-0 z-[85] pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(1px)' }}
          />
        ))}

      {hole && (
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
      )}

      <div
        ref={panelRef}
        className="fixed z-[90] rounded-2xl p-4"
        style={{
          top: panelTop,
          left: panelLeft,
          width: panelWidth,
          maxWidth: 'calc(100vw - 24px)',
          maxHeight: 'calc(100vh - 24px)',
          overflowY: 'auto',
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
          <div className="flex items-center gap-1.5">
            <button
              onClick={skipTutorial}
              className="px-2.5 h-7 rounded-lg text-[10px] font-semibold"
              style={{
                color: '#ffd2a6',
                border: '1px solid rgba(255,106,0,0.35)',
                background: 'rgba(255,106,0,0.12)',
              }}
            >
              Skip Tutorial
            </button>
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
            style={{ background: 'var(--input-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
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
