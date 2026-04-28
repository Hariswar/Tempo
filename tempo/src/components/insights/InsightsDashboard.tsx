import { motion } from 'framer-motion'
import {
  TrendingUp, Flame, Brain, CheckCircle2,
  AlertTriangle, BarChart2, Calendar
} from 'lucide-react'
import { MOCK_INSIGHTS } from '../../data/mockData'
import { CATEGORY_LABELS, CATEGORY_ICONS, getCategoryColor } from '../../lib/utils'
import { useAppStore } from '../../stores/appStore'
import type { EventCategory } from '../../types'

function StatCard({ label, value, sub, icon: Icon, color, delay = 0 }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">{label}</span>
        <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={13} style={{ color }} />
        </div>
      </div>
      <div>
        <span className="text-2xl font-bold text-text-primary">{value}</span>
        {sub && <span className="text-xs text-text-muted ml-2">{sub}</span>}
      </div>
    </motion.div>
  )
}

function HabitHeatmap() {
  const data = MOCK_INSIGHTS.weeklyHeatmap
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const maxVal = Math.max(...data.flat())

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        <div className="flex flex-col justify-around pr-2" style={{ width: 28 }}>
          {Array.from({ length: 5 }, (_, i) => i * 5 + 7).map((h) => (
            <span key={h} className="text-[9px] text-text-muted font-mono">{h}h</span>
          ))}
        </div>
        {data.map((dayData, di) => (
          <div key={di} className="flex flex-col gap-0.5">
            <span className="text-[9px] text-text-muted text-center mb-0.5">{days[di]}</span>
            {dayData.slice(7, 23).map((val, hi) => {
              const intensity = maxVal > 0 ? val / maxVal : 0
              return (
                <div
                  key={hi}
                  title={`${days[di]} ${hi + 7}:00 — ${val} events`}
                  className="rounded-sm"
                  style={{
                    width: 16,
                    height: 10,
                    background: intensity > 0
                      ? `rgba(255,106,0,${0.15 + intensity * 0.85})`
                      : 'rgba(255,255,255,0.04)',
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductivityChart({ data }: { data: { date: string; score: number }[] }) {
  const max = Math.max(...data.map((d) => d.score))
  const min = Math.min(...data.map((d) => d.score))
  const range = max - min || 1

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((d.score - min) / range) * 80 - 10,
    ...d,
  }))

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  const areaD = `${pathD} L ${points[points.length - 1].x} 100 L 0 100 Z`

  return (
    <div className="relative">
      <svg viewBox="0 0 100 100" className="w-full" style={{ height: 120 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6a00" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ff6a00" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#chartGrad)" />
        <path d={pathD} fill="none" stroke="#ff6a00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.2" fill="#ff6a00" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {[data[0], data[6], data[13]].map((d, i) => (
          <span key={i} className="text-[10px] text-text-muted">{d?.date}</span>
        ))}
      </div>
    </div>
  )
}

function CategoryBar({ category, count, completionRate, delay }: {
  category: EventCategory; count: number; completionRate: number; delay: number
}) {
  const color = getCategoryColor(category)
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3"
    >
      <span className="text-sm w-5 text-center">{CATEGORY_ICONS[category]}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-text-secondary">{CATEGORY_LABELS[category]}</span>
          <span className="text-[10px] text-text-muted">{count} events · {Math.round(completionRate * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate * 100}%` }}
            transition={{ delay: delay + 0.2, duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: color }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export default function InsightsDashboard() {
  useAppStore()
  const insights = MOCK_INSIGHTS

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-text-primary">Productivity Insights</h2>
        <p className="text-xs text-text-muted mt-0.5">Based on your last 14 days of activity</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Completion Rate" value={`${Math.round(insights.completionRate * 100)}%`} icon={CheckCircle2} color="#10b981" delay={0.05} />
        <StatCard label="Streak" value={`${insights.streakDays}d`} sub="in a row" icon={Flame} color="#f59e0b" delay={0.1} />
        <StatCard label="Events This Week" value={insights.totalEventsThisWeek} sub={`${insights.completedEvents} done`} icon={Calendar} color="#ff6a00" delay={0.15} />
        <StatCard label="Procrastination" value={`${insights.procrastinationScore}`} sub="/ 100" icon={AlertTriangle} color={insights.procrastinationScore < 40 ? '#10b981' : '#ef4444'} delay={0.2} />
      </div>

      {/* Productivity trend */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl p-4"
        style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} style={{ color: '#ff6a00' }} />
            <span className="text-sm font-semibold text-text-primary">Productivity Trend</span>
          </div>
          <span className="text-[10px] text-text-muted">Last 14 days</span>
        </div>
        <ProductivityChart data={insights.productivityTrend} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-4"
          style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Brain size={14} style={{ color: '#ff7a00' }} />
            <span className="text-sm font-semibold text-text-primary">Activity Heatmap</span>
          </div>
          <HabitHeatmap />
          <div className="flex items-center justify-end gap-2 mt-2">
            <span className="text-[10px] text-text-muted">Less</span>
            {[0.1, 0.3, 0.55, 0.8, 1].map((o, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: `rgba(255,106,0,${o})` }} />
            ))}
            <span className="text-[10px] text-text-muted">More</span>
          </div>
        </motion.div>

        {/* Category breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-4"
          style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={14} style={{ color: '#3b82f6' }} />
            <span className="text-sm font-semibold text-text-primary">Category Breakdown</span>
          </div>
          <div className="space-y-3">
            {insights.categoryBreakdown.map((item, i) => (
              <CategoryBar
                key={item.category}
                category={item.category}
                count={item.count}
                completionRate={item.completionRate}
                delay={0.4 + i * 0.05}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* AI insight summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl p-4"
        style={{ background: 'linear-gradient(135deg, rgba(255,106,0,0.1), rgba(255,138,0,0.05))', border: '1px solid rgba(255,106,0,0.2)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff6a00, #ff8a00)' }}>
            <Brain size={12} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-text-primary">AI Summary</span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          Your focus blocks have the highest completion rate (90%) this week. You're most productive between{' '}
          <strong className="text-text-primary">9–11 AM</strong>. Consider scheduling deep work in this window.
          Your exercise consistency has improved by <strong className="text-text-primary">+15%</strong> vs last month.
          3 meetings were rescheduled due to conflicts — AI detection helped recover{' '}
          <strong className="text-text-primary">4.5 hours</strong> of lost productivity time.
        </p>
      </motion.div>
    </div>
  )
}
