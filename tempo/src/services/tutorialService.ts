export type TutorialMode = 'required' | 'manual'

export interface TutorialProgress {
  active: boolean
  mode: TutorialMode
  step: number
  visitedRoutes: string[]
  interactedTargets: string[]
  aiOpened: boolean
  baselineEventsCount: number
  eventCreated: boolean
}

const TUTORIAL_KEY_PREFIX = 'tempo-onboarding-progress-v2::'
export const TUTORIAL_PROGRESS_EVENT = 'tempo:tutorial-progress-changed'

function tutorialKey(email: string): string {
  return `${TUTORIAL_KEY_PREFIX}${email.trim().toLowerCase()}`
}

function dedupe(values: string[] | null | undefined): string[] {
  if (!Array.isArray(values)) return []
  return [...new Set(values.filter((v): v is string => typeof v === 'string' && v.length > 0))]
}

export function getDefaultTutorialProgress(): TutorialProgress {
  return {
    active: false,
    mode: 'required',
    step: 0,
    visitedRoutes: [],
    interactedTargets: [],
    aiOpened: false,
    baselineEventsCount: 0,
    eventCreated: false,
  }
}

function normalizeProgress(input: Partial<TutorialProgress> | null | undefined): TutorialProgress {
  return {
    active: Boolean(input?.active),
    mode: input?.mode === 'manual' ? 'manual' : 'required',
    step: typeof input?.step === 'number' ? Math.max(0, input.step) : 0,
    visitedRoutes: dedupe(input?.visitedRoutes),
    interactedTargets: dedupe(input?.interactedTargets),
    aiOpened: Boolean(input?.aiOpened),
    baselineEventsCount:
      typeof input?.baselineEventsCount === 'number' && Number.isFinite(input.baselineEventsCount)
        ? Math.max(0, input.baselineEventsCount)
        : 0,
    eventCreated: Boolean(input?.eventCreated),
  }
}

function emitProgressChanged(email: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(TUTORIAL_PROGRESS_EVENT, {
      detail: { email: email.trim().toLowerCase() },
    })
  )
}

export function readTutorialProgress(email: string): TutorialProgress {
  const raw = localStorage.getItem(tutorialKey(email))
  if (!raw) return getDefaultTutorialProgress()
  try {
    return normalizeProgress(JSON.parse(raw) as Partial<TutorialProgress>)
  } catch {
    return getDefaultTutorialProgress()
  }
}

export function writeTutorialProgress(email: string, progress: TutorialProgress) {
  localStorage.setItem(tutorialKey(email), JSON.stringify(normalizeProgress(progress)))
  emitProgressChanged(email)
}

export function startTutorialSession(
  email: string,
  mode: TutorialMode,
  baselineEventsCount: number,
  startStep: number
) {
  const next = normalizeProgress({
    ...getDefaultTutorialProgress(),
    active: true,
    mode,
    step: Math.max(0, startStep),
    baselineEventsCount: Math.max(0, baselineEventsCount),
  })
  writeTutorialProgress(email, next)
  return next
}

export function stopTutorialSession(email: string) {
  const current = readTutorialProgress(email)
  writeTutorialProgress(email, { ...current, active: false })
}

export function clearTutorialProgress(email: string) {
  localStorage.removeItem(tutorialKey(email))
  emitProgressChanged(email)
}
