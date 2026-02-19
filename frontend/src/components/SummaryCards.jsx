export default function SummaryCards({ summary }) {
  const cards = [
    { label:'Total Accounts', val:summary.total_accounts_analyzed, icon:'🏦', col:'text-blue-400' },
    { label:'Suspicious',     val:summary.suspicious_accounts_flagged, icon:'🚨', col:'text-brand-red' },
    { label:'Fraud Rings',    val:summary.fraud_rings_detected, icon:'🔴', col:'text-brand-orange' },
    { label:'Processed In',   val:`${summary.processing_time_seconds}s`, icon:'⚡', col:'text-brand-green' },
  ]
  return (
    <div className='grid grid-cols-4 gap-4'>
      {cards.map(c => (
        <div key={c.label} className='bg-brand-panel border border-brand-border
          rounded-xl p-5 flex items-center gap-4'>
          <span className='text-3xl'>{c.icon}</span>
          <div>
            <div className={`text-3xl font-black ${c.col}`}>{c.val}</div>
            <div className='text-brand-muted text-sm'>{c.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
