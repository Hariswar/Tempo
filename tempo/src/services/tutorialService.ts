export interface TutorialProgress {
  step: number
  visitedRoutes: string[]
  aiOpened: boolean
}

const TUTORIAL_KEY_PREFIX = 'tempo-onboarding-progress-v1::'

function tutorialKey(email: string): string {
  return `${TUTORIAL_KEY_PREFIX}${email.trim().toLowerCase()}`
}

function normalizeProgress(input: Partial<TutorialProgress> | null | undefined): TutorialProgress {
  return {
    step: typeof input?.step === 'number' ? Math.max(0, input.step) : 0,
    visitedRoutes: Array.isArray(input?.visitedRoutes) ? input.visitedRoutes : [],
    aiOpened: Boolean(input?.aiOpened),
  }
}

export function readTutorialProgress(email: string): TutorialProgress {
  const raw = localStorage.getItem(tutorialKey(email))
  if (!raw) return normalizeProgress(null)
  try {
    return normalizeProgress(JSON.parse(raw) as Partial<TutorialProgress>)
  } catch {
    return normalizeProgress(null)
  }
}

export function writeTutorialProgress(email: string, progress: TutorialProgress) {
  localStorage.setItem(tutorialKey(email), JSON.stringify(normalizeProgress(progress)))
}

export function clearTutorialProgress(email: string) {
  localStorage.removeItem(tutorialKey(email))
}
