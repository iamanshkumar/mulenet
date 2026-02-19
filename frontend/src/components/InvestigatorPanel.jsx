import { useState, useEffect } from 'react'

export default function InvestigatorPanel({ account }) {
    const [narrative, setNarrative] = useState('')
    const [loading, setLoading] = useState(false)

    const genNarrative = async (acc) => {
        setLoading(true)
        try {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514', max_tokens: 1000,
                    messages: [{
                        role: 'user', content:
                            `You are a financial crime investigator. Write a 3-sentence SAR narrative:
Account: ${acc.account_id} | Score: ${acc.suspicion_score}/100
Patterns: ${acc.detected_patterns?.join(', ')} | Ring: ${acc.ring_id}
Stage: ${acc.lifecycle_stage || 'unknown'}
End with a one-sentence recommended action.` }]
                })
            })
            const d = await res.json()
            setNarrative(d.content[0].text)
        } catch { setNarrative('Narrative unavailable.') }
        setLoading(false)
    }

    useEffect(() => {
        if (account) genNarrative(account)
        else setNarrative('')
    }, [account])

    

    if (!account) return (
        <div className='bg-brand-panel border border-dashed border-brand-border
      rounded-xl p-8 text-center text-brand-muted'>
            🖱 Click any node to investigate
        </div>
    )

    const scoreCol = account.suspicion_score >= 80 ? 'text-brand-red'
        : account.suspicion_score >= 50 ? 'text-brand-orange' : 'text-brand-gold'

    return (
        <div className='bg-brand-panel border border-brand-border rounded-xl p-5 space-y-3'>
            <h3 className='text-brand-red font-bold text-lg code-font'>
                🔎 {account.account_id}
            </h3>
            <div className='flex justify-between items-center'>
                <span className='text-brand-muted text-sm'>Risk Score</span>
                <span className={`text-3xl font-black ${scoreCol}`}>
                    {account.suspicion_score}/100
                </span>
            </div>
            <div className='text-sm space-y-1'>
                <div className='flex justify-between border-b border-brand-border pb-1'>
                    <span className='text-brand-muted'>Ring</span>
                    <span className='code-font text-blue-400'>{account.ring_id}</span>
                </div>
                <div className='flex justify-between border-b border-brand-border pb-1'>
                    <span className='text-brand-muted'>Stage</span>
                    <span className='text-brand-gold text-xs'>{account.lifecycle_stage || 'N/A'}</span>
                </div>
            </div>
            <div className='flex flex-wrap gap-1'>
                {account.detected_patterns?.map(p => (
                    <span key={p} className='bg-brand-dark border border-blue-800
            text-blue-400 text-xs px-2 py-0.5 rounded-full code-font'>{p}</span>
                ))}
            </div>
            <hr className='border-brand-border' />
            <h4 className='text-brand-gold font-bold text-sm'>🤖 AI Investigator Narrative</h4>
            {loading
                ? <p className='text-brand-muted text-sm italic'>Generating...</p>
                : <p className='text-brand-text text-sm leading-relaxed'>{narrative}</p>
            }
        </div>
    )
}
