import { useMemo, useRef } from 'react'
import {
  startOfWeek, endOfWeek, eachDayOfInterval, format,
  isToday
} from 'date-fns'
import { motion } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import type { CalendarEvent } from '../../types'
import { getCategoryColor, minuteSinceStartOfDay, isSameDay, cn } from '../../lib/utils'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HOUR_HEIGHT = 64 // px per hour
const START_HOUR = 0

interface ColumnEvent extends CalendarEvent {
  column: number
  totalColumns: number
  top: number
  height: number
}

function layoutEvents(events: CalendarEvent[]): ColumnEvent[] {
  if (!events.length) return []

  const sorted = [...events].sort(
    (a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime()
  )

  const columns: CalendarEvent[][] = []

  for (const ev of sorted) {
    let placed = false
    for (let col = 0; col < columns.length; col++) {
      const lastInCol = columns[col][columns[col].length - 1]
      if (new Date(lastInCol.endUtc).getTime() <= new Date(ev.startUtc).getTime()) {
        columns[col].push(ev)
        placed = true
        break
      }
    }
    if (!placed) columns.push([ev])
  }

  return sorted.map((ev) => {
    const col = columns.findIndex((c) => c.some((e) => e.id === ev.id))
    const totalColumns = Math.max(
      ...sorted.map((e) => {
        const eStart = new Date(e.startUtc).getTime()
        const eEnd = new Date(e.endUtc).getTime()
        const evStart = new Date(ev.startUtc).getTime()
        const evEnd = new Date(ev.endUtc).getTime()
        if (eStart < evEnd && eEnd > evStart) {
          return columns.findIndex((c) => c.some((x) => x.id === e.id)) + 1
        }
        return 0
      })
    )

    const startMins = minuteSinceStartOfDay(ev.startUtc)
    const endMins = minuteSinceStartOfDay(ev.endUtc)
    const duration = endMins > startMins ? endMins - startMins : Math.max(30, endMins - startMins + 1440)

    return {
      ...ev,
      column: col,
      totalColumns: Math.max(1, totalColumns),
      top: (startMins - START_HOUR * 60) * (HOUR_HEIGHT / 60),
      height: Math.max(24, duration * (HOUR_HEIGHT / 60)),
    }
  })
}

export default function WeekView() {
  const { selectedDate, events, selectEvent, openEventModal, setSelectedDate, viewMode } = useAppStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const now = new Date()

  const days = useMemo(() => {
    const d = new Date(selectedDate)
    if (viewMode === 'day') return [d]
    const start = startOfWeek(d, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end: endOfWeek(start, { weekStartsOn: 1 }) })
  }, [selectedDate, viewMode])

  const eventsPerDay = useMemo(() => {
    return days.map((day) =>
      layoutEvents(events.filter((ev) => isSameDay(ev.startUtc, day)))
    )
  }, [days, events])

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowTop = (nowMinutes - START_HOUR * 60) * (HOUR_HEIGHT / 60)

  function handleSlotClick(day: Date, hour: number) {
    const start = new Date(day)
    start.setHours(hour, 0, 0, 0)
    const end = new Date(start)
    end.setHours(hour + 1)
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
      {/* Day header row */}
      <div
        className="flex shrink-0"
        style={{ paddingLeft: 52, borderBottom: '1px solid var(--border-subtle)' }}
      >
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="flex-1 text-center py-2 cursor-pointer"
            onClick={() => setSelectedDate(day.toISOString())}
          >
            <div
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              {format(day, 'EEE')}
            </div>
            <div
              className={cn(
                'mx-auto mt-1 w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold transition-all',
                isToday(day) ? 'text-white' : ''
              )}
              style={
                isToday(day)
                  ? { background: 'linear-gradient(135deg,#ff6a00,#ff8a00)' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin' }}>
        <div className="flex" style={{ minHeight: `${HOUR_HEIGHT * 24}px` }}>
          {/* Time gutter */}
          <div className="shrink-0 relative" style={{ width: 52 }}>
            {HOURS.filter((h) => h >= START_HOUR).map((hour) => (
              <div
                key={hour}
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                className="absolute w-full flex items-start justify-end pr-2 pt-1"
              >
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIdx) => {
            const dayEvents = eventsPerDay[dayIdx]
            return (
              <div
                key={day.toISOString()}
                className="flex-1 relative min-w-0"
                style={{ borderLeft: '1px solid var(--grid-line)' }}
              >
                {/* Hour grid lines (click to create) */}
                {HOURS.filter((h) => h >= START_HOUR).map((hour) => (
                  <div
                    key={hour}
                    className="absolute inset-x-0 cursor-pointer group"
                    style={{
                      top: (hour - START_HOUR) * HOUR_HEIGHT,
                      height: HOUR_HEIGHT,
                      borderTop: '1px solid var(--grid-line)',
                    }}
                    onClick={() => handleSlotClick(day, hour)}
                  >
                    <div
                      className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center"
                      style={{ background: 'var(--hover-overlay)' }}
                    >
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>+ Add</span>
                    </div>
                  </div>
                ))}

                {/* Half-hour markers */}
                {HOURS.filter((h) => h >= START_HOUR).map((hour) => (
                  <div
                    key={`${hour}-half`}
                    className="absolute inset-x-0 pointer-events-none"
                    style={{
                      top: (hour - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                      borderTop: '1px dashed var(--grid-half)',
                    }}
                  />
                ))}

                {/* Events */}
                {dayEvents.map((ev) => (
                  <EventBlock key={ev.id} ev={ev} onClick={() => selectEvent(ev)} />
                ))}

                {/* Current time indicator */}
                {isToday(day) && nowTop > 0 && (
                  <div className="time-indicator" style={{ top: nowTop }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function EventBlock({ ev, onClick }: { ev: ColumnEvent; onClick: () => void }) {
  const color = getCategoryColor(ev.category)
  const isTiny = ev.height < 36
  const isShort = ev.height < 56

  const colWidth = 100 / ev.totalColumns
  const left = `calc(${ev.column * colWidth}% + 2px)`
  const width = `calc(${colWidth}% - 4px)`

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={cn('event-card', `cat-${ev.category}`)}
      style={{
        top: ev.top,
        height: ev.height,
        left,
        width,
        '--cat-color': color,
        opacity: ev.isCompleted ? 0.5 : 1,
      } as React.CSSProperties}
      onClick={(e) => { e.stopPropagation(); onClick() }}
    >
      <div className="p-1.5 h-full flex flex-col overflow-hidden">
        {ev.isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-px" style={{ background: color, opacity: 0.5 }} />
          </div>
        )}
        <span
          className={cn('font-semibold leading-tight truncate', isTiny ? 'text-[10px]' : 'text-[11px]')}
          style={{ color }}
        >
          {ev.title}
        </span>
        {!isShort && (
          <span className="text-[10px] mt-0.5 truncate" style={{ color: `${color}80` }}>
            {format(new Date(ev.startUtc), 'h:mm')}–{format(new Date(ev.endUtc), 'h:mm a')}
          </span>
        )}
        {ev.locationLabel && !isTiny && (
          <span className="text-[9px] truncate mt-0.5" style={{ color: `${color}60` }}>
            📍 {ev.locationLabel}
          </span>
        )}
      </div>
    </motion.div>
  )
}
