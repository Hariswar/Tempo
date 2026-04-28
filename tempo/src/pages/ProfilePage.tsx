import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserCircle2, Mail, Clock3, Save, Sparkles } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { updateAuthUserProfile } from '../services/authService'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, updateUserProfile, switchAuthUser } = useAppStore()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    displayName: user.displayName,
    timezone: user.timezone,
    workdayStart: user.workdayStart,
    workdayEnd: user.workdayEnd,
    quietStart: user.quietStart,
    quietEnd: user.quietEnd,
    travelBufferMinutes: user.travelBufferMinutes,
  })

  useEffect(() => {
    setForm({
      displayName: user.displayName,
      timezone: user.timezone,
      workdayStart: user.workdayStart,
      workdayEnd: user.workdayEnd,
      quietStart: user.quietStart,
      quietEnd: user.quietEnd,
      travelBufferMinutes: user.travelBufferMinutes,
    })
  }, [user])

  function handleSave() {
    setError('')
    updateUserProfile(form)

    const updatedAuth = updateAuthUserProfile(user.email, {
      name: form.displayName,
      timezone: form.timezone,
      workdayStart: form.workdayStart,
      workdayEnd: form.workdayEnd,
      quietStart: form.quietStart,
      quietEnd: form.quietEnd,
      travelBufferMinutes: form.travelBufferMinutes,
    })

    if (updatedAuth) {
      switchAuthUser(updatedAuth)
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
    } else {
      setError('Unable to update account profile.')
    }
  }

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Account Profile</h2>
          <p className="text-xs text-text-muted mt-0.5">Manage account details and scheduling defaults</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="px-5 py-3.5 flex items-center gap-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <UserCircle2 size={16} style={{ color: '#ff6a00' }} />
            <span className="text-sm font-semibold text-text-primary">Profile Details</span>
          </div>
          <div className="p-5 space-y-4">
            <label className="block">
              <span className="text-xs text-text-secondary">Display Name</span>
              <input
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                className="mt-1 w-full h-10 rounded-lg px-3 text-sm tempo-input"
              />
            </label>

            <label className="block">
              <span className="text-xs text-text-secondary">Email</span>
              <div className="mt-1 h-10 rounded-lg px-3 flex items-center gap-2" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>
                <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-sm text-text-primary">{user.email}</span>
              </div>
            </label>

            <label className="block">
              <span className="text-xs text-text-secondary">Timezone</span>
              <input
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                className="mt-1 w-full h-10 rounded-lg px-3 text-sm tempo-input"
              />
            </label>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="px-5 py-3.5 flex items-center gap-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <Clock3 size={16} style={{ color: '#ff6a00' }} />
            <span className="text-sm font-semibold text-text-primary">Scheduling Preferences</span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-text-secondary">Workday Start</span>
              <input
                type="time"
                value={form.workdayStart}
                onChange={(e) => setForm((f) => ({ ...f, workdayStart: e.target.value }))}
                className="mt-1 w-full h-10 rounded-lg px-3 text-sm tempo-input"
              />
            </label>
            <label className="block">
              <span className="text-xs text-text-secondary">Workday End</span>
              <input
                type="time"
                value={form.workdayEnd}
                onChange={(e) => setForm((f) => ({ ...f, workdayEnd: e.target.value }))}
                className="mt-1 w-full h-10 rounded-lg px-3 text-sm tempo-input"
              />
            </label>
            <label className="block">
              <span className="text-xs text-text-secondary">Quiet Start</span>
              <input
                type="time"
                value={form.quietStart}
                onChange={(e) => setForm((f) => ({ ...f, quietStart: e.target.value }))}
                className="mt-1 w-full h-10 rounded-lg px-3 text-sm tempo-input"
              />
            </label>
            <label className="block">
              <span className="text-xs text-text-secondary">Quiet End</span>
              <input
                type="time"
                value={form.quietEnd}
                onChange={(e) => setForm((f) => ({ ...f, quietEnd: e.target.value }))}
                className="mt-1 w-full h-10 rounded-lg px-3 text-sm tempo-input"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs text-text-secondary">Travel Buffer ({form.travelBufferMinutes} min)</span>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={form.travelBufferMinutes}
                onChange={(e) => setForm((f) => ({ ...f, travelBufferMinutes: Number(e.target.value) }))}
                className="mt-2 w-full"
              />
            </label>
          </div>
        </motion.div>

        {error && (
          <div className="text-xs px-3 py-2 rounded-lg" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <div className="flex justify-between items-center pb-4">
          <button
            onClick={() => navigate('/onboarding')}
            className="px-4 h-9 rounded-lg text-xs font-medium inline-flex items-center gap-2"
            style={{ background: 'rgba(255,106,0,0.14)', border: '1px solid rgba(255,106,0,0.3)', color: '#ffb347' }}
          >
            <Sparkles size={13} />
            Open Tutorial
          </button>
          <button
            onClick={handleSave}
            className="px-4 h-9 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-2"
            style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #ff6a00, #ff8a00)' }}
          >
            <Save size={13} />
            {saved ? 'Saved!' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  )
}
