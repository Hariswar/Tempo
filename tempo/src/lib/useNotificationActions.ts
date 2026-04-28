import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'
import { getNotificationNavigationPlan } from './notifications'
import type { Notification } from '../types'

export function useNotificationActions() {
  const navigate = useNavigate()
  const {
    events,
    markNotificationRead,
    setSelectedDate,
    setViewMode,
    selectEvent,
    setPendingConflict,
  } = useAppStore()

  function activateNotification(notification: Notification, onAfter?: () => void) {
    markNotificationRead(notification.id)

    const plan = getNotificationNavigationPlan(notification, events)
    const targetEvent = plan.eventId ? events.find((event) => event.id === plan.eventId) : undefined

    navigate(plan.route)

    if (plan.viewMode) {
      setViewMode(plan.viewMode)
    }

    if (plan.focusDateUtc) {
      setSelectedDate(plan.focusDateUtc)
    }

    if (targetEvent) {
      selectEvent(targetEvent)
    }

    if (plan.openConflictResolver && notification.conflictResolution) {
      setPendingConflict(notification.conflictResolution)
    }

    if (plan.openAIPanel || plan.openConflictResolver) {
      const state = useAppStore.getState()
      if (!state.isAIPanelOpen) {
        state.toggleAIPanel()
      }
    }

    onAfter?.()
  }

  return { activateNotification }
}
