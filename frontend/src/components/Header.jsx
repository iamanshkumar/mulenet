export default function Header() {
  return (
    <header className='bg-brand-panel border-b-2 border-brand-red px-8 py-4 flex items-center gap-4'>
      <span className='text-3xl'>🕵️</span>
      <div>
        <h1 className='text-2xl font-black text-brand-red tracking-tight'>MuleNet</h1>
        <p className='text-xs text-brand-muted'>Financial Forensics Engine — RIFT 2026</p>
      </div>
      <div className='ml-auto flex gap-2'>
        <span className='px-3 py-1 bg-brand-dark border border-brand-border rounded-full
          text-xs text-brand-muted code-font'>Graph Theory</span>
        <span className='px-3 py-1 bg-brand-dark border border-brand-border rounded-full
          text-xs text-brand-muted code-font'>Benford's Law</span>
        <span className='px-3 py-1 bg-brand-dark border border-brand-border rounded-full
          text-xs text-brand-purple code-font'>GNN</span>
      </div>
    </header>
  )
}
