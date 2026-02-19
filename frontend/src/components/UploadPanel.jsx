import { Upload, AlertCircle, Check, Loader } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAnalysis } from '../context/AnalysisContext'

const API = import.meta.env.VITE_API_URL

const STEPS = [
  { label: 'Uploading file...', icon: '📤' },
  { label: 'Parsing CSV...', icon: '📋' },
  { label: 'Building Graph...', icon: '🕸️' },
  { label: 'Running Detectors...', icon: '🔍' },
  { label: 'Scoring Accounts...', icon: '📊' },
  { label: 'Complete!', icon: '✅' },
]

export default function UploadPanel() {
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(-1)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)
  const stepTimerRef = useRef(null)
  const navigate = useNavigate()
  const { loadAnalysis } = useAnalysis()

  // Live elapsed timer
  useEffect(() => {
    if (isLoading) {
      const start = Date.now()
      timerRef.current = setInterval(() => setElapsed(((Date.now() - start) / 1000).toFixed(1)), 100)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isLoading])

  // Auto-advance progress steps to show processing activity
  useEffect(() => {
    if (!isLoading || currentStep >= 4) return
    const delays = [3000, 5000, 8000, 12000] // step advancement delays
    if (currentStep >= 0 && currentStep < 4) {
      stepTimerRef.current = setTimeout(() => {
        setCurrentStep(s => Math.min(s + 1, 4))
      }, delays[currentStep] || 5000)
    }
    return () => clearTimeout(stepTimerRef.current)
  }, [isLoading, currentStep])

  const handleUpload = async (file) => {
    setFileName(file.name)
    setIsLoading(true)
    setError('')
    setCurrentStep(0)
    setElapsed(0)

    try {
      // Parse CSV locally for validation
      const text = await file.text()
      const lines = text.trim().split('\n')
      const headers = lines[0].split(',')

      const required = ['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp']
      const missing = required.filter(c => !headers.map(h => h.trim()).includes(c))
      if (missing.length > 0) {
        throw new Error(`Missing columns: ${missing.join(', ')}`)
      }

      // Build raw txns for local state
      const rawTxns = lines.slice(1).map(line => {
        const vals = line.split(',')
        const obj = {}
        headers.forEach((h, i) => obj[h.trim()] = vals[i]?.trim())
        return obj
      })

      setCurrentStep(1) // Parsing CSV

      // Upload to API — 120 second timeout for large datasets
      const form = new FormData()
      form.append('file', file)

      const { data } = await axios.post(`${API}/api/analyze`, form, {
        timeout: 120000,
      })

      // Complete
      clearTimeout(stepTimerRef.current)
      setCurrentStep(5)
      loadAnalysis(data, rawTxns)

      setTimeout(() => navigate('/dashboard'), 800)
    } catch (err) {
      console.error('Upload failed:', err)
      clearTimeout(stepTimerRef.current)
      setError(
        err.code === 'ECONNABORTED'
          ? 'Request timed out. The dataset may be too large — try a smaller file or check the server.'
          : err.response?.data?.message || err.message || 'Analysis failed'
      )
      setCurrentStep(-1)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card-dark max-w-xl w-full space-y-6 animate-slideUp">
      <div>
        <h2 className="text-2xl font-bold text-primary">Upload Data</h2>
        <p className="text-sm mt-1 text-secondary">Import CSV files for fraud ring analysis</p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleUpload(f) }}
        className="rounded-xl p-12 text-center transition-all cursor-pointer"
        style={{
          border: `2px dashed ${dragOver ? 'var(--color-accent)' : 'var(--color-panel-border)'}`,
          background: dragOver ? 'rgba(230, 57, 70, 0.05)' : 'var(--color-panel-light)',
        }}
      >
        <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: dragOver ? 'var(--color-accent)' : 'var(--color-text-muted)' }} />
        <p className="font-semibold mb-1 text-primary">Drag and drop your CSV file here</p>
        <p className="text-sm mb-4 text-muted">or</p>
        <label className="btn-accent cursor-pointer">
          Browse Files
          <input type="file" accept=".csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
            className="hidden" disabled={isLoading} />
        </label>
      </div>

      {/* Processing Steps */}
      {isLoading && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-secondary">Processing {fileName}...</span>
            <span className="mono" style={{ color: 'var(--color-accent)' }}>{elapsed}s</span>
          </div>

          {/* Big current step indicator */}
          {currentStep >= 0 && currentStep < 5 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl animate-pulse"
              style={{ background: 'rgba(230, 57, 70, 0.1)', border: '1px solid rgba(230, 57, 70, 0.3)' }}>
              <Loader className="w-5 h-5 animate-spin" style={{ color: 'var(--color-accent)' }} />
              <span className="font-semibold text-primary">{STEPS[currentStep]?.icon} {STEPS[currentStep]?.label}</span>
            </div>
          )}

          {/* Step list */}
          <div className="space-y-1">
            {STEPS.map((step, i) => {
              const done = i < currentStep
              const active = i === currentStep
              return (
                <div key={i} className="flex items-center gap-3 py-1.5 px-3 rounded-lg transition-all"
                  style={{ background: active ? 'rgba(230, 57, 70, 0.08)' : 'transparent' }}>
                  {done ? (
                    <Check className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                  ) : active ? (
                    <Loader className="w-4 h-4 animate-spin" style={{ color: 'var(--color-accent)' }} />
                  ) : (
                    <div className="w-4 h-4 rounded-full" style={{ border: '1.5px solid var(--color-panel-border)' }} />
                  )}
                  <span className="text-sm" style={{
                    color: done ? 'var(--color-success)' : active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    fontWeight: active ? 600 : 400,
                  }}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Success */}
      {fileName && !isLoading && !error && currentStep === 5 && (
        <div className="flex items-center gap-3 p-4 rounded-lg"
          style={{ background: 'rgba(63, 185, 80, 0.1)', border: '1px solid rgba(63, 185, 80, 0.3)' }}>
          <Check className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>
            {fileName} — Analysis complete! Redirecting...
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex gap-3 p-4 rounded-lg" style={{ background: 'rgba(230, 57, 70, 0.1)', border: '1px solid rgba(230, 57, 70, 0.3)' }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
          <p className="text-sm" style={{ color: 'var(--color-accent)' }}>{error}</p>
        </div>
      )}

      {/* Required columns info */}
      <div className="flex gap-3 p-4 rounded-lg" style={{ background: 'var(--color-panel-light)', border: '1px solid var(--color-panel-border)' }}>
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-blue)' }} />
        <div>
          <p className="text-sm font-medium text-primary">Required columns</p>
          <p className="text-xs mono mt-1 text-muted">transaction_id, sender_id, receiver_id, amount, timestamp</p>
        </div>
      </div>
    </div>
  )
}