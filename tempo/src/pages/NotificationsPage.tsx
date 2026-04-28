import { motion } from 'framer-motion'
import { Bell, AlertTriangle, Lightbulb, Clock, Zap } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { relativeTime } from '../lib/utils'
import { getNotificationNavigationPlan } from '../lib/notifications'
import { useNotificationActions } from '../lib/useNotificationActions'
import type { Notification } from '../types'

const TYPE_CONFIG = {
  conflict:   { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  suggestion: { icon: Lightbulb, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  reminder:   { icon: Clock, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  insight:    { icon: Zap, color: '#ff7a00', bg: 'rgba(255,122,0,0.1)' },
  ai:         { icon: Bell, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
}

export default function NotificationsPage() {
  const { notifications, events, markAllNotificationsRead } = useAppStore()
  const { activateNotification } = useNotificationActions()
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Notifications</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {unread > 0 ? `${unread} unread` : 'All caught up'}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="px-3 h-8 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: 'rgba(255,106,0,0.14)',
                border: '1px solid rgba(255,106,0,0.3)',
                color: '#ffb347',
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          {notifications.length === 0 ? (
            <div className="py-10 text-center">
              <Bell size={24} className="text-text-muted mx-auto mb-2" />
              <p className="text-xs text-text-muted">No notifications</p>
            </div>
          ) : (
            notifications.map((notif, i) => (
              <NotificationRow
                key={notif.id}
                notif={notif}
                delay={i * 0.03}
                onRead={() => activateNotification(notif)}
                ctaLabel={getNotificationNavigationPlan(notif, events).ctaLabel}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function NotificationRow({
  notif,
  delay,
  onRead,
  ctaLabel,
}: {
  notif: Notification
  delay: number
  onRead: () => void
  ctaLabel: string
}) {
  const config = TYPE_CONFIG[notif.type]
  const Icon = config.icon

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onRead}
      className="w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/3"
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        opacity: notif.read ? 0.55 : 1,
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
