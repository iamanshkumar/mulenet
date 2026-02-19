import { useState, useEffect, useRef } from 'react'
import { Search, Tag, Link2, Bot, Loader, AlertCircle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const API = import.meta.env.VITE_API_URL

// Hardcoded lifecycle badge styles
const STAGE_STYLES = {
    'Stage 1': { icon: '🆕', bg: '#1e3a5f', color: '#93c5fd', border: '#3b82f6' },
    'Stage 2': { icon: '⚡', bg: '#450a0a', color: '#fca5a5', border: '#ef4444' },
    'Stage 3': { icon: '💰', bg: '#422006', color: '#fcd34d', border: '#f59e0b' },
    'Stage 4': { icon: '💤', bg: '#1f2937', color: '#9ca3af', border: '#6b7680' },
    'Unknown': { icon: '❓', bg: '#111827', color: '#6b7280', border: '#374151' },
}

function getStageStyle(stage) {
    if (!stage) return STAGE_STYLES['Unknown']
    const key = Object.keys(STAGE_STYLES).find(k => stage.startsWith(k))
    return STAGE_STYLES[key] || STAGE_STYLES['Unknown']
}

function RiskGauge({ score }) {
    const radius = 45, stroke = 8
    const circ = Math.PI * radius
    const offset = circ - (score / 100) * circ
    const color = score >= 80 ? '#e63946' : score >= 50 ? '#f4a261' : score >= 25 ? '#fbbf24' : '#3fb950'
    return (
        <div className="relative w-28 h-16 mx-auto">
            <svg viewBox="0 0 120 65" className="w-full h-full">
                <path d={`M 10 60 A ${radius} ${radius} 0 0 1 110 60`}
                    fill="none" stroke="#30363d" strokeWidth={stroke} strokeLinecap="round" />
                <path d={`M 10 60 A ${radius} ${radius} 0 0 1 110 60`}
                    fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
            </svg>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <span className="text-2xl font-black mono" style={{ color }}>{score}</span>
                <span className="text-xs" style={{ color: '#6b7280' }}>/100</span>
            </div>
        </div>
    )
}

export default function InvestigatorPanel({ account }) {
    const [narrative, setNarrative] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const panelRef = useRef(null)
    const { dark } = useTheme()

    useEffect(() => {
        if (!account) { setNarrative(''); setError(false); return }

        const fetchNarrative = async () => {
            setLoading(true)
            setNarrative('')
            setError(false)
            try {
                // Route through backend — avoids CORS issues with direct Groq calls
                const res = await fetch(`${API}/api/narrative`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        account_id: account.account_id,
                        suspicion_score: account.suspicion_score,
                        detected_patterns: account.detected_patterns,
                        ring_id: account.ring_id,
                        lifecycle_stage: account.lifecycle_stage || 'unknown',
                    }),
                })
                const data = await res.json()
                if (data.narrative) {
                    setNarrative(data.narrative)
                } else {
                    setError(true)
                }
            } catch (e) {
                console.error('Narrative fetch failed:', e)
                setError(true)
            }
            setLoading(false)
        }

        fetchNarrative()
    }, [account])

    if (!account) return (
        <div className="card-dark text-center py-12 animate-fadeIn" style={{ borderStyle: 'dashed' }}>
            <Search className="w-8 h-8 mx-auto mb-3" style={{ color: '#6b7280' }} />
            <p style={{ color: '#6b7280' }}>Click any node to investigate</p>
        </div>
    )

    const stageStyle = getStageStyle(account.lifecycle_stage)
    const narrativeColor = dark ? '#c9d1d9' : '#1f2937'
    const narrativeLabelColor = dark ? '#fbbf24' : '#b45309'
    const ringColor = dark ? '#60a5fa' : '#2563eb'
    const mutedColor = dark ? '#8b949e' : '#4a5568'

    return (
        <div ref={panelRef} className="card-dark space-y-4 animate-scaleIn" style={{ padding: '1.25rem' }}>
            <div className="flex items-center gap-2">
                <Search className="w-4 h-4" style={{ color: '#e63946' }} />
                <span className="mono font-bold" style={{ color: '#e63946', fontSize: '0.95rem' }}>
                    {account.account_id}
                </span>
            </div>

            <RiskGauge score={account.suspicion_score} />

            <div className="flex justify-center">
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '4px 12px', borderRadius: '9999px',
                    fontSize: '12px', fontWeight: 600,
                    backgroundColor: stageStyle.bg, color: stageStyle.color,
                    border: `1px solid ${stageStyle.border}`,
                }}>
                    <span>{stageStyle.icon}</span>
                    {account.lifecycle_stage || 'Unknown'}
                </span>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid var(--color-panel-border)' }}>
                    <span className="flex items-center gap-1.5" style={{ color: mutedColor }}>
                        <Link2 className="w-3.5 h-3.5" /> Ring
                    </span>
                    <span className="mono text-xs" style={{ color: ringColor }}>{account.ring_id}</span>
                </div>
            </div>

            <div>
                <div className="flex items-center gap-1.5 mb-2">
                    <Tag className="w-3.5 h-3.5" style={{ color: mutedColor }} />
                    <span className="text-xs font-medium" style={{ color: mutedColor }}>Detected Patterns</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {account.detected_patterns?.map(p => (
                        <span key={p} className="mono text-[10px] px-2 py-0.5" style={{
                            display: 'inline-flex', borderRadius: '9999px',
                            background: dark ? 'rgba(230,57,70,0.15)' : '#e5e7eb',
                            color: dark ? '#e63946' : '#111827',
                            border: dark ? '1px solid rgba(230,57,70,0.3)' : '1px solid #9ca3af',
                            fontWeight: 600,
                        }}>{p}</span>
                    ))}
                </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-panel-border)', paddingTop: '0.75rem' }}>
                <div className="flex items-center gap-1.5 mb-2">
                    <Bot className="w-3.5 h-3.5" style={{ color: narrativeLabelColor }} />
                    <span className="text-xs font-bold" style={{ color: narrativeLabelColor }}>AI Investigator Narrative</span>
                </div>
                {loading ? (
                    <div className="flex items-center gap-2 py-3">
                        <Loader className="w-4 h-4 animate-spin" style={{ color: '#fbbf24' }} />
                        <span className="text-xs" style={{ color: mutedColor }}>Generating case narrative...</span>
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-2 py-2">
                        <AlertCircle className="w-4 h-4" style={{ color: '#e63946' }} />
                        <span className="text-xs" style={{ color: '#e63946' }}>Narrative generation failed. Check API connection.</span>
                    </div>
                ) : (
                    <p className="text-xs leading-relaxed" style={{ color: narrativeColor }}>
                        {narrative}
                    </p>
                )}
            </div>
        </div>
    )
}
