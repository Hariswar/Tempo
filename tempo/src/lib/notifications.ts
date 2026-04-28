import type { CalendarEvent, Notification, NotificationAction } from '../types'

export interface NotificationNavigationPlan extends NotificationAction {
  route: '/' | '/insights' | '/settings' | '/notifications' | '/login' | '/signup'
  ctaLabel: string
}

const DEFAULT_ACTIONS: Record<Notification['type'], NotificationAction> = {
  conflict: {
    route: '/',
    viewMode: 'day',
    openAIPanel: true,
    openConflictResolver: true,
    ctaLabel: 'Resolve conflict',
  },
  suggestion: {
    route: '/',
    viewMode: 'day',
    ctaLabel: 'View suggestion',
  },
  reminder: {
    route: '/',
    viewMode: 'day',
    ctaLabel: 'Open reminder',
  },
  insight: {
    route: '/insights',
    ctaLabel: 'View insight',
  },
  ai: {
    route: '/',
    openAIPanel: true,
    ctaLabel: 'Open assistant',
  },
}

function getEventById(events: CalendarEvent[], eventId?: string): CalendarEvent | undefined {
  if (!eventId) return undefined
  return events.find((event) => event.id === eventId)
}

export function getNotificationNavigationPlan(
  notification: Notification,
  events: CalendarEvent[]
): NotificationNavigationPlan {
  const defaults = DEFAULT_ACTIONS[notification.type]
  const merged: NotificationAction = {
    ...defaults,
    ...notification.action,
  }

  const targetEventId = merged.eventId ?? notification.eventId
  const targetEvent = getEventById(events, targetEventId)
  const conflictDate = notification.conflictResolution?.eventToMove.startUtc

  return {
    route: merged.route ?? (targetEvent ? '/' : '/notifications'),
    eventId: targetEventId,
    focusDateUtc: merged.focusDateUtc ?? targetEvent?.startUtc ?? conflictDate,
    viewMode: merged.viewMode ?? (targetEvent ? 'day' : undefined),
    openAIPanel: merged.openAIPanel,
    openConflictResolver: merged.openConflictResolver,
    ctaLabel: merged.ctaLabel ?? defaults.ctaLabel ?? 'Open',
  }
}
