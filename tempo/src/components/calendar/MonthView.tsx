import { useMemo } from 'react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek,
  endOfWeek, format, isToday, isSameMonth
} from 'date-fns'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { getCategoryColor, isSameDay, cn } from '../../lib/utils'
import type { CalendarEvent } from '../../types'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_VISIBLE_EVENTS = 3

function MonthEventPill({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const color = getCategoryColor(event.category)
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.1 }}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="w-full text-left truncate px-1.5 py-0.5 rounded text-[10px] font-medium leading-tight"
      style={{
        background: `${color}20`,
        color,
        borderLeft: `2px solid ${color}`,
        opacity: event.isCompleted ? 0.5 : 1,
      }}
    >
      {event.title}
    </motion.button>
  )
}

export default function MonthView() {
  const { selectedDate, setSelectedDate, events, selectEvent, openEventModal, setViewMode } = useAppStore()
  const currentDate = new Date(selectedDate)

  const { days } = useMemo(() => {
    const d = new Date(selectedDate)
    const monthStart = startOfMonth(d)
    const monthEnd = endOfMonth(d)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return { days: eachDayOfInterval({ start: gridStart, end: gridEnd }) }
  }, [selectedDate])

  function handleDayClick(day: Date) {
    setSelectedDate(day.toISOString())
    setViewMode('day')
  }

  function handleNewEventOnDay(day: Date, e: React.MouseEvent) {
    e.stopPropagation()
    const start = new Date(day)
    start.setHours(9, 0, 0, 0)
    const end = new Date(start)
    end.setHours(10, 0, 0, 0)
    openEventModal({
      id: '',
      title: '',
      category: 'focus_block',
      flexibility: 'flexible',
      startUtc: start.toISOString(),
      endUtc: end.toISOString(),
      isRecurring: false,
      hasExternalAttendees: false,
      attendeeCount: 1,
      isCompleted: false,
      aiGenerated: false,
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Day-name header */}
      <div
        className="grid grid-cols-7 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7" style={{ minHeight: '100%' }}>
          {days.map((day, index) => {
            const dayEvents = events.filter((ev) => isSameDay(ev.startUtc, day))
            const isCurrentMonth = isSameMonth(day, currentDate)
            const todayFlag = isToday(day)
            const overflow = dayEvents.length - MAX_VISIBLE_EVENTS

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className="relative flex flex-col p-1.5 cursor-pointer group transition-colors"
                style={{
                  borderRight: (index + 1) % 7 !== 0 ? '1px solid var(--border-subtle)' : undefined,
                  borderBottom: '1px solid var(--border-subtle)',
                  background: isCurrentMonth ? 'transparent' : 'var(--bg-faded)',
                  minHeight: 110,
                }}
              >
                {/* Hover overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded"
                  style={{ background: 'var(--hover-overlay)' }}
                />

                {/* Day number */}
                <div className="flex items-start justify-between mb-1 z-10">
                  <div
                    className={cn(
                      'w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold transition-all',
                      todayFlag ? 'text-white' : '',
                      !isCurrentMonth && !todayFlag ? 'opacity-35' : ''
                    )}
                    style={
                      todayFlag
                        ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }
                        : { color: 'var(--text-secondary)' }
                    }
                  >
                    {format(day, 'd')}
                  </div>

                  {/* Quick-add button */}
                  <button
                    onClick={(e) => handleNewEventOnDay(day, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Event pills */}
                <div className="flex flex-col gap-0.5 z-10">
                  {dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((ev) => (
                    <MonthEventPill
                      key={ev.id}
                      event={ev}
                      onClick={() => selectEvent(ev)}
                    />
                  ))}
                  {overflow > 0 && (
                    <button
                      className="text-left text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onClick={(e) => { e.stopPropagation(); handleDayClick(day) }}
                    >
                      +{overflow} more
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
