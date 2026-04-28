import { useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { useIsMobile } from '../lib/useIsMobile'
import WeekView from '../components/calendar/WeekView'
import MonthView from '../components/calendar/MonthView'
import EventDetailPanel from '../components/calendar/EventDetailPanel'

export default function CalendarPage() {
  const { selectedEvent, viewMode, setViewMode } = useAppStore()
  const isMobile = useIsMobile()

  // On mobile, auto-switch week view to day view for usability
  useEffect(() => {
    if (isMobile && viewMode === 'week') {
      setViewMode('day')
    }
  }, [isMobile])

  return (
    <div className="h-full overflow-hidden relative">
      {viewMode === 'month' ? <MonthView /> : <WeekView />}
      {selectedEvent && <EventDetailPanel />}
    </div>
  )
}
