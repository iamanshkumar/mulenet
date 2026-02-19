import { createContext, useContext, useState } from 'react'

const AnalysisContext = createContext(null)

export function AnalysisProvider({ children }) {
    const [result, setResult] = useState(null)
    const [rawTxns, setRawTxns] = useState([])
    const [selectedNode, setSelectedNode] = useState(null)
    const [analysisId, setAnalysisId] = useState(null)

    const loadAnalysis = (data, txns) => {
        setResult(data)
        setRawTxns(txns || [])
        setSelectedNode(null)
        setAnalysisId(data?.analysis_id || null)
    }

    const clearAnalysis = () => {
        setResult(null)
        setRawTxns([])
        setSelectedNode(null)
        setAnalysisId(null)
    }

    return (
        <AnalysisContext.Provider value={{
            result, rawTxns, selectedNode, analysisId,
            setSelectedNode, loadAnalysis, clearAnalysis,
        }}>
            {children}
        </AnalysisContext.Provider>
    )
}

export function useAnalysis() {
    const ctx = useContext(AnalysisContext)
    if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider')
    return ctx
}
