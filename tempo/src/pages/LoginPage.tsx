import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Mail, LogIn } from 'lucide-react'
import { loginUser } from '../services/authService'
import { useAppStore } from '../stores/appStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const switchAuthUser = useAppStore((s) => s.switchAuthUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const authUser = loginUser(email, password)
      switchAuthUser(authUser)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h1 className="text-lg font-bold text-text-primary">Log In</h1>
          <p className="text-xs text-text-muted mt-0.5">Access your Tempo workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
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
                placeholder="••••••••"
              />
            </div>
          </label>

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
            <LogIn size={14} />
            {loading ? 'Signing in...' : 'Log In'}
          </button>

          <p className="text-xs text-text-muted text-center pt-1">
            No account?{' '}
            <Link to="/signup" style={{ color: '#ffb347' }}>Sign up</Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}
