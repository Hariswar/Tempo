import { useState } from 'react'
import { format, addWeeks, subWeeks, addDays, subDays, addMonths, subMonths } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Plus, Search, Bell,
  LayoutGrid, Columns, Calendar, Sparkles, Sun, Moon
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import NotificationCenter from '../notifications/NotificationCenter'

export default function Header() {
  const {
    viewMode, setViewMode, selectedDate, setSelectedDate,
    openEventModal, toggleAIPanel, notifications,
    isDarkMode, toggleTheme,
  } = useAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)

  const date = new Date(selectedDate)
  const unread = notifications.filter((n) => !n.read).length

  function navigate(dir: 1 | -1) {
    if (viewMode === 'week') {
      setSelectedDate((dir === 1 ? addWeeks : subWeeks)(date, 1).toISOString())
    } else if (viewMode === 'day') {
      setSelectedDate((dir === 1 ? addDays : subDays)(date, 1).toISOString())
    } else {
      setSelectedDate((dir === 1 ? addMonths : subMonths)(date, 1).toISOString())
    }
  }

  function goToToday() {
    setSelectedDate(new Date().toISOString())
  }

  const headerLabel =
    viewMode === 'day'
      ? format(date, 'EEEE, MMMM d')
      : format(date, 'MMMM yyyy')

  return (
    <header
      className="flex items-center gap-3 px-4 h-14 shrink-0 transition-colors"
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--header-bg)',
      }}
    >
      {/* Navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate(-1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <ChevronLeft size={15} />
        </button>
        <button
          onClick={() => navigate(1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <ChevronRight size={15} />
        </button>
        <button
          onClick={goToToday}
          className="px-2.5 h-7 text-xs font-medium rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          Today
        </button>
      </div>

      {/* Date label */}
      <h1 className="text-sm font-semibold min-w-[160px]" style={{ color: 'var(--text-primary)' }}>
        {headerLabel}
      </h1>

      {/* Search */}
      <div className="flex-1 max-w-xs">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events…"
            className="w-full pl-8 pr-3 h-7 text-xs rounded-lg outline-none transition-colors tempo-input"
          />
        </div>
      </div>

      <div className="flex-1" />

      {/* View mode toggle */}
      <div
        className="flex items-center gap-0.5 p-1 rounded-lg"
        style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
      >
        {([
          { mode: 'day'   as const, icon: Calendar,   label: 'Day' },
          { mode: 'week'  as const, icon: Columns,     label: 'Week' },
          { mode: 'month' as const, icon: LayoutGrid,  label: 'Month' },
        ] as const).map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            title={label}
            className="w-7 h-6 flex items-center justify-center rounded-md transition-all text-xs"
            style={
              viewMode === mode
                ? { background: 'rgba(124,58,237,0.25)', color: '#a78bfa' }
                : { color: 'var(--text-muted)' }
            }
          >
            <Icon size={13} />
          </button>
        ))}
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
        style={{
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          color: isDarkMode ? '#f59e0b' : '#7c3aed',
        }}
      >
        {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
      </button>

      {/* AI button */}
      <button
        onClick={toggleAIPanel}
        className="flex items-center gap-1.5 px-3 h-7 text-xs font-medium rounded-lg transition-all hover:opacity-90"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.15))',
          border: '1px solid rgba(124,58,237,0.3)',
          color: '#a78bfa',
        }}
      >
        <Sparkles size={12} />
        <span>AI</span>
      </button>

      {/* New event */}
      <button
        onClick={() => openEventModal()}
        className="flex items-center gap-1.5 px-3 h-7 text-xs font-semibold rounded-lg transition-all hover:opacity-90 text-white"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
      >
        <Plus size={13} />
        <span>New</span>
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors relative"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Bell size={15} />
          {unread > 0 && (
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ background: '#ef4444' }}
            />
          )}
        </button>
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 z-50"
            >
              <NotificationCenter onClose={() => setShowNotifications(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
