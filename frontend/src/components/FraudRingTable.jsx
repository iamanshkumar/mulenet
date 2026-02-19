export default function FraudRingTable({ rings }) {
  const sorted = [...rings].sort((a,b)=>b.risk_score-a.risk_score)
  return (
    <div className='bg-brand-panel border border-brand-border rounded-xl overflow-hidden'>
      <div className='px-5 py-3 border-b border-brand-border'>
        <h2 className='font-bold text-lg'>🔴 Detected Fraud Rings</h2>
      </div>
      <table className='w-full text-sm'>
        <thead className='bg-brand-dark text-brand-muted text-left'>
          <tr>
            {['Ring ID','Pattern','Members','Risk Score','Account IDs'].map(h=>(
              <th key={h} className='px-4 py-3 font-medium'>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((ring,i) => (
            <tr key={ring.ring_id}
              className={i%2?'bg-brand-dark':'bg-brand-panel'}>
              <td className='px-4 py-3 code-font text-blue-400'>{ring.ring_id}</td>
              <td className='px-4 py-3 text-brand-orange'>{ring.pattern_type}</td>
              <td className='px-4 py-3 font-bold'>{ring.member_accounts.length}</td>
              <td className={`px-4 py-3 font-black text-lg
                ${ring.risk_score>=80?'text-brand-red':'text-brand-orange'}`}>
                {ring.risk_score}
              </td>
              <td className='px-4 py-3 code-font text-brand-muted text-xs'>
                {ring.member_accounts.join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
