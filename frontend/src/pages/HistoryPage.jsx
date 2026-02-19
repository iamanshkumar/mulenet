import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalysis } from '../context/AnalysisContext'
import axios from 'axios'
import { Clock, Trash2, Upload, FileText } from 'lucide-react'

const API = import.meta.env.VITE_API_URL

export default function HistoryPage() {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    const fetchHistory = async () => {
        setLoading(true)
        try {
            const { data } = await axios.get(`${API}/api/history`)
            setHistory(data)
        } catch (err) {
            console.error('Failed to load history:', err)
        }
        setLoading(false)
    }

    useEffect(() => { fetchHistory() }, [])

    const loadPast = async (id) => {
        try {
            const { data } = await axios.get(`${API}/api/analysis/${id}`)
            // Fix 5: Navigate with state so DashboardPage can rebuild graph
            navigate('/dashboard', { state: { result: data, fromHistory: true } })
        } catch (err) {
            console.error('Failed to load analysis:', err)
        }
    }

    const deleteAnalysis = async (id) => {
        try {
            await axios.delete(`${API}/api/analysis/${id}`)
            fetchHistory()
        } catch (err) {
            console.error('Delete failed:', err)
        }
    }

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary">
                        <Clock className="w-6 h-6 inline mr-2" style={{ color: 'var(--color-blue)' }} />
                        Analysis History
                    </h1>
                    <p className="text-sm mt-1 text-muted">{history.length} past analyses</p>
                </div>
                <button onClick={() => navigate('/analyze')} className="btn-accent flex items-center gap-2">
                    <Upload className="w-4 h-4" /> New Analysis
                </button>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 w-full" />)}
                </div>
            ) : history.length === 0 ? (
                <div className="card-dark text-center py-16">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted" />
                    <p className="text-muted">No analyses yet. Upload a CSV to get started.</p>
                </div>
            ) : (
                <div className="card-dark" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="table-dark">
                        <thead>
                            <tr>
                                <th>Filename</th>
                                <th>Date</th>
                                <th>Accounts</th>
                                <th>Flagged</th>
                                <th>Rings</th>
                                <th>Time</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((h) => (
                                <tr key={h._id} className="cursor-pointer" onClick={() => loadPast(h._id)}>
                                    <td><span className="mono text-sm" style={{ color: 'var(--color-blue)' }}>{h.filename}</span></td>
                                    <td className="text-xs text-muted">{new Date(h.uploadedAt).toLocaleString()}</td>
                                    <td className="mono">{h.summary?.total_accounts?.toLocaleString() || '—'}</td>
                                    <td><span className="badge-red text-xs">{h.summary?.suspicious_flagged || 0}</span></td>
                                    <td><span className="badge-orange text-xs">{h.summary?.rings_detected || 0}</span></td>
                                    <td className="mono text-xs" style={{ color: 'var(--color-success)' }}>
                                        {h.summary?.processing_seconds ? `${h.summary.processing_seconds}s` : '—'}
                                    </td>
                                    <td>
                                        <button onClick={(e) => { e.stopPropagation(); deleteAnalysis(h._id) }}
                                            className="p-1.5 rounded hover:bg-red-900/30 transition-colors" title="Delete">
                                            <Trash2 className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
