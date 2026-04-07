import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addHours } from 'date-fns'
import {
  X, MapPin, Users, Clock, Repeat, AlertTriangle,
  Trash2, CheckCircle2, Edit3, Calendar
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import type { CalendarEvent, EventCategory, EventFlexibility } from '../../types'
import { getCategoryColor, CATEGORY_LABELS, CATEGORY_ICONS, formatDuration } from '../../lib/utils'

const CATEGORIES: EventCategory[] = [
  'focus_block', 'work_meeting', 'research_meeting', 'class',
  'exercise', 'personal', 'meal', 'errand', 'deadline_task', 'commute', 'other'
]

const FLEXIBILITY_OPTIONS: { value: EventFlexibility; label: string; desc: string }[] = [
  { value: 'fixed', label: 'Fixed', desc: 'Cannot be moved' },
  { value: 'semi_flexible', label: 'Semi-flexible', desc: 'Prefer original time' },
  { value: 'flexible', label: 'Flexible', desc: 'Can be freely rescheduled' },
]

function toLocalDateTimeInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalDateTimeInput(val: string): string {
  return new Date(val).toISOString()
}

export default function EventModal() {
  const { editingEvent, closeEventModal, createEvent, updateEvent, deleteEvent, completeEvent, selectEvent } = useAppStore()
  const isEditing = !!editingEvent?.id

  const defaultStart = editingEvent?.startUtc ?? new Date().toISOString()
  const defaultEnd = editingEvent?.endUtc ?? addHours(new Date(), 1).toISOString()

  const [form, setForm] = useState<Partial<CalendarEvent>>({
    title: editingEvent?.title ?? '',
    description: editingEvent?.description ?? '',
    category: editingEvent?.category ?? 'focus_block',
    flexibility: editingEvent?.flexibility ?? 'flexible',
    startUtc: defaultStart,
    endUtc: defaultEnd,
    locationLabel: editingEvent?.locationLabel ?? '',
    hasExternalAttendees: editingEvent?.hasExternalAttendees ?? false,
    attendeeCount: editingEvent?.attendeeCount ?? 1,
    isRecurring: editingEvent?.isRecurring ?? false,
    deadlineUtc: editingEvent?.deadlineUtc ?? '',
  })

  const color = getCategoryColor(form.category as EventCategory)

  function set<K extends keyof CalendarEvent>(key: K, val: CalendarEvent[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title?.trim()) return

    const payload = {
      ...form,
      startUtc: form.startUtc!,
      endUtc: form.endUtc!,
      title: form.title!,
      category: form.category!,
      flexibility: form.flexibility!,
      isRecurring: form.isRecurring ?? false,
      hasExternalAttendees: form.hasExternalAttendees ?? false,
      attendeeCount: form.attendeeCount ?? 1,
      isCompleted: false,
      aiGenerated: false,
      description: form.description ?? undefined,
      locationLabel: form.locationLabel || undefined,
      deadlineUtc: form.deadlineUtc || undefined,
    }

    if (isEditing) {
      updateEvent(editingEvent!.id, payload)
    } else {
      createEvent(payload)
    }
    closeEventModal()
  }

  function handleDelete() {
    if (editingEvent?.id) {
      deleteEvent(editingEvent.id)
      closeEventModal()
    }
  }

  function handleComplete() {
    if (editingEvent?.id) {
      completeEvent(editingEvent.id)
      closeEventModal()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-sm font-semibold text-text-primary">
              {isEditing ? 'Edit Event' : 'New Event'}
            </span>
          </div>
          <button onClick={closeEventModal} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <X size={15} className="text-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <input
            autoFocus
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Event title…"
            className="w-full bg-transparent text-text-primary text-lg font-semibold placeholder:text-text-muted outline-none border-b pb-2 transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.08)', caretColor: color }}
          />

          {/* Category chips */}
          <div>
            <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider block mb-2">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const c = getCategoryColor(cat)
                const selected = form.category === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => set('category', cat)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                    style={{
                      background: selected ? `${c}25` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${selected ? c + '50' : 'rgba(255,255,255,0.08)'}`,
                      color: selected ? c : '#4a4964',
                    }}
                  >
                    <span>{CATEGORY_ICONS[cat]}</span>
                    <span>{CATEGORY_LABELS[cat]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider block mb-1.5">Start</label>
              <input
                type="datetime-local"
                value={toLocalDateTimeInput(form.startUtc!)}
                onChange={(e) => set('startUtc', fromLocalDateTimeInput(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs text-text-primary outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider block mb-1.5">End</label>
              <input
                type="datetime-local"
                value={toLocalDateTimeInput(form.endUtc!)}
                onChange={(e) => set('endUtc', fromLocalDateTimeInput(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs text-text-primary outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
          </div>

          {/* Flexibility */}
          <div>
            <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider block mb-2">Flexibility</label>
            <div className="grid grid-cols-3 gap-2">
              {FLEXIBILITY_OPTIONS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('flexibility', value)}
                  className="flex flex-col items-center py-2 px-2 rounded-xl text-center transition-all"
                  style={{
                    background: form.flexibility === value ? `${color}15` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${form.flexibility === value ? color + '40' : 'rgba(255,255,255,0.07)'}`,
                  }}
                >
                  <span className="text-xs font-semibold" style={{ color: form.flexibility === value ? color : '#4a4964' }}>{label}</span>
                  <span className="text-[10px] text-text-muted mt-0.5">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider block mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Add notes…"
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-xs text-text-primary outline-none resize-none placeholder:text-text-muted"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <MapPin size={13} className="text-text-muted shrink-0" />
            <input
              value={form.locationLabel}
              onChange={(e) => set('locationLabel', e.target.value)}
              placeholder="Add location…"
              className="flex-1 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>

          {/* Toggles row */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => set('isRecurring', e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-8 h-4 rounded-full relative transition-colors"
                style={{ background: form.isRecurring ? color : 'rgba(255,255,255,0.1)' }}
              >
                <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform" style={{ left: form.isRecurring ? 17 : 2 }} />
              </div>
              <span className="text-xs text-text-secondary">Recurring</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hasExternalAttendees}
                onChange={(e) => set('hasExternalAttendees', e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-8 h-4 rounded-full relative transition-colors"
                style={{ background: form.hasExternalAttendees ? color : 'rgba(255,255,255,0.1)' }}
              >
                <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform" style={{ left: form.hasExternalAttendees ? 17 : 2 }} />
              </div>
              <span className="text-xs text-text-secondary">External attendees</span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={handleComplete}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-green-500/10 text-green-400"
                >
                  <CheckCircle2 size={13} />
                  Complete
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-red-500/10 text-red-400"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={closeEventModal}
              className="px-4 py-2 rounded-xl text-xs font-medium text-text-secondary hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
            >
              {isEditing ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
