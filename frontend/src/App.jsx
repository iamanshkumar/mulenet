import { useState } from 'react'
import Header from './components/Header'
import UploadPanel from './components/UploadPanel'
import SummaryCards from './components/SummaryCards'
import GraphPanel from './components/GraphPanel'
import TimelineBar from './components/TimelineBar'
import InvestigatorPanel from './components/InvestigatorPanel'
import FraudRingTable from './components/FraudRingTable'
import DownloadButton from './components/DownloadButton'

export default function App() {
  const [result, setResult] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [rawTxns, setRawTxns] = useState([])

  return (
    <div className='min-h-screen bg-brand-dark'>
      <Header />
      {!result ? (
        <div className='flex items-center justify-center min-h-[85vh]'>
          <UploadPanel onResult={(d, t) => { setResult(d); setRawTxns(t) }} />
        </div>
      ) : (
        <div className='p-6 space-y-6'>
          <SummaryCards summary={result.summary} />
          <div className='grid grid-cols-[1fr_360px] gap-5'>
            <div className='space-y-3'>
              <GraphPanel analysisData={result} transactions={rawTxns} onNodeClick={setSelectedNode} />
              <TimelineBar transactions={rawTxns} />
            </div>
            <div className='space-y-4'>
              <InvestigatorPanel account={selectedNode} />
              <DownloadButton data={result} />
            </div>
          </div>
          <FraudRingTable rings={result.fraud_rings} />
        </div>
      )}
    </div>
  )
}
