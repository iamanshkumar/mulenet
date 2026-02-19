import { useNavigate } from 'react-router-dom'
import { useAnalysis } from '../context/AnalysisContext'
import { AlertTriangle, Star, Users } from 'lucide-react'

export default function FraudRingsPage() {
    const { result } = useAnalysis()
    const navigate = useNavigate()

    if (!result) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fadeIn">
            <p className="text-lg mb-4" style={{ color: 'var(--color-text-muted)' }}>No analysis loaded</p>
            <button onClick={() => navigate('/analyze')} className="btn-accent">Upload CSV</button>
        </div>
    )

    const rings = result.fraud_rings || []
    const suspiciousMap = {}
        ; (result.suspicious_accounts || []).forEach(a => { suspiciousMap[a.account_id] = a })

    // Find super nodes (accounts in multiple rings)
    const ringCount = {}
    rings.forEach(r => r.member_accounts?.forEach(m => { ringCount[m] = (ringCount[m] || 0) + 1 }))
    const superNodes = Object.entries(ringCount).filter(([, c]) => c > 1).map(([id]) => id)

    const riskColor = (score) => score >= 80 ? '#e63946' : score >= 50 ? '#f4a261' : '#fbbf24'
    const riskBg = (score) => score >= 80 ? 'rgba(230,57,70,0.1)' : score >= 50 ? 'rgba(244,162,97,0.1)' : 'rgba(251,191,36,0.1)'

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        Detected Fraud Rings
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {rings.length} rings detected · {superNodes.length} super nodes
                    </p>
                </div>
            </div>

            {rings.length === 0 ? (
                <div className="card-dark text-center py-16">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>No fraud rings detected</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rings.map((ring, i) => (
                        <div key={ring.ring_id} className="card-glow animate-slideUp"
                            style={{ animationDelay: `${i * 0.05}s`, borderLeft: `3px solid ${riskColor(ring.risk_score)}` }}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="mono font-bold text-sm" style={{ color: riskColor(ring.risk_score) }}>
                                    {ring.ring_id}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full"
                                    style={{ background: riskBg(ring.risk_score), color: riskColor(ring.risk_score) }}>
                                    Risk: {ring.risk_score}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="badge-blue text-[10px]">{ring.pattern_type}</span>
                                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                    <Users className="w-3 h-3 inline mr-1" />
                                    {ring.member_accounts?.length || 0} members
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {ring.member_accounts?.map(m => (
                                    <span key={m} className="text-[10px] mono px-1.5 py-0.5 rounded"
                                        style={{
                                            background: superNodes.includes(m) ? 'rgba(251,191,36,0.2)' : 'var(--color-panel-light)',
                                            color: superNodes.includes(m) ? 'var(--color-gold)' : 'var(--color-text-secondary)',
                                            border: superNodes.includes(m) ? '1px solid rgba(251,191,36,0.4)' : '1px solid var(--color-panel-border)',
                                        }}>
                                        {superNodes.includes(m) && <Star className="w-2.5 h-2.5 inline mr-0.5" />}
                                        {m}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
