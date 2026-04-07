import WeekView from '../components/calendar/WeekView'
import EventDetailPanel from '../components/calendar/EventDetailPanel'
import { useAppStore } from '../stores/appStore'

export default function CalendarPage() {
  const { selectedEvent } = useAppStore()

  return (
    <div className="h-full overflow-hidden relative">
      <WeekView />
      {selectedEvent && <EventDetailPanel />}
    </div>
  )
}
