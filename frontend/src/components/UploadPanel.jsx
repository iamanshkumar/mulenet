import { useState } from 'react'
import axios from 'axios'
 
export default function UploadPanel({ onResult }) {
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
 
  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true); setError(null)
    const text  = await file.text()
    const lines = text.trim().split('\n')
    const hdrs  = lines[0].split(',').map(h=>h.trim())
    const txns  = lines.slice(1).map(l => {
      const v = l.split(',')
      return Object.fromEntries(hdrs.map((h,i)=>[h,v[i]?.trim()]))
    })
    try {
      const form = new FormData(); form.append('file', file)
      const res  = await axios.post(`${import.meta.env.VITE_API_URL}/api/analyze`,
        form, { headers: {'Content-Type':'multipart/form-data'} })
      onResult(res.data, txns)
    } catch(e) { setError(`Analysis failed: ${e.message}`) }
    finally { setLoading(false) }
  }
 
  return (
    <div className='bg-brand-panel border-2 border-dashed border-brand-border
      hover:border-brand-red transition-colors rounded-2xl p-12 text-center w-[560px]'>
      <div className='text-6xl mb-4'>🔍</div>
      <h2 className='text-xl font-bold mb-2'>Upload Transaction CSV</h2>
      <p className='text-brand-muted text-sm mb-6'>
        Columns: transaction_id, sender_id, receiver_id, amount, timestamp
      </p>
      <input 
      type='file' accept='.csv'
        className='block w-full bg-black text-sm text-brand-muted file:mr-4 file:py-2
          file:px-4 file:rounded-full file:border-0 file:bg-brand-red
          file:text-white file:font-bold cursor-pointer mb-4'
        onChange={e => setFile(e.target.files[0])} />
      {file && <p className='text-brand-green text-sm mb-3'>📄 {file.name}</p>}
      <button onClick={handleAnalyze} disabled={!file||loading}
        className='bg-brand-red hover:bg-red-700 disabled:bg-gray-600
          text-white font-bold py-3 px-8 rounded-lg w-full transition-colors'>
        {loading ? '⚙  Analyzing network...' : '🚀  Run MuleNet Analysis'}
      </button>
      {error && <p className='text-brand-red text-sm mt-3'>{error}</p>}
    </div>
  )
}
