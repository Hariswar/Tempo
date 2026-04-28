import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Clock, Bell, Shield, Save } from 'lucide-react'
import { useAppStore } from '../stores/appStore'

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Kolkata', 'UTC'
]

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Icon size={14} style={{ color: '#ff6a00' }} />
        <span className="text-sm font-semibold text-text-primary">{title}</span>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </motion.div>
  )
}

function FieldRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-xs font-medium text-text-primary">{label}</div>
        {description && <div className="text-[11px] text-text-muted mt-0.5">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-10 h-5 rounded-full relative transition-colors"
      style={{ background: checked ? '#ff6a00' : 'rgba(255,255,255,0.1)' }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm"
        style={{ left: checked ? 22 : 2 }}
      />
    </button>
  )
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2.5 py-1.5 rounded-lg text-xs text-text-primary outline-none"
      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
    />
  )
}

export default function SettingsPage() {
  const { user } = useAppStore()
  const [form, setForm] = useState({
    displayName: user.displayName,
    email: user.email,
    timezone: user.timezone,
    workdayStart: user.workdayStart,
    workdayEnd: user.workdayEnd,
    quietStart: user.quietStart,
    quietEnd: user.quietEnd,
    travelBuffer: user.travelBufferMinutes,
    notifications: true,
    aiSuggestions: true,
    conflictAlerts: true,
    weeklyInsights: true,
    darkMode: true,
  })
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Settings</h2>
          <p className="text-xs text-text-muted mt-0.5">Customize your Tempo experience</p>
        </div>

        {/* Profile */}
        <Section title="Profile" icon={User}>
          <FieldRow label="Display Name">
            <input
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              className="px-3 py-1.5 rounded-lg text-xs text-text-primary outline-none w-40"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </FieldRow>
          <FieldRow label="Email" description="Used for account identification">
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="px-3 py-1.5 rounded-lg text-xs text-text-primary outline-none w-48"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </FieldRow>
          <FieldRow label="Timezone">
            <select
              value={form.timezone}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              className="px-3 py-1.5 rounded-lg text-xs text-text-primary outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </FieldRow>
        </Section>

        {/* Schedule */}
        <Section title="Schedule Preferences" icon={Clock}>
          <FieldRow label="Workday Start" description="Earliest time for scheduling">
            <TimeInput value={form.workdayStart} onChange={(v) => setForm((f) => ({ ...f, workdayStart: v }))} />
          </FieldRow>
          <FieldRow label="Workday End" description="Latest time for scheduling">
            <TimeInput value={form.workdayEnd} onChange={(v) => setForm((f) => ({ ...f, workdayEnd: v }))} />
          </FieldRow>
          <FieldRow label="Quiet Hours Start" description="No reminders after this time">
            <TimeInput value={form.quietStart} onChange={(v) => setForm((f) => ({ ...f, quietStart: v }))} />
          </FieldRow>
          <FieldRow label="Quiet Hours End" description="Resume reminders after this time">
            <TimeInput value={form.quietEnd} onChange={(v) => setForm((f) => ({ ...f, quietEnd: v }))} />
          </FieldRow>
          <FieldRow label="Default Travel Buffer" description="Minutes added between events for travel">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={form.travelBuffer}
                onChange={(e) => setForm((f) => ({ ...f, travelBuffer: Number(e.target.value) }))}
                className="w-24"
              />
              <span className="text-xs text-text-secondary w-12">{form.travelBuffer} min</span>
            </div>
          </FieldRow>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" icon={Bell}>
          <FieldRow label="Smart Reminders" description="Context-aware notification timing">
            <Toggle checked={form.notifications} onChange={(v) => setForm((f) => ({ ...f, notifications: v }))} />
          </FieldRow>
          <FieldRow label="AI Suggestions" description="Proactive scheduling recommendations">
            <Toggle checked={form.aiSuggestions} onChange={(v) => setForm((f) => ({ ...f, aiSuggestions: v }))} />
          </FieldRow>
          <FieldRow label="Conflict Alerts" description="Notify when schedule conflicts detected">
            <Toggle checked={form.conflictAlerts} onChange={(v) => setForm((f) => ({ ...f, conflictAlerts: v }))} />
          </FieldRow>
          <FieldRow label="Weekly Insights" description="Monday morning productivity summary">
            <Toggle checked={form.weeklyInsights} onChange={(v) => setForm((f) => ({ ...f, weeklyInsights: v }))} />
          </FieldRow>
        </Section>

        {/* Auth placeholder */}
        <Section title="Security & Auth" icon={Shield}>
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <div className="text-xs font-medium text-text-primary">Auth0 Integration</div>
              <div className="text-[11px] text-text-muted mt-0.5">OAuth 2.0 authentication — coming soon</div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
              Phase 2
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <div className="text-xs font-medium text-text-primary">Location Encryption</div>
              <div className="text-[11px] text-text-muted mt-0.5">End-to-end encryption for location data</div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
              Phase 2
            </span>
          </div>
        </Section>

        {/* Save */}
        <div className="flex justify-end pb-5">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #ff6a00, #ff8a00)' }}
          >
            <Save size={14} />
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
