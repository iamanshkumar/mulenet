import { useState, useEffect, useRef } from 'react'

export default function TimelineBar({ transactions }) {
    const [playing, setPlaying] = useState(false)
    const [idx, setIdx] = useState(0)
    const timer = useRef(null)
    const sorted = [...transactions].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    )
    const pct = sorted.length ? (idx / sorted.length) * 100 : 0

    useEffect(() => {
        if (!playing) { clearTimeout(timer.current); return }
        if (idx >= sorted.length) {
            setPlaying(false);
            return;
        }
        timer.current = setTimeout(() => setIdx(i => i + 1), 80)
        return () => clearTimeout(timer.current)
    }, [playing, idx])

    const reset = () => { setPlaying(false); setIdx(0) }

    return (
        <div className='bg-brand-panel border border-brand-border rounded-xl
      p-3 flex items-center gap-3'>
            <button onClick={() => { reset(); setPlaying(true) }}
                className='bg-brand-red hover:bg-red-700 text-white text-sm font-bold
          px-4 py-2 rounded-lg transition-colors whitespace-nowrap'>
                ▶ Play Money Trail
            </button>
            <button onClick={reset}
                className='bg-brand-border text-brand-muted text-sm px-3 py-2 rounded-lg'>
                ■ Reset
            </button>
            <div className='flex-1 h-2 bg-brand-border rounded-full overflow-hidden'>
                <div className='h-full bg-brand-red transition-all duration-75'
                    style={{ width: `${pct}%` }} />
            </div>
            <span className='text-brand-muted text-xs code-font whitespace-nowrap'>
                {idx}/{sorted.length} txns
            </span>
        </div>
    )
}
