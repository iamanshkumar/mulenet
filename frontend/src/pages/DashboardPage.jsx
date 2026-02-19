import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { useAnalysis } from '../context/AnalysisContext'
import SummaryCards from '../components/SummaryCards'
import GraphPanel from '../components/GraphPanel'
import TimelineBar from '../components/TimelineBar'
import InvestigatorPanel from '../components/InvestigatorPanel'
import DownloadButton from '../components/DownloadButton'
import { Clock } from 'lucide-react'

export default function DashboardPage() {
    const { result, rawTxns, selectedNode, setSelectedNode, loadAnalysis } = useAnalysis()
    const navigate = useNavigate()
    const location = useLocation()
    const [fromHistory, setFromHistory] = useState(false)
    const cyRef = useRef(null)

    useEffect(() => {
        if (location.state?.result && location.state?.fromHistory) {
            loadAnalysis(location.state.result, [])
            setFromHistory(true)
        }
    }, [location.state])

    const handleCyReady = (cy) => {
        cyRef.current = cy
    }

    if (!result) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fadeIn">
            <p className="text-lg mb-4 text-muted">No analysis loaded</p>
            <button onClick={() => navigate('/analyze')} className="btn-accent">Upload CSV</button>
        </div>
    )

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5 animate-fadeIn">
            {fromHistory && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg animate-slideDown"
                    style={{ background: 'rgba(88,166,255,0.1)', border: '1px solid rgba(88,166,255,0.3)' }}>
                    <Clock className="w-4 h-4" style={{ color: 'var(--color-blue)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-blue)' }}>
                        Loaded from History — graph reconstructed from analysis results
                    </span>
                    <button onClick={() => { setFromHistory(false); navigate('/analyze') }}
                        className="ml-auto btn-ghost text-xs px-2 py-1">
                        New Analysis
                    </button>
                </div>
            )}

            <SummaryCards summary={result.summary} />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
                <div className="space-y-4">
                    <GraphPanel analysisData={result} transactions={rawTxns}
                        onNodeClick={setSelectedNode} fromHistory={fromHistory}
                        onCyReady={handleCyReady} />
                    <TimelineBar transactions={fromHistory ? [] : rawTxns} cyRef={cyRef} />
                </div>
                <div className="space-y-4">
                    <InvestigatorPanel account={selectedNode} />
                    <DownloadButton data={result} />
                </div>
            </div>
        </div>
    )
}
