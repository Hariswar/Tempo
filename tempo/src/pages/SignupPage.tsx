import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, UserPlus } from 'lucide-react'
import { signupUser } from '../services/authService'
import { useAppStore } from '../stores/appStore'

export default function SignupPage() {
  const navigate = useNavigate()
  const switchAuthUser = useAppStore((s) => s.switchAuthUser)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [workdayStart, setWorkdayStart] = useState('08:00')
  const [workdayEnd, setWorkdayEnd] = useState('22:00')
  const [quietStart, setQuietStart] = useState('23:00')
  const [quietEnd, setQuietEnd] = useState('07:00')
  const [travelBufferMinutes, setTravelBufferMinutes] = useState(30)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const authUser = signupUser(name, email, password, {
        timezone,
        workdayStart,
        workdayEnd,
        quietStart,
        quietEnd,
        travelBufferMinutes,
      })
      switchAuthUser(authUser)
      navigate('/onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="h-[100dvh] overflow-y-auto"
      style={{ background: 'var(--bg-base)', WebkitOverflowScrolling: 'touch' }}
    >
      <div className="min-h-full flex items-start sm:items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl overflow-hidden my-3 sm:my-0"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h1 className="text-lg font-bold text-text-primary">Sign Up</h1>
          <p className="text-xs text-text-muted mt-0.5">Create your Tempo account</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <label className="block">
            <span className="text-xs text-text-secondary">Name</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg px-3 h-10" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>
              <User size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-transparent outline-none text-sm text-text-primary w-full"
                placeholder="Your name"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs text-text-secondary">Email</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg px-3 h-10" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>
              <Mail size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-transparent outline-none text-sm text-text-primary w-full"
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs text-text-secondary">Password</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg px-3 h-10" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>
              <Lock size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-transparent outline-none text-sm text-text-primary w-full"
                placeholder="At least 6 characters"
              />
            </div>
          </label>

          <div className="rounded-xl p-3 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
            <div className="text-xs font-semibold text-text-primary">Scheduling Preferences</div>
            <label className="block">
              <span className="text-[11px] text-text-secondary">Timezone</span>
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1 w-full h-9 rounded-lg px-3 text-xs tempo-input"
              />
            </label>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}
            >
              <label className="block min-w-0">
                <span className="text-[11px] text-text-secondary">Work Start</span>
                <input
                  type="time"
                  value={workdayStart}
                  onChange={(e) => setWorkdayStart(e.target.value)}
                  className="mt-1 w-full min-w-0 h-8 sm:h-9 rounded-lg px-2 sm:px-3 text-[11px] sm:text-xs tempo-input"
                />
              </label>
              <label className="block min-w-0">
                <span className="text-[11px] text-text-secondary">Work End</span>
                <input
                  type="time"
                  value={workdayEnd}
                  onChange={(e) => setWorkdayEnd(e.target.value)}
                  className="mt-1 w-full min-w-0 h-8 sm:h-9 rounded-lg px-2 sm:px-3 text-[11px] sm:text-xs tempo-input"
                />
              </label>
              <label className="block min-w-0">
                <span className="text-[11px] text-text-secondary">Quiet Start</span>
                <input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="mt-1 w-full min-w-0 h-8 sm:h-9 rounded-lg px-2 sm:px-3 text-[11px] sm:text-xs tempo-input"
                />
              </label>
              <label className="block min-w-0">
                <span className="text-[11px] text-text-secondary">Quiet End</span>
                <input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="mt-1 w-full min-w-0 h-8 sm:h-9 rounded-lg px-2 sm:px-3 text-[11px] sm:text-xs tempo-input"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-[11px] text-text-secondary">Travel Buffer ({travelBufferMinutes} min)</span>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={travelBufferMinutes}
                onChange={(e) => setTravelBufferMinutes(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
          </div>

          <div className="text-[11px] px-3 py-2 rounded-lg" style={{ background: 'rgba(255,106,0,0.08)', border: '1px solid rgba(255,106,0,0.2)', color: '#ffb347' }}>
            After sign up, you will be guided through a quick tutorial for adding events, AI scheduling, and notifications.
          </div>

          {error && (
            <div className="text-xs px-3 py-2 rounded-lg" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #ff6a00, #ff8a00)' }}
          >
            <UserPlus size={14} />
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          <p className="text-xs text-text-muted text-center pt-1">
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#ffb347' }}>Log in</Link>
          </p>
          <p className="text-xs text-text-muted text-center">
            <Link to="/auth" style={{ color: 'var(--text-secondary)' }}>Back</Link>
          </p>
        </form>
        </motion.div>
      </div>
    </div>
  )
}
