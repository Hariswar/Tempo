import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, BarChart3, Settings, Sparkles, Bell,
  ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { cn } from '../../lib/utils'
import MiniCalendar from '../calendar/MiniCalendar'

const NAV_ITEMS = [
  { to: '/', icon: Calendar, label: 'Calendar' },
  { to: '/insights', icon: BarChart3, label: 'Insights' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

interface SidebarProps {
  onCloseMobile?: () => void
}

export default function Sidebar({ onCloseMobile }: SidebarProps) {
  const { isSidebarCollapsed, toggleSidebar, toggleAIPanel, notifications, user } = useAppStore()
  const unread = notifications.filter((n) => !n.read).length

  // On mobile overlay, always show expanded
  const isCollapsed = onCloseMobile ? false : isSidebarCollapsed

  return (
    <motion.aside
      animate={{ width: onCloseMobile ? 256 : (isCollapsed ? 64 : 240) }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex flex-col h-full shrink-0 overflow-hidden"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-subtle)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <div className="w-8 h-8 rounded-xl shrink-0 overflow-hidden">
          <img
            src="/mascot.png"
            alt="Tempo mascot"
            className="w-full h-full object-cover"
          />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col -gap-0.5 flex-1"
            >
              <span className="text-sm font-semibold text-text-primary leading-none">Tempo</span>
              <span className="text-[10px] text-text-muted leading-none mt-0.5">AI Calendar</span>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Close button for mobile overlay */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors ml-auto"
          >
            <X size={16} className="text-text-muted" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-2 flex-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn('sidebar-item', isActive ? 'active' : '')
            }
            title={isCollapsed ? label : undefined}
            onClick={onCloseMobile}
          >
            <Icon size={16} className="shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}

        {/* AI Assistant */}
        <button
          onClick={() => { toggleAIPanel(); onCloseMobile?.() }}
          title={isCollapsed ? 'AI Assistant' : undefined}
          className="sidebar-item text-left w-full"
          style={{ color: '#ffb347' }}
        >
          <Sparkles size={16} className="shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                AI Assistant
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Mini Calendar — only when expanded */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 overflow-hidden"
            >
              <div
                className="rounded-xl p-3"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
              >
                <MiniCalendar />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Bottom: user + collapse */}
      <div className="p-2 flex flex-col gap-1">
        {/* Notifications badge */}
        <button
          className="sidebar-item w-full relative"
          title={isCollapsed ? 'Notifications' : undefined}
        >
          <div className="relative shrink-0">
            <Bell size={16} />
            {unread > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                style={{ background: '#ef4444' }}
              >
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Notifications
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User avatar */}
        <div className="sidebar-item">
          <div
            className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #ff6a00, #ec4899)' }}
          >
            {user.displayName.charAt(0)}
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col"
              >
                <span className="text-[12px] font-medium text-text-primary leading-none">{user.displayName}</span>
                <span className="text-[10px] text-text-muted leading-none mt-0.5 truncate max-w-[140px]">{user.email}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse button — hide on mobile overlay */}
        {!onCloseMobile && (
          <button
            onClick={toggleSidebar}
            className="sidebar-item w-full justify-center mt-1"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs">
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>
    </motion.aside>
  )
}
