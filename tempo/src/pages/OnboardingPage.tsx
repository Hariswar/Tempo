import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarPlus, Brain, Bell, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '../stores/appStore'

const STEPS = [
  {
    icon: CalendarPlus,
    title: 'Add Your First Event',
    body: 'Create an event in calendar view and assign a category and flexibility level.',
    action: 'Create event',
    go: '/?onboarding=create-event',
  },
  {
    icon: Brain,
    title: 'Try AI Scheduling',
    body: 'Open the AI assistant to ask for free slots, schedule changes, and conflict help.',
    action: 'Open AI',
    go: '/?onboarding=open-ai',
  },
  {
    icon: Bell,
    title: 'Use Smart Notifications',
    body: 'Tap notifications to jump directly to insights, reminders, and conflict resolution.',
    action: 'View notifications',
    go: '/notifications',
  },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const firstName = useMemo(() => user.displayName.split(' ')[0] || user.displayName, [user.displayName])

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Welcome, {firstName}</h2>
          <p className="text-xs text-text-muted mt-0.5">Quick tutorial to set up your workflow</p>
        </div>

        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl p-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,106,0,0.14)' }}>
                    <Icon size={15} style={{ color: '#ff6a00' }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-text-primary">{step.title}</div>
                    <p className="text-xs text-text-muted mt-1">{step.body}</p>
                  </div>
                  <button
                    onClick={() => navigate(step.go)}
                    className="px-3 h-8 rounded-lg text-xs font-medium shrink-0"
                    style={{ background: 'rgba(255,106,0,0.14)', border: '1px solid rgba(255,106,0,0.3)', color: '#ffb347' }}
                  >
                    {step.action}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div
          className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(255,106,0,0.12), rgba(255,138,0,0.06))', border: '1px solid rgba(255,106,0,0.25)' }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} style={{ color: '#ff6a00' }} />
            <span className="text-sm font-semibold text-text-primary">You’re ready to use Tempo</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 h-9 rounded-lg text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #ff6a00, #ff8a00)' }}
          >
            Go to Calendar
          </button>
        </div>
      </div>
    </div>
  )
}
