import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'
import { useIsMobile } from '../lib/useIsMobile'
import WeekView from '../components/calendar/WeekView'
import MonthView from '../components/calendar/MonthView'
import EventDetailPanel from '../components/calendar/EventDetailPanel'
import type { ViewMode } from '../types'

export default function CalendarPage() {
  const { selectedEvent, viewMode, setViewMode, openEventModal, isAIPanelOpen, toggleAIPanel } = useAppStore()
  const isMobile = useIsMobile()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const onboardingAction = params.get('onboarding')
    if (!onboardingAction) return

    if (onboardingAction === 'create-event') {
      openEventModal()
    }

    if (onboardingAction === 'open-ai' && !isAIPanelOpen) {
      toggleAIPanel()
    }

    navigate(location.pathname, { replace: true })
  }, [location.pathname, location.search, navigate, openEventModal, isAIPanelOpen, toggleAIPanel])

  const mobileViewModes: ViewMode[] = ['day', 'week', 'month']

  return (
    <div className="h-full min-h-0 overflow-hidden relative flex flex-col">
      {isMobile && (
        <div
          className="shrink-0 px-3 py-2 flex items-center gap-1.5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          {mobileViewModes.map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="flex-1 h-8 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors"
              style={
                viewMode === mode
                  ? {
                      color: '#ffb347',
                      background: 'rgba(255,106,0,0.16)',
                      border: '1px solid rgba(255,106,0,0.3)',
                    }
                  : {
                      color: 'var(--text-secondary)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                    }
              }
            >
              {mode}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === 'month' ? <MonthView /> : <WeekView />}
      </div>
      {selectedEvent && <EventDetailPanel />}
    </div>
  )
}
