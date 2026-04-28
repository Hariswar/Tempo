import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, UserPlus } from 'lucide-react'

export default function AuthPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h1 className="text-lg font-bold text-text-primary">Welcome to Tempo</h1>
          <p className="text-xs text-text-muted mt-0.5">Choose how you want to continue</p>
        </div>

        <div className="p-5 space-y-3">
          <Link
            to="/login"
            className="w-full h-11 rounded-lg text-sm font-semibold text-white inline-flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #ff6a00, #ff8a00)' }}
          >
            <LogIn size={15} />
            Log In
          </Link>

          <Link
            to="/signup"
            className="w-full h-11 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <UserPlus size={15} />
            Create Account
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
