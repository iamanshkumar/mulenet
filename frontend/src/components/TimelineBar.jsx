import { useState, useEffect, useRef } from 'react'

export default function TimelineBar({ transactions = [] }) {
    const [playing, setPlaying] = useState(false)
    const [idx, setIdx] = useState(0)
    const timer = useRef(null)
    
    const sorted = [...transactions].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    )
    const pct = sorted.length ? (idx / sorted.length) * 100 : 0

    useEffect(() => {
        if (playing && idx < sorted.length) {
            timer.current = setTimeout(() => {
                setIdx(idx + 1)
            }, 80)
        } else if (idx >= sorted.length) {
            setPlaying(false)
        }
        return () => clearTimeout(timer.current)
    }, [playing, idx, sorted.length])

    const reset = () => {
        setPlaying(false)
        setIdx(0)
        if (timer.current) clearTimeout(timer.current)
    }

    const toggle = () => {
        if (idx >= sorted.length) {
            setIdx(0)
            setPlaying(true)
        } else {
            setPlaying(!playing)
        }
    }

    return (
        <div className='bg-gray-900 p-4 rounded-lg border border-gray-700'>
            <div className='flex items-center gap-3 mb-3'>
                <button
                    onClick={toggle}
                    className='bg-blue-600 hover:bg-blue-500 text-white font-bold 
                        py-2 px-4 rounded transition-colors'
                >
                    {playing ? '⏸ Pause' : '▶ Play Money Trail'}
                </button>
                <button
                    onClick={reset}
                    className='bg-gray-700 hover:bg-gray-600 text-white font-bold 
                        py-2 px-4 rounded transition-colors'
                >
                    ■ Reset
                </button>
                <span className='text-white text-sm ml-auto'>
                    {idx} / {sorted.length} txns
                </span>
            </div>
            <div className='w-full bg-gray-800 rounded-full h-2'>
                <div
                    className='bg-red-600 h-2 rounded-full transition-all'
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}