import { useNavigate } from 'react-router-dom'
import { useAnalysis } from '../context/AnalysisContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, CartesianGrid } from 'recharts'
import { BarChart3 } from 'lucide-react'

const COLORS = ['#e63946', '#58a6ff', '#3fb950', '#f4a261', '#bc8cff']

// Fix 2: Hardcoded dark tooltip — works in both themes
const darkTooltipStyle = {
    contentStyle: { backgroundColor: '#000000', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px' },
    labelStyle: { color: '#ffffff', fontWeight: 700, fontSize: '13px' },
    itemStyle: { color: '#ffffff', fontSize: '12px' },
}

function CustomPieTooltip({ active, payload }) {
    if (!active || !payload?.length) return null
    const { name, value } = payload[0]
    const total = payload[0]?.payload?.total || 1
    const pct = ((value / total) * 100).toFixed(1)
    return (
        <div style={{ backgroundColor: '#000000', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px' }}>
            <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '13px', margin: 0 }}>{name}</p>
            <p style={{ color: '#ffffff', fontSize: '12px', margin: '2px 0 0' }}>Count: {value}</p>
            <p style={{ color: '#9ca3af', fontSize: '11px', margin: '2px 0 0' }}>{pct}% of total</p>
        </div>
    )
}

export default function AnalyticsPage() {
    const { result } = useAnalysis()
    const navigate = useNavigate()

    if (!result) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fadeIn">
            <p className="text-lg mb-4 text-muted">No analysis loaded</p>
            <button onClick={() => navigate('/analyze')} className="btn-accent">Upload CSV</button>
        </div>
    )

    const accounts = result.suspicious_accounts || []
    const rings = result.fraud_rings || []

    // Lifecycle donut — add total for % calculation
    const stages = {}
    accounts.forEach(a => {
        const s = a.lifecycle_stage || 'Unknown'
        stages[s] = (stages[s] || 0) + 1
    })
    const totalAccounts = accounts.length || 1
    const lifecycleData = Object.entries(stages).map(([name, value]) => ({
        name: name.replace(/^Stage \d: /, ''), value, total: totalAccounts,
    }))

    // Score distribution
    const buckets = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]
    const scoreHist = buckets.map(b => ({
        range: `${b}-${b + 10}`,
        count: accounts.filter(a => a.suspicion_score >= b && a.suspicion_score < b + 10).length,
    }))

    // Pattern frequency
    const patternCount = {}
    accounts.forEach(a => a.detected_patterns?.forEach(p => { patternCount[p] = (patternCount[p] || 0) + 1 }))
    const patternData = Object.entries(patternCount)
        .sort(([, a], [, b]) => b - a).slice(0, 10)
        .map(([name, count]) => ({ name, count }))

    // Ring scatter
    const ringScatter = rings.map(r => ({ size: r.member_accounts?.length || 0, risk: r.risk_score, id: r.ring_id }))

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6 animate-fadeIn">
            <h1 className="text-2xl font-bold text-primary">
                <BarChart3 className="w-6 h-6 inline mr-2" style={{ color: '#58a6ff' }} />
                Analytics
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Score Distribution */}
                <div className="card-dark">
                    <h3 className="text-sm font-bold mb-4 text-primary">Suspicion Score Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={scoreHist}>
                            <XAxis dataKey="range" tick={{ fill: '#8b949e', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#8b949e', fontSize: 10 }} />
                            <Tooltip {...darkTooltipStyle} />
                            <Bar dataKey="count" fill="#e63946" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Lifecycle Donut */}
                <div className="card-dark">
                    <h3 className="text-sm font-bold mb-4 text-primary">Lifecycle Stages</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={lifecycleData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                                paddingAngle={3} dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                                labelLine={{ stroke: '#6e7681' }}>
                                {lifecycleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Pattern Frequency */}
                <div className="card-dark">
                    <h3 className="text-sm font-bold mb-4 text-primary">Top Detected Patterns</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={patternData} layout="vertical">
                            <XAxis type="number" tick={{ fill: '#8b949e', fontSize: 10 }} />
                            <YAxis dataKey="name" type="category" tick={{ fill: '#8b949e', fontSize: 9 }} width={120} />
                            <Tooltip {...darkTooltipStyle} />
                            <Bar dataKey="count" fill="#58a6ff" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Ring Scatter */}
                <div className="card-dark">
                    <h3 className="text-sm font-bold mb-4 text-primary">Ring Size vs Risk Score</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                            <XAxis dataKey="size" name="Members" tick={{ fill: '#8b949e', fontSize: 10 }}
                                label={{ value: 'Ring Size', position: 'bottom', fill: '#6e7681', fontSize: 11 }} />
                            <YAxis dataKey="risk" name="Risk" tick={{ fill: '#8b949e', fontSize: 10 }}
                                label={{ value: 'Risk Score', angle: -90, position: 'left', fill: '#6e7681', fontSize: 11 }} />
                            <Tooltip {...darkTooltipStyle} />
                            <Scatter data={ringScatter} fill="#f4a261" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
