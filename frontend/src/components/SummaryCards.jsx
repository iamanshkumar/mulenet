import { useEffect, useRef } from 'react'
import { AlertCircle, TrendingUp, Users, Clock } from 'lucide-react'

function AnimatedNumber({ value, suffix = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof value !== 'number') return
    let start = 0
    const step = Math.max(value / 40, 1)
    const timer = setInterval(() => {
      start += step
      if (start >= value) { start = value; clearInterval(timer) }
      el.textContent = Math.floor(start).toLocaleString() + suffix
    }, 30)
    return () => clearInterval(timer)
  }, [value, suffix])

  if (typeof value !== 'number') return <span>{value}</span>
  return <span ref={ref}>0{suffix}</span>
}

export default function SummaryCards({ summary = {} }) {
  const stats = [
    { id: 'accounts', title: 'Accounts Analyzed', value: summary.total_accounts_analyzed || 0, icon: Users, color: '#58a6ff', glow: 'rgba(88,166,255,0.15)' },
    { id: 'suspicious', title: 'Suspicious Flagged', value: summary.suspicious_accounts_flagged || 0, icon: AlertCircle, color: '#e63946', glow: 'rgba(230,57,70,0.15)' },
    { id: 'rings', title: 'Fraud Rings Detected', value: summary.fraud_rings_detected || 0, icon: TrendingUp, color: '#f4a261', glow: 'rgba(244,162,97,0.15)' },
    { id: 'time', title: 'Processing Time', value: summary.processing_time_seconds, suffix: 's', icon: Clock, color: '#3fb950', glow: 'rgba(63,185,80,0.15)', isTime: true },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => {
        const Icon = s.icon
        return (
          <div key={s.id} className="stat-card animate-slideUp" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: s.glow, border: `1px solid ${s.color}30` }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                {s.title}
              </span>
            </div>
            <div className="text-3xl font-black mono" style={{ color: s.color }}>
              {s.isTime ? (
                <span>{s.value ? `${s.value}s` : '—'}</span>
              ) : (
                <AnimatedNumber value={s.value} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}