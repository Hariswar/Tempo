import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Sparkles, Send, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { useAppStore } from '../../stores/appStore'
import type { AIMessage, ConflictResolution, RescheduleOption } from '../../types'
import { sendAIMessage } from '../../services/aiService'
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

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/\*\*(.*?)\*\*/g)
  return (
    <span>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i} className="font-semibold text-white">{part}</strong>
          : <span key={i}>{part}</span>
      )}
    </span>
  )
}

export default function AIAssistantPanel() {
  const { toggleAIPanel, aiMessages, addAIMessage, events, pendingConflict, acceptRescheduleOption, setPendingConflict } = useAppStore()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
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
      const response = await sendAIMessage(text, events, new Date())
      const assistantMsg: AIMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      }
      addAIMessage(assistantMsg)
    } catch (error) {
      const assistantMsg: AIMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content:
          error instanceof Error
            ? `Grok request failed: ${error.message}`
            : 'Grok request failed. Please check your Netlify function and API key.',
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
      className="fixed right-0 top-0 bottom-0 z-40 flex flex-col w-80 shadow-2xl"
      style={{ background: '#0c0c18', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <Sparkles size={13} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary leading-none">Tempo AI</div>
            <div className="text-[10px] text-text-muted leading-none mt-0.5">Agentic Scheduler</div>
          </div>
        </div>
        <button onClick={toggleAIPanel} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
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
              <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mr-2 mt-0.5" style={{ background: 'linear-gradient(135deg, #7c3aed40, #4f46e940)' }}>
                <Sparkles size={10} style={{ color: '#a78bfa' }} />
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
                      style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa' }}
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
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)' }}>
              <Sparkles size={10} style={{ color: '#a78bfa' }} />
            </div>
            <div className="ai-message-assistant px-3 py-2.5">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#a78bfa' }}
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
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          className="flex items-end gap-2 rounded-xl p-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
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
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
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
                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
              >
                <div>
                  <div className="text-[11px] font-medium text-text-primary">
                    {format(new Date(option.proposedStartUtc), 'EEE, MMM d')}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {format(new Date(option.proposedStartUtc), 'h:mm a')} – {format(new Date(option.proposedEndUtc), 'h:mm a')}
                  </div>
                </div>
                <CheckCircle2 size={14} style={{ color: '#7c3aed' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
