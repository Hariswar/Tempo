import { motion } from 'framer-motion'
import { Bell, AlertTriangle, Lightbulb, Clock, Zap, X } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { relativeTime } from '../../lib/utils'
import { getNotificationNavigationPlan } from '../../lib/notifications'
import { useNotificationActions } from '../../lib/useNotificationActions'
import type { Notification } from '../../types'

const TYPE_CONFIG = {
  conflict:   { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  suggestion: { icon: Lightbulb,    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  reminder:   { icon: Clock,         color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  insight:    { icon: Zap,           color: '#ff7a00', bg: 'rgba(255,122,0,0.1)' },
  ai:         { icon: Bell,          color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
}

export default function NotificationCenter({ onClose }: { onClose: () => void }) {
  const { notifications, events, markAllNotificationsRead } = useAppStore()
  const unread = notifications.filter((n) => !n.read).length
  const { activateNotification } = useNotificationActions()

  return (
    <div
      className="w-80 rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-text-secondary" />
          <span className="text-sm font-semibold text-text-primary">Notifications</span>
          {unread > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: '#ef4444' }}>
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={() => {
                markAllNotificationsRead()
                onClose()
              }}
              className="text-[11px] text-text-muted hover:text-text-primary transition-colors"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close notifications"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell size={24} className="text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-muted">No notifications</p>
          </div>
        ) : (
          notifications.map((notif, i) => (
            <NotificationItem
              key={notif.id}
              notif={notif}
              onRead={() => activateNotification(notif, onClose)}
              ctaLabel={getNotificationNavigationPlan(notif, events).ctaLabel}
              delay={i * 0.04}
            />
          ))
        )}
      </div>
    </div>
  )
}

function NotificationItem({
  notif,
  onRead,
  ctaLabel,
  delay,
}: {
  notif: Notification
  onRead: () => void
  ctaLabel: string
  delay: number
}) {
  const config = TYPE_CONFIG[notif.type]
  const Icon = config.icon

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      onClick={onRead}
      className="w-full text-left flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/3"
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        opacity: notif.read ? 0.5 : 1,
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: config.bg }}
      >
        <Icon size={14} style={{ color: config.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[12px] font-semibold text-text-primary leading-snug">{notif.title}</span>
          {!notif.read && (
            <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: '#ff6a00' }} />
          )}
        </div>
        <p className="text-[11px] text-text-muted leading-snug mt-0.5">{notif.body}</p>
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-[10px] text-text-muted block">{relativeTime(notif.createdAt)}</span>
          <span className="text-[10px] font-medium" style={{ color: '#ffb347' }}>{ctaLabel}</span>
        </div>
      </div>
    </motion.button>
  )
}
