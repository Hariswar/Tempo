import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Sparkles, Send, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { useAppStore } from '../../stores/appStore'
import type { AIMessage, ConflictResolution, RescheduleOption } from '../../types'
import { sendAIMessage, type AIMutation } from '../../services/aiService'
import { getCategoryColor } from '../../lib/utils'

const WELCOME_MESSAGE: AIMessage = {
  id: 'welcome',
  role: 'assistant',
  timestamp: new Date().toISOString(),
  content: "Hi! I'm **Tempo AI** — your autonomous scheduling assistant. I can:\n\n• Detect and resolve calendar conflicts\n• Find the best time slots for new events\n• Optimize your week based on your habits\n• Give you productivity insights\n\nWhat would you like to do?",
  actions: [
    { type: 'view_conflict', label: '🔍 Check for conflicts', payload: null },
    { type: 'create_event', label: '➕ Schedule something', payload: null },
    { type: 'view_conflict', label: '📊 Show insights', payload: null },
  ],
}

const QUICK_PROMPTS = [
  'Do I have any conflicts?',
  'Optimize my schedule',
  'When am I free today?',
  'Show my deadlines',
]

type PendingMutationPlan = {
  id: string
  createdAt: string
  content: string
  mutations: AIMutation[]
}

function parseHm(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const [h, m] = value.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return fallback
  return h * 60 + m
}

function overlapsQuietHours(start: Date, end: Date, quietStartMin: number, quietEndMin: number): boolean {
  const current = new Date(start)
  while (current < end) {
    const minute = current.getHours() * 60 + current.getMinutes()
    const inQuiet =
      quietStartMin <= quietEndMin
        ? minute >= quietStartMin && minute < quietEndMin
        : minute >= quietStartMin || minute < quietEndMin
    if (inQuiet) return true
    current.setMinutes(current.getMinutes() + 30)
  }
  return false
}

function hasOverlap(startMs: number, endMs: number, ranges: Array<{ startMs: number; endMs: number }>): boolean {
  return ranges.some((range) => startMs < range.endMs && endMs > range.startMs)
}

function formatDayTime(startUtc: string, endUtc: string): string {
  return `${format(new Date(startUtc), 'EEE, MMM d h:mm a')} - ${format(new Date(endUtc), 'h:mm a')}`
}

function mutationNeedsConfirmation(m: AIMutation): boolean {
  return m.type === 'CREATE_EVENT' || m.type === 'MOVE_EVENT' || m.type === 'UPDATE_EVENT' || m.type === 'DELETE_EVENT'
}

function optimizeMutations(params: {
  rawMutations: AIMutation[]
  events: Array<{
    id: string
    title: string
    startUtc: string
    endUtc: string
    category: string
    flexibility: string
  }>
  message: string
  now: Date
  workdayStart: string
  workdayEnd: string
  quietStart: string
  quietEnd: string
}): { mutations: AIMutation[]; notes: string[] } {
  const {
    rawMutations, events, message, now, workdayStart, workdayEnd, quietStart, quietEnd,
  } = params

  const notes: string[] = []
  if (rawMutations.length === 0) return { mutations: [], notes }

  const workStartMin = Math.max(6 * 60, parseHm(workdayStart, 8 * 60))
  const workEndMin = Math.min(22 * 60, parseHm(workdayEnd, 22 * 60))
  const quietStartMin = parseHm(quietStart, 23 * 60)
  const quietEndMin = parseHm(quietEnd, 7 * 60)

  const occupiedRanges = events.map((event) => ({
    startMs: new Date(event.startUtc).getTime(),
    endMs: new Date(event.endUtc).getTime(),
    eventId: event.id,
  }))

  const pendingRangeAdds: Array<{ startMs: number; endMs: number }> = []
  const createMutations = rawMutations.filter((mutation) => mutation.type === 'CREATE_EVENT')
  const isMultiEventRequest =
    createMutations.length >= 2 &&
    /(multiple|several|few|couple|batch|plan|weekly|week|across|spread|routine)/i.test(message)
  const isWorkoutBatchRequest = /workout|gym|strength|muscle|split|training|cardio/i.test(message)
  const usedDayKeys = new Set<string>()

  function reserveRange(startUtc: string, endUtc: string) {
    const startMs = new Date(startUtc).getTime()
    const endMs = new Date(endUtc).getTime()
    pendingRangeAdds.push({ startMs, endMs })
  }

  function findSlot(
    durationMs: number,
    preferredStart: Date,
    eventIdToIgnore?: string,
    preferDistinctDays = false
  ): { startUtc: string; endUtc: string } {
    const candidateDays = 14
    const stepMs = 30 * 60 * 1000
    const anchorDay = new Date(preferredStart)
    anchorDay.setHours(0, 0, 0, 0)
    const preferredMinute = preferredStart.getHours() * 60 + preferredStart.getMinutes()

    let best: { startUtc: string; endUtc: string; score: number } | null = null

    for (let dayOffset = 0; dayOffset <= candidateDays; dayOffset += 1) {
      const day = new Date(anchorDay.getTime() + dayOffset * 24 * 60 * 60 * 1000)
      const dayKey = day.toDateString()
      const dayStart = new Date(day)
      dayStart.setHours(Math.floor(workStartMin / 60), workStartMin % 60, 0, 0)
      const dayEnd = new Date(day)
      dayEnd.setHours(Math.floor(workEndMin / 60), workEndMin % 60, 0, 0)
      let cursor = dayStart.getTime()
      const latestStart = dayEnd.getTime() - durationMs

      while (cursor <= latestStart) {
        const slotStart = new Date(cursor)
        const slotEnd = new Date(cursor + durationMs)
        if (slotStart < now) {
          cursor += stepMs
          continue
        }

        if (overlapsQuietHours(slotStart, slotEnd, quietStartMin, quietEndMin)) {
          cursor += stepMs
          continue
        }

        const overlapBase = occupiedRanges
          .filter((range) => range.eventId !== eventIdToIgnore)
          .map((range) => ({ startMs: range.startMs, endMs: range.endMs }))
        const overlapPending = pendingRangeAdds
        if (hasOverlap(cursor, cursor + durationMs, [...overlapBase, ...overlapPending])) {
          cursor += stepMs
          continue
        }

        const minute = slotStart.getHours() * 60 + slotStart.getMinutes()
        const distancePenalty = Math.abs(minute - preferredMinute) / 15
        const dayPenalty = dayOffset * 4
        const distinctDayPenalty = preferDistinctDays && usedDayKeys.has(dayKey) ? 12 : 0
        const score = dayPenalty + distancePenalty + distinctDayPenalty

        if (!best || score < best.score) {
          best = {
            startUtc: slotStart.toISOString(),
            endUtc: slotEnd.toISOString(),
            score,
          }
        }
        cursor += stepMs
      }
    }

    if (best) return { startUtc: best.startUtc, endUtc: best.endUtc }

    const fallbackStart = new Date(now)
    fallbackStart.setHours(Math.floor(workStartMin / 60), workStartMin % 60, 0, 0)
    if (fallbackStart < now) fallbackStart.setDate(fallbackStart.getDate() + 1)
    const fallbackEnd = new Date(fallbackStart.getTime() + durationMs)
    return { startUtc: fallbackStart.toISOString(), endUtc: fallbackEnd.toISOString() }
  }

  const normalized = rawMutations.map((mutation) => {
    if (mutation.type === 'CREATE_EVENT') {
      const originalStart = new Date(mutation.startUtc)
      const originalEnd = new Date(mutation.endUtc)
      const originalDuration = originalEnd.getTime() - originalStart.getTime()
      const durationMs = Math.min(Math.max(originalDuration > 0 ? originalDuration : 60 * 60 * 1000, 30 * 60 * 1000), 3 * 60 * 60 * 1000)
      const isWorkout = mutation.category === 'exercise' || /workout|gym|strength|cardio|chest|back|legs|shoulders|arms/i.test(mutation.title)
      const shouldSpreadAcrossDays =
        isMultiEventRequest &&
        (isWorkoutBatchRequest || mutation.category !== 'work_meeting')
      const slot = findSlot(durationMs, originalStart, undefined, shouldSpreadAcrossDays)
      reserveRange(slot.startUtc, slot.endUtc)
      if (shouldSpreadAcrossDays || isWorkout) {
        usedDayKeys.add(new Date(slot.startUtc).toDateString())
      }

      if (slot.startUtc !== mutation.startUtc || slot.endUtc !== mutation.endUtc) {
        notes.push(`Adjusted "${mutation.title}" to ${formatDayTime(slot.startUtc, slot.endUtc)} for better timing and conflict safety.`)
      }

      return {
        ...mutation,
        startUtc: slot.startUtc,
        endUtc: slot.endUtc,
      }
    }

    if (mutation.type === 'MOVE_EVENT') {
      const existing = events.find((event) => event.id === mutation.eventId)
      if (!existing) {
        notes.push('Skipped one move because the event could not be found.')
        return null
      }
      if (existing.flexibility === 'fixed') {
        notes.push(`Skipped moving "${existing.title}" because it is marked fixed.`)
        return null
      }

      const proposedStart = new Date(mutation.startUtc)
      const proposedEnd = new Date(mutation.endUtc)
      const currentStart = new Date(existing.startUtc)
      const currentEnd = new Date(existing.endUtc)
      const durationMs = Math.min(
        Math.max(proposedEnd.getTime() - proposedStart.getTime() || (currentEnd.getTime() - currentStart.getTime()), 30 * 60 * 1000),
        3 * 60 * 60 * 1000
      )
      const slot = findSlot(durationMs, proposedStart, existing.id, false)
      reserveRange(slot.startUtc, slot.endUtc)

      if (slot.startUtc !== mutation.startUtc || slot.endUtc !== mutation.endUtc) {
        notes.push(`Refined move for "${existing.title}" to ${formatDayTime(slot.startUtc, slot.endUtc)}.`)
      }

      return {
        ...mutation,
        startUtc: slot.startUtc,
        endUtc: slot.endUtc,
      }
    }

    return mutation
  }).filter(Boolean) as AIMutation[]

  return { mutations: normalized, notes }
}

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/\*\*(.*?)\*\*/g)
  return (
    <span>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i} className="font-semibold text-text-primary">{part}</strong>
          : <span key={i}>{part}</span>
      )}
    </span>
  )
}

export default function AIAssistantPanel({ isMobile }: { isMobile?: boolean }) {
  const { toggleAIPanel, aiMessages, addAIMessage, events, pendingConflict, acceptRescheduleOption, setPendingConflict, createEvent, updateEvent, moveEvent, deleteEvent, user } = useAppStore()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<PendingMutationPlan | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const allMessages = aiMessages.length === 0 ? [WELCOME_MESSAGE] : aiMessages

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages, isTyping])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function sendMessage(text: string) {
    if (!text.trim()) return
    setInput('')

    const userMsg: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    addAIMessage(userMsg)
    setIsTyping(true)

    try {
      const response = await sendAIMessage(
        text,
        events,
        new Date(),
        {
          timezone: user.timezone,
          workdayStart: user.workdayStart,
          workdayEnd: user.workdayEnd,
          quietStart: user.quietStart,
          quietEnd: user.quietEnd,
          travelBufferMinutes: user.travelBufferMinutes,
        }
      )
      const assistantMsg: AIMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
      }
      addAIMessage(assistantMsg)

      if (response.mutations && response.mutations.length > 0) {
        const { mutations: optimizedMutations, notes } = optimizeMutations({
          rawMutations: response.mutations,
          events,
          message: text,
          now: new Date(),
          workdayStart: user.workdayStart,
          workdayEnd: user.workdayEnd,
          quietStart: user.quietStart,
          quietEnd: user.quietEnd,
        })

        const gated = optimizedMutations.filter((m) => mutationNeedsConfirmation(m))

        if (notes.length > 0) {
          addAIMessage({
            id: `msg-${Date.now()}-ai-note`,
            role: 'assistant',
            content: notes.slice(0, 3).join('\n'),
            timestamp: new Date().toISOString(),
          })
        }

        if (gated.length > 0) {
          const addCount = gated.filter((m) => m.type === 'CREATE_EVENT').length
          const moveCount = gated.filter((m) => m.type === 'MOVE_EVENT').length
          const deleteCount = gated.filter((m) => m.type === 'DELETE_EVENT').length
          const updateCount = gated.filter((m) => m.type === 'UPDATE_EVENT').length
          const summaryParts: string[] = []
          if (addCount > 0) summaryParts.push(`${addCount} addition${addCount > 1 ? 's' : ''}`)
          if (moveCount > 0) summaryParts.push(`${moveCount} move${moveCount > 1 ? 's' : ''}`)
          if (updateCount > 0) summaryParts.push(`${updateCount} change${updateCount > 1 ? 's' : ''}`)
          if (deleteCount > 0) summaryParts.push(`${deleteCount} deletion${deleteCount > 1 ? 's' : ''}`)
          const summary = `I prepared ${summaryParts.join(', ')}. Review these changes, then tap Approve to apply or Cancel to keep your calendar unchanged.`

          setPendingPlan({
            id: `plan-${Date.now()}`,
            createdAt: new Date().toISOString(),
            content: summary,
            mutations: gated,
          })

          addAIMessage({
            id: `msg-${Date.now()}-ai-confirm`,
            role: 'assistant',
            content: summary,
            timestamp: new Date().toISOString(),
          })
        }
      }
    } catch (error) {
      const assistantMsg: AIMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content:
          error instanceof Error
            ? `Groq request failed: ${error.message}`
            : 'Groq request failed. Please check your Netlify function and GROQ_API_KEY.',
        timestamp: new Date().toISOString(),
      }
      addAIMessage(assistantMsg)
    } finally {
      setIsTyping(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 z-40 flex flex-col shadow-2xl"
      style={{
        background: 'var(--sidebar-bg)',
        borderLeft: isMobile ? 'none' : '1px solid var(--border-subtle)',
        width: isMobile ? '100%' : 320,
        paddingTop: isMobile ? 'var(--safe-top)' : 0,
        paddingBottom: isMobile ? 'calc(56px + var(--safe-bottom))' : 0,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff6a00, #ff8a00)' }}>
            <Sparkles size={13} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary leading-none">Tempo AI</div>
            <div className="text-[10px] text-text-muted leading-none mt-0.5">Agentic Scheduler</div>
          </div>
        </div>
        <button onClick={toggleAIPanel} className="p-1.5 rounded-lg transition-colors" onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <X size={14} className="text-text-muted" />
        </button>
      </div>

      {/* Pending conflict banner */}
      {pendingConflict && (
        <ConflictBanner
          conflict={pendingConflict}
          onAccept={acceptRescheduleOption}
          onDismiss={() => setPendingConflict(null)}
        />
      )}

      {pendingPlan && (
        <PendingMutationPlanCard
          plan={pendingPlan}
          events={events}
          onCancel={() => setPendingPlan(null)}
          onApprove={() => {
            pendingPlan.mutations.forEach((m) => {
              try {
                if (m.type === 'MOVE_EVENT') {
                  moveEvent(m.eventId, m.startUtc, m.endUtc)
                } else if (m.type === 'CREATE_EVENT') {
                  createEvent({
                    title: m.title,
                    startUtc: m.startUtc,
                    endUtc: m.endUtc,
                    category: (m.category as any) || 'other',
                    flexibility: (m.flexibility as any) || 'flexible',
                    isRecurring: false,
                    hasExternalAttendees: false,
                    attendeeCount: 1,
                    isCompleted: false,
                    aiGenerated: true,
                  })
                } else if (m.type === 'UPDATE_EVENT') {
                  updateEvent(m.eventId, m.updates)
                } else if (m.type === 'DELETE_EVENT') {
                  deleteEvent(m.eventId)
                }
              } catch (e) {
                console.error('Failed to apply confirmed mutation:', m, e)
              }
            })
            addAIMessage({
              id: `msg-${Date.now()}-ai-applied`,
              role: 'assistant',
              content: 'Confirmed. I applied the requested schedule changes.',
              timestamp: new Date().toISOString(),
            })
            setPendingPlan(null)
          }}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {allMessages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mr-2 mt-0.5" style={{ background: 'linear-gradient(135deg, #ff6a0040, #ff8a0040)' }}>
                <Sparkles size={10} style={{ color: '#ffb347' }} />
              </div>
            )}
            <div className="max-w-[85%]">
              <div
                className={`px-3 py-2.5 text-xs leading-relaxed ${msg.role === 'user' ? 'ai-message-user text-white' : 'ai-message-assistant text-text-secondary'}`}
              >
                <MessageContent content={msg.content} />
              </div>
              {msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.actions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(action.label.replace(/^[^\w]+/, ''))}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all hover:opacity-80"
                      style={{ background: 'rgba(255,106,0,0.15)', border: '1px solid rgba(255,106,0,0.25)', color: '#ffb347' }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="text-[10px] text-text-muted mt-1">
                {format(new Date(msg.timestamp), 'h:mm a')}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(255,106,0,0.2)' }}>
              <Sparkles size={10} style={{ color: '#ffb347' }} />
            </div>
            <div className="ai-message-assistant px-3 py-2.5">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#ffb347' }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts */}
      {allMessages.length <= 1 && (
        <div className="px-3 pb-2">
          <div className="text-[10px] text-text-muted mb-1.5 uppercase tracking-wider font-medium">Quick actions</div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="px-2.5 py-1 rounded-lg text-[11px] text-text-secondary hover:text-text-primary transition-colors"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div
          className="flex items-end gap-2 rounded-xl p-2"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Tempo anything…"
            rows={1}
            className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none resize-none leading-relaxed"
            style={{ maxHeight: 80 }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #ff6a00, #ff8a00)' }}
          >
            <Send size={12} className="text-white" />
          </button>
        </div>
        <div className="text-[10px] text-text-muted text-center mt-1.5">
          Enter to send · Shift+Enter for newline
        </div>
      </div>
    </motion.div>
  )
}

function PendingMutationPlanCard({
  plan,
  events,
  onApprove,
  onCancel,
}: {
  plan: PendingMutationPlan
  events: Array<{ id: string; title: string; startUtc: string; endUtc: string }>
  onApprove: () => void
  onCancel: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mx-3 my-2 rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,106,0,0.3)', background: 'rgba(255,106,0,0.08)' }}
    >
      <div className="p-3">
        <div className="text-xs font-semibold text-text-primary mb-1">Review Planned Changes</div>
        <div className="text-[11px] text-text-secondary mb-2">{plan.content}</div>
        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
          {plan.mutations.map((mutation, idx) => {
            if (mutation.type === 'CREATE_EVENT') {
              return (
                <div key={`${mutation.type}-${idx}`} className="text-[10px] text-text-secondary">
                  Add <strong className="text-text-primary">{mutation.title}</strong> on{' '}
                  <strong className="text-text-primary">{formatDayTime(mutation.startUtc, mutation.endUtc)}</strong>
                </div>
              )
            }
            if (mutation.type === 'MOVE_EVENT') {
              const eventTitle = events.find((e) => e.id === mutation.eventId)?.title || mutation.eventId
              return (
                <div key={`${mutation.type}-${idx}`} className="text-[10px] text-text-secondary">
                  Move <strong className="text-text-primary">{eventTitle}</strong> to{' '}
                  <strong className="text-text-primary">{formatDayTime(mutation.startUtc, mutation.endUtc)}</strong>
                </div>
              )
            }
            if (mutation.type === 'UPDATE_EVENT') {
              const eventTitle = events.find((e) => e.id === mutation.eventId)?.title || mutation.eventId
              const updateBits: string[] = []
              const startUtc = mutation.updates?.startUtc || events.find((e) => e.id === mutation.eventId)?.startUtc
              const endUtc = mutation.updates?.endUtc || events.find((e) => e.id === mutation.eventId)?.endUtc
              if (startUtc && endUtc && (mutation.updates?.startUtc || mutation.updates?.endUtc)) {
                updateBits.push(`time to ${formatDayTime(startUtc, endUtc)}`)
              }
              if (mutation.updates?.title) updateBits.push(`title to "${mutation.updates.title}"`)
              if (mutation.updates?.category) updateBits.push(`category to ${mutation.updates.category}`)
              if (mutation.updates?.locationLabel) updateBits.push(`location to ${mutation.updates.locationLabel}`)
              return (
                <div key={`${mutation.type}-${idx}`} className="text-[10px] text-text-secondary">
                  Change <strong className="text-text-primary">{eventTitle}</strong>
                  {updateBits.length > 0 ? `: ${updateBits.join(', ')}` : ''}
                </div>
              )
            }
            if (mutation.type === 'DELETE_EVENT') {
              const eventRef = events.find((e) => e.id === mutation.eventId)
              const eventTitle = eventRef?.title || mutation.eventId
              const eventWhen = eventRef ? formatDayTime(eventRef.startUtc, eventRef.endUtc) : null
              return (
                <div key={`${mutation.type}-${idx}`} className="text-[10px] text-text-secondary">
                  Delete <strong className="text-text-primary">{eventTitle}</strong>
                  {eventWhen ? ` (${eventWhen})` : ''}
                </div>
              )
            }
            return null
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-2.5 h-7 rounded-lg text-[11px] font-medium text-text-secondary"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
          >
            Cancel
          </button>
          <button
            onClick={onApprove}
            className="px-2.5 h-7 rounded-lg text-[11px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #ff6a00, #ff8a00)' }}
          >
            Approve Changes
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function ConflictBanner({
  conflict,
  onAccept,
  onDismiss,
}: {
  conflict: ConflictResolution
  onAccept: (id: string, start: string, end: string) => void
  onDismiss: () => void
}) {
  const color1 = getCategoryColor(conflict.eventToKeep.category)
  const color2 = getCategoryColor(conflict.eventToMove.category)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mx-3 my-2 rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' }}
    >
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={13} className="text-red-400 shrink-0" />
          <span className="text-xs font-semibold text-red-400">Conflict Detected</span>
          <button onClick={onDismiss} className="ml-auto">
            <X size={12} className="text-text-muted" />
          </button>
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color1 }} />
            <span className="text-[11px] text-text-secondary">Keep: <strong className="text-text-primary">{conflict.eventToKeep.title}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color2 }} />
            <span className="text-[11px] text-text-secondary">Move: <strong className="text-text-primary">{conflict.eventToMove.title}</strong></span>
          </div>
          <div className="text-[10px] text-text-muted pl-3.5">
            {conflict.decisionReasons.slice(0, 2).join(' · ')}
          </div>
        </div>

        {conflict.choiceOptions.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Suggested slots</div>
            {conflict.choiceOptions.map((option: RescheduleOption, i: number) => (
              <button
                key={i}
                onClick={() => onAccept(conflict.eventToMove.id, option.proposedStartUtc, option.proposedEndUtc)}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-all hover:opacity-90"
                style={{ background: 'rgba(255,106,0,0.1)', border: '1px solid rgba(255,106,0,0.2)' }}
              >
                <div>
                  <div className="text-[11px] font-medium text-text-primary">
                    {format(new Date(option.proposedStartUtc), 'EEE, MMM d')}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {format(new Date(option.proposedStartUtc), 'h:mm a')} – {format(new Date(option.proposedEndUtc), 'h:mm a')}
                  </div>
                </div>
                <CheckCircle2 size={14} style={{ color: '#ff6a00' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
