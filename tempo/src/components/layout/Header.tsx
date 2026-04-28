import { useEffect, useRef, useState } from 'react'
import { format, addWeeks, subWeeks, addDays, subDays, addMonths, subMonths } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Plus, Search, Bell,
  LayoutGrid, Columns, Calendar, Sparkles, Sun, Moon, Menu
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import NotificationCenter from '../notifications/NotificationCenter'

interface HeaderProps {
  onMenuToggle?: () => void
  isMobile?: boolean
}

export default function Header({ onMenuToggle, isMobile }: HeaderProps) {
  const {
    viewMode, setViewMode, selectedDate, setSelectedDate,
    openEventModal, toggleAIPanel, notifications,
    isDarkMode, toggleTheme,
  } = useAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!showNotifications) return

    function handlePointerDown(event: PointerEvent) {
      if (!notificationsRef.current) return
      if (!notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowNotifications(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showNotifications])

  const headerLabel =
    viewMode === 'day'
      ? format(date, isMobile ? 'EEE, MMM d' : 'EEEE, MMMM d')
      : format(date, isMobile ? 'MMM yyyy' : 'MMMM yyyy')

  return (
    <header
      className="flex items-center gap-2 px-3 shrink-0 transition-colors"
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--header-bg)',
        minHeight: isMobile ? 'calc(48px + var(--safe-top))' : 48,
        paddingTop: isMobile ? 'calc(var(--safe-top) + 4px)' : undefined,
        paddingBottom: isMobile ? 6 : undefined,
      }}
    >
      {/* Mobile hamburger */}
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Menu size={18} />
        </button>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-0.5">
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
        {!isMobile && (
          <button
            onClick={goToToday}
            className="px-2 h-7 text-xs font-medium rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            Today
          </button>
        )}
      </div>

      {/* Date label */}
      <h1
        className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold whitespace-nowrap`}
        style={{ color: 'var(--text-primary)', minWidth: isMobile ? undefined : 160 }}
      >
        {headerLabel}
      </h1>

      {/* Search — hidden on mobile */}
      {!isMobile && (
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
      )}

      <div className="flex-1" />

      {/* View mode toggle */}
      {!isMobile && (
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
                  ? { background: 'rgba(255,106,0,0.25)', color: '#ffb347' }
                  : { color: 'var(--text-muted)' }
              }
            >
              <Icon size={13} />
            </button>
          ))}
        </div>
      )}

      {/* Theme toggle */}
      {!isMobile && (
        <button
          onClick={toggleTheme}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all shrink-0"
          style={{
            background: 'var(--input-bg)',
            border: '1px solid var(--input-border)',
            color: isDarkMode ? '#f59e0b' : '#ff6a00',
          }}
        >
          {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      )}

      {/* AI button — desktop only (mobile has bottom nav) */}
      {!isMobile && (
        <button
          onClick={toggleAIPanel}
          className="flex items-center gap-1.5 px-3 h-7 text-xs font-medium rounded-lg transition-all hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, rgba(255,106,0,0.25), rgba(255,138,0,0.15))',
            border: '1px solid rgba(255,106,0,0.3)',
            color: '#ffb347',
          }}
        >
          <Sparkles size={12} />
          <span>AI</span>
        </button>
      )}

      {/* New event */}
      <button
        onClick={() => openEventModal()}
        className="flex items-center gap-1.5 px-3 h-7 text-xs font-semibold rounded-lg transition-all hover:opacity-90 text-white shrink-0"
        style={{ background: 'linear-gradient(135deg, #ff6a00, #ff8a00)' }}
      >
        <Plus size={13} />
        {!isMobile && <span>New</span>}
      </button>

      {/* Notifications */}
      <div ref={notificationsRef} className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors relative shrink-0"
          style={{ color: 'var(--text-secondary)' }}
          aria-expanded={showNotifications}
          aria-label="Notifications"
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
              style={isMobile ? { right: -8, width: 'calc(100vw - 16px)', maxWidth: 360 } : undefined}
            >
              <NotificationCenter onClose={() => setShowNotifications(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
