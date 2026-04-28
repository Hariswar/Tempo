import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'
import { useIsMobile } from '../lib/useIsMobile'
import WeekView from '../components/calendar/WeekView'
import MonthView from '../components/calendar/MonthView'
import EventDetailPanel from '../components/calendar/EventDetailPanel'

export default function CalendarPage() {
  const { selectedEvent, viewMode, setViewMode, openEventModal, isAIPanelOpen, toggleAIPanel } = useAppStore()
  const isMobile = useIsMobile()
  const location = useLocation()
  const navigate = useNavigate()

  // On mobile, auto-switch week view to day view for usability
  useEffect(() => {
    if (isMobile && viewMode === 'week') {
      setViewMode('day')
    }
  }, [isMobile])

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

  return (
    <div className="h-full overflow-hidden relative">
      {viewMode === 'month' ? <MonthView /> : <WeekView />}
      {selectedEvent && <EventDetailPanel />}
    </div>
  )
}
