import { useNavigate } from 'react-router-dom'
import { Network, BarChart3, Brain, Shield, Upload, Zap, GitBranch, Target, Layers } from 'lucide-react'

const stepColors = ['#e63946', '#f4a261', '#ffd166', '#3fb950', '#60a5fa']

const steps = [
    { icon: Upload, title: 'Upload CSV', desc: 'Transaction data with sender_id, receiver_id, amount, timestamp' },
    { icon: Network, title: 'Build Graph', desc: 'NetworkX directed graph — accounts as nodes, transactions as edges' },
    { icon: Target, title: 'Run Detectors', desc: 'Cycle detection, smurfing, shell accounts, Benford\'s Law analysis' },
    { icon: Layers, title: 'Score & Rank', desc: 'Multi-signal fusion scoring with whitelist exclusion (merchants, payroll)' },
    { icon: Shield, title: 'Investigate', desc: 'Interactive graph, risk gauges, AI-generated SAR narratives' },
]

const algorithms = [
    {
        icon: GitBranch, title: "Johnson's Cycle Detection", color: '#e63946',
        desc: 'Finds all simple cycles up to length 5 — money flowing A→B→C→A is a classic mule ring pattern.', complexity: 'O((V+E)(C+1))'
    },
    {
        icon: BarChart3, title: "Benford's Law Analysis", color: '#58a6ff',
        desc: 'Leading digit distribution should follow Benford\'s distribution. Violations suggest manufactured transactions.', complexity: 'Chi-square, p<0.05'
    },
    {
        icon: Brain, title: 'AI Narrative Generation', color: '#3fb950',
        desc: 'Gemini generates investigation-ready SAR narratives for each suspicious account with recommended actions.', complexity: 'LLM — Gemini 2.0'
    },
]

const comparison = [
    { feature: 'Graph-based ring detection', mulenet: true, mulehunter: false, traditional: false },
    { feature: 'Cycle forensics', mulenet: true, mulehunter: false, traditional: false },
    { feature: "Benford's Law analysis", mulenet: true, mulehunter: false, traditional: true },
    { feature: 'AI-generated narratives', mulenet: true, mulehunter: false, traditional: false },
    { feature: 'Shell account detection', mulenet: true, mulehunter: false, traditional: true },
    { feature: 'False positive control', mulenet: true, mulehunter: true, traditional: false },
    { feature: 'Interactive investigation', mulenet: true, mulehunter: false, traditional: false },
    { feature: '10K txns in <30s', mulenet: true, mulehunter: true, traditional: false },
]

export default function HowItWorksPage() {
    const navigate = useNavigate()

    const downloadSample = () => {
        const csv = `transaction_id,sender_id,receiver_id,amount,timestamp
T01,ACC_A,ACC_B,50000,2024-01-01 00:00:00
T02,ACC_B,ACC_C,47500,2024-01-01 02:00:00
T03,ACC_C,ACC_A,45000,2024-01-01 04:00:00
T04,CUST_001,MERCHANT,2500,2024-01-01 06:00:00
T05,CUST_002,MERCHANT,3200,2024-01-01 08:00:00`
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
            download: 'sample_transactions.csv'
        })
        a.click()
    }

    return (
        <div className="max-w-[1000px] mx-auto px-6 py-8 space-y-12 animate-fadeIn">
            <div className="text-center">
                <h1 className="text-3xl font-black mb-2 text-primary">How MuleNet Works</h1>
                <p className="text-secondary">From CSV upload to fraud ring investigation in 5 steps</p>
            </div>

            {/* Pipeline Steps — no arrows, colored left border */}
            <div className="space-y-4">
                {steps.map((step, i) => (
                    <div key={i} className="card-dark flex items-start gap-4 animate-slideUp"
                        style={{ animationDelay: `${i * 0.1}s`, borderLeft: `4px solid ${stepColors[i]}`, paddingLeft: '1.75rem' }}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${stepColors[i]}15`, border: `1px solid ${stepColors[i]}30` }}>
                            <step.icon className="w-6 h-6" style={{ color: stepColors[i] }} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold mono px-2 py-0.5 rounded"
                                    style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
                                    Step {i + 1}
                                </span>
                                <h3 className="font-bold text-primary">{step.title}</h3>
                            </div>
                            <p className="text-sm mt-1 text-secondary">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Algorithm Cards */}
            <div>
                <h2 className="text-xl font-bold mb-4 text-primary">
                    <Zap className="w-5 h-5 inline mr-2" style={{ color: 'var(--color-gold)' }} />
                    Core Algorithms
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                    {algorithms.map((alg, i) => (
                        <div key={i} className="card-glow">
                            <alg.icon className="w-8 h-8 mb-3" style={{ color: alg.color }} />
                            <h3 className="font-bold text-sm mb-2 text-primary">{alg.title}</h3>
                            <p className="text-xs leading-relaxed mb-3 text-secondary">{alg.desc}</p>
                            <span className="badge-blue mono text-[10px]">{alg.complexity}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Comparison Table */}
            <div>
                <h2 className="text-xl font-bold mb-4 text-primary">Comparison</h2>
                <div className="card-dark" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="table-dark">
                        <thead>
                            <tr>
                                <th>Feature</th>
                                <th className="text-center">MuleNet</th>
                                <th className="text-center">MuleHunter.AI</th>
                                <th className="text-center">Traditional</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparison.map((row, i) => (
                                <tr key={i}>
                                    <td className="text-sm">{row.feature}</td>
                                    <td className="text-center">{row.mulenet ? '✅' : '❌'}</td>
                                    <td className="text-center">{row.mulehunter ? '✅' : '❌'}</td>
                                    <td className="text-center">{row.traditional ? '✅' : '❌'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CTA */}
            <div className="text-center space-y-4">
                <button onClick={() => navigate('/analyze')} className="btn-accent text-lg px-10 py-4 rounded-xl">
                    Try It Now
                </button>
                <div>
                    <button onClick={downloadSample} className="btn-ghost text-sm">Download Sample CSV</button>
                </div>
            </div>
        </div>
    )
}
