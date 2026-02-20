import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

export default function TimelineBar({ transactions = [], cyRef }) {
    const [playing, setPlaying] = useState(false)
    const [idx, setIdx] = useState(0)
    const timerRef = useRef(null)
    const sortedRef = useRef([])

    const hasTransactions = transactions && transactions.length > 0

    // Sort transactions once
    useEffect(() => {
        if (hasTransactions) {
            sortedRef.current = [...transactions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        } else {
            sortedRef.current = []
        }
    }, [transactions, hasTransactions])

    const sorted = sortedRef.current
    const total = sorted.length || 1
    const pct = (idx / total) * 100

    // Animate a single edge + its nodes
    const flashEdge = useCallback((tx) => {
        const cy = cyRef?.current
        if (!cy) return

        // Find edge matching this transaction
        const edges = cy.edges().filter(e => {
            const d = e.data()
            return d.source === tx.sender_id && d.target === tx.receiver_id
        })

        if (edges.length > 0) {
            edges.animate({ style: { 'line-color': '#ffd166', width: 4 } }, { duration: 300 })
            setTimeout(() => {
                edges.animate({
                    style: { 'line-color': edges[0].data('isRingEdge') ? '#e63946' : '#21262d', width: edges[0].data('edgeWidth') || 1.5 },
                }, { duration: 300 })
            }, 600)
        }

        // Highlight nodes briefly
        const srcNode = cy.$id(tx.sender_id)
        const tgtNode = cy.$id(tx.receiver_id)
            ;[srcNode, tgtNode].forEach(node => {
                if (node.length > 0) {
                    const origBorder = node.style('border-color')
                    const origWidth = node.style('border-width')
                    node.animate({ style: { 'border-color': '#ffffff', 'border-width': 4 } }, { duration: 300 })
                    setTimeout(() => {
                        node.animate({ style: { 'border-color': origBorder, 'border-width': origWidth } }, { duration: 300 })
                    }, 600)
                }
            })
    }, [cyRef])

    // Playback loop
    useEffect(() => {
        if (!playing) return
        if (idx >= sorted.length) {
            setPlaying(false)
            return
        }

        timerRef.current = setTimeout(() => {
            const tx = sorted[idx]
            if (tx) flashEdge(tx)
            setIdx(prev => prev + 1)
        }, 80)

        return () => clearTimeout(timerRef.current)
    }, [playing, idx, sorted.length, flashEdge])

    const toggle = () => {
        if (idx >= sorted.length) {
            setIdx(0)
            setPlaying(true)
        } else {
            setPlaying(!playing)
        }
    }

    const reset = () => {
        setPlaying(false)
        setIdx(0)
        clearTimeout(timerRef.current)
        // Revert all edges to original
        const cy = cyRef?.current
        if (cy) {
            cy.edges().forEach(e => {
                const isRing = e.data('isRingEdge')
                e.style({
                    'line-color': isRing ? '#e63946' : '#21262d',
                    width: e.data('edgeWidth') || 1.5,
                })
            })
        }
    }

    // Show fallback AFTER all hooks have been called
    if (!hasTransactions) {
        return (
            <div className="card-dark text-center py-3" style={{ padding: '0.75rem 1.25rem' }}>
                <span className="text-xs" style={{ color: '#6b7280' }}>
                    Timeline unavailable for historical analyses
                </span>
            </div>
        )
    }

    return (
        <div className="card-dark" style={{ padding: '0.75rem 1.25rem' }}>
            <div className="flex items-center gap-3 mb-2">
                <button onClick={toggle}
                    className="btn-accent px-3 py-1.5 text-xs flex items-center gap-1.5"
                    disabled={!cyRef?.current}>
                    {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {playing ? 'Pause' : idx >= sorted.length ? 'Replay' : 'Play Money Trail'}
                </button>
                <button onClick={reset} className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <span className="ml-auto text-xs mono" style={{ color: 'var(--color-text-muted)' }}>
                    {idx.toLocaleString()} / {sorted.length.toLocaleString()} txns
                </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-panel-light)' }}>
                <div className="h-full rounded-full transition-all duration-75"
                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--color-accent), #ff6b6b)' }} />
            </div>
        </div>
    )
}