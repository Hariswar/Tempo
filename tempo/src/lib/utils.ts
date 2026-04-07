import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { EventCategory } from "../types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  research_meeting: '#6366f1',
  work_meeting:     '#3b82f6',
  class:            '#10b981',
  focus_block:      '#8b5cf6',
  exercise:         '#f59e0b',
  personal:         '#ec4899',
  errand:           '#84cc16',
  meal:             '#f97316',
  commute:          '#64748b',
  deadline_task:    '#ef4444',
  other:            '#6b7280',
}

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  research_meeting: 'Research',
  work_meeting:     'Meeting',
  class:            'Class',
  focus_block:      'Focus',
  exercise:         'Exercise',
  personal:         'Personal',
  errand:           'Errand',
  meal:             'Meal',
  commute:          'Commute',
  deadline_task:    'Deadline',
  other:            'Other',
}

export const CATEGORY_ICONS: Record<EventCategory, string> = {
  research_meeting: '🔬',
  work_meeting:     '💼',
  class:            '📚',
  focus_block:      '🎯',
  exercise:         '💪',
  personal:         '✨',
  errand:           '🛒',
  meal:             '🍽️',
  commute:          '🚗',
  deadline_task:    '⚡',
  other:            '📌',
}

export function getCategoryColor(category: EventCategory): string {
  return CATEGORY_COLORS[category] ?? '#6b7280'
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function formatDuration(startIso: string, endIso: string): string {
  const mins = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function getTopOfHourMs(hour: number, date: Date): number {
  const d = new Date(date)
  d.setHours(hour, 0, 0, 0)
  return d.getTime()
}

export function minuteSinceStartOfDay(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate()
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
