import { useAppStore } from '../stores/appStore'
import WeekView from '../components/calendar/WeekView'
import MonthView from '../components/calendar/MonthView'
import EventDetailPanel from '../components/calendar/EventDetailPanel'

export default function CalendarPage() {
  const { selectedEvent, viewMode } = useAppStore()

  return (
    <div className="h-full overflow-hidden relative">
      {viewMode === 'month' ? <MonthView /> : <WeekView />}
      {selectedEvent && <EventDetailPanel />}
    </div>
  )
}
