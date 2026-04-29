import { AnimatePresence, motion } from 'framer-motion'
import { format } from 'date-fns'
import { X, MapPin, Users, Clock, Repeat, Tag, CheckCircle2, Edit3, Trash2, AlertCircle } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { getCategoryColor, CATEGORY_LABELS, CATEGORY_ICONS, formatDuration } from '../../lib/utils'
import LocationMap from '../location/LocationMap'
import { useIsMobile } from '../../lib/useIsMobile'

export default function EventDetailPanel() {
  const { selectedEvent, selectEvent, openEventModal, deleteEvent, completeEvent } = useAppStore()
  const isMobile = useIsMobile()

  if (!selectedEvent) return null

  const color = getCategoryColor(selectedEvent.category)

  function handleEdit() {
    openEventModal(selectedEvent!)
    selectEvent(null)
  }

  function handleDelete() {
    deleteEvent(selectedEvent!.id)
    selectEvent(null)
  }

  function handleComplete() {
    completeEvent(selectedEvent!.id)
    selectEvent(null)
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-40"
        onClick={() => selectEvent(null)}
        style={{ background: 'rgba(0,0,0,0.4)' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className={isMobile
          ? 'fixed z-50 left-2 right-2 rounded-2xl shadow-2xl overflow-hidden flex flex-col'
          : 'fixed z-50 top-20 left-1/2 -translate-x-1/2 w-80 rounded-2xl shadow-2xl overflow-hidden flex flex-col'}
        style={{
          background: '#13131f',
          border: `1px solid ${color}30`,
          ...(isMobile
            ? {
                top: 'calc(var(--safe-top) + 56px)',
                bottom: 'calc(var(--safe-bottom) + 8px)',
                maxHeight: 'calc(100dvh - var(--safe-top) - var(--safe-bottom) - 64px)',
              }
            : {
                maxHeight: 'min(85dvh, 720px)',
              }),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Color bar */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }} />

        <div className="p-4 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 mt-0.5" style={{ background: `${color}15` }}>
              {CATEGORY_ICONS[selectedEvent.category]}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary text-sm leading-snug">
                {selectedEvent.isCompleted && <span className="text-green-400 mr-1">✓</span>}
                {selectedEvent.title}
              </h3>
              <span className="text-[11px] font-medium" style={{ color }}>{CATEGORY_LABELS[selectedEvent.category]}</span>
            </div>
            <button onClick={() => selectEvent(null)} className="p-1 rounded-lg hover:bg-white/5">
              <X size={13} className="text-text-muted" />
            </button>
          </div>

          {/* Details */}
          <div className="mt-3 space-y-2 min-h-0 overflow-y-auto pr-1">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Clock size={12} className="text-text-muted shrink-0" />
              <span>
                {format(new Date(selectedEvent.startUtc), 'EEE, MMM d · h:mm a')}
                {' – '}
                {format(new Date(selectedEvent.endUtc), 'h:mm a')}
                {' '}
                <span className="text-text-muted">({formatDuration(selectedEvent.startUtc, selectedEvent.endUtc)})</span>
              </span>
            </div>

            {selectedEvent.locationLabel && (
              <div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <MapPin size={12} className="text-text-muted shrink-0" />
                  <span>{selectedEvent.locationLabel}</span>
                </div>
                {selectedEvent.locationLat && selectedEvent.locationLng && (
                  <div className="mt-2">
                    <LocationMap
                      coordinates={{
                        latitude: selectedEvent.locationLat,
                        longitude: selectedEvent.locationLng,
                      }}
                      readOnly={true}
                    />
                  </div>
                )}
              </div>
            )}

            {selectedEvent.attendeeCount > 1 && (
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Users size={12} className="text-text-muted shrink-0" />
                <span>{selectedEvent.attendeeCount} attendees{selectedEvent.hasExternalAttendees ? ' (external)' : ''}</span>
              </div>
            )}

            {selectedEvent.isRecurring && (
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Repeat size={12} className="text-text-muted shrink-0" />
                <span>Recurring event</span>
              </div>
            )}

            {selectedEvent.flexibility !== 'flexible' && (
              <div className="flex items-center gap-2 text-[11px]">
                <Tag size={11} className="text-text-muted shrink-0" />
                <span className="px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
                  {selectedEvent.flexibility === 'fixed' ? 'Fixed — cannot be moved' : 'Semi-flexible'}
                </span>
              </div>
            )}

            {selectedEvent.deadlineUtc && (
              <div className="flex items-center gap-2 text-xs" style={{ color: '#ef4444' }}>
                <AlertCircle size={12} className="shrink-0" />
                <span>Due {format(new Date(selectedEvent.deadlineUtc), 'MMM d, h:mm a')}</span>
              </div>
            )}

            {selectedEvent.description && (
              <p className="text-xs text-text-muted leading-relaxed pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {selectedEvent.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 pt-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {!selectedEvent.isCompleted && (
              <button
                onClick={handleComplete}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors hover:bg-green-500/10 text-green-400"
              >
                <CheckCircle2 size={12} />
                Done
              </button>
            )}
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors hover:bg-white/5 text-text-secondary"
            >
              <Edit3 size={12} />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors hover:bg-red-500/10 text-red-400 ml-auto"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
