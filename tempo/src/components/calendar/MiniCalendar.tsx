import { useState, useMemo } from 'react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek,
  endOfWeek, format, isToday, isSameMonth
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { cn, isSameDay } from '../../lib/utils'

export default function MiniCalendar() {
  const { selectedDate, setSelectedDate, events } = useAppStore()
  const [displayDate, setDisplayDate] = useState(new Date(selectedDate))

  const { days } = useMemo(() => {
    const monthStart = startOfMonth(displayDate)
    const monthEnd = endOfMonth(displayDate)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return { days: eachDayOfInterval({ start: gridStart, end: gridEnd }) }
  }, [displayDate])

  function prevMonth() {
    setDisplayDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function nextMonth() {
    setDisplayDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  function selectDay(day: Date) {
    setSelectedDate(day.toISOString())
  }

  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className="text-xs select-none">
      {/* Month header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="p-1 rounded-md hover:bg-white/5 transition-colors">
          <ChevronLeft size={12} className="text-text-muted" />
        </button>
        <span className="text-[11px] font-semibold text-text-secondary">
          {format(displayDate, 'MMM yyyy')}
        </span>
        <button onClick={nextMonth} className="p-1 rounded-md hover:bg-white/5 transition-colors">
          <ChevronRight size={12} className="text-text-muted" />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((d, i) => (
          <div key={i} className="mini-cal-day text-text-muted text-[10px] font-medium cursor-default">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const hasEvents = events.some((ev) => isSameDay(ev.startUtc, day))
          const isSelected = isSameDay(day, selectedDate)
          const isCurrentMonth = isSameMonth(day, displayDate)
          const isTodayDate = isToday(day)

          return (
            <button
              key={day.toISOString()}
              onClick={() => selectDay(day)}
              className={cn(
                'mini-cal-day transition-colors',
                !isCurrentMonth && 'opacity-25',
                !isTodayDate && !isSelected && 'hover:bg-white/5',
                isTodayDate && 'today',
                isSelected && !isTodayDate && 'selected',
                hasEvents && !isTodayDate && 'has-event'
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
