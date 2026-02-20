import { Network, AlertTriangle } from 'lucide-react'
import CytoscapeComponent from 'react-cytoscapejs'
import { useMemo, useRef, useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext'

const MAX_NODES = 200

function getNodeSize(score) {
  if (score >= 80) return 70
  if (score >= 50) return 50
  if (score >= 20) return 35
  return 24
}

function getNodeColor(score) {
  if (score >= 80) return '#e63946'
  if (score >= 50) return '#f4a261'
  if (score >= 20) return '#ffd166'
  return '#4a5568'
}

export default function GraphPanel({ analysisData, transactions = [], onNodeClick, fromHistory = false, onCyReady }) {
  const cyRef = useRef(null)
  const { dark } = useTheme()
  const [totalNodeCount, setTotalNodeCount] = useState(0)

  const { elements, computedNodeCount } = useMemo(() => {
    if (!analysisData) return { elements: [], computedNodeCount: 0 }

    const suspiciousMap = {}
      ; (analysisData.suspicious_accounts || []).forEach(acc => { suspiciousMap[acc.account_id] = acc })

    const ringMembers = new Set()
      ; (analysisData.fraud_rings || []).forEach(ring => {
        ring.member_accounts?.forEach(m => ringMembers.add(m))
      })

    // Collect ALL unique node IDs first
    const allNodeIds = new Set()
    if (transactions.length > 0) {
      transactions.forEach(tx => {
        if (tx.sender_id) allNodeIds.add(tx.sender_id)
        if (tx.receiver_id) allNodeIds.add(tx.receiver_id)
      })
    } else if (fromHistory) {
      ; (analysisData.fraud_rings || []).forEach(ring => {
        ring.member_accounts?.forEach(m => allNodeIds.add(m))
      })
        ; (analysisData.suspicious_accounts || []).forEach(acc => allNodeIds.add(acc.account_id))
    }

    const totalNodes = allNodeIds.size

    // NODE LIMITING: prioritize suspicious accounts, then fill with normals
    const suspiciousIds = new Set(Object.keys(suspiciousMap))
    const renderedIds = new Set()

    // Always include ALL suspicious accounts first
    suspiciousIds.forEach(id => {
      if (allNodeIds.has(id)) renderedIds.add(id)
    })

    // Fill remaining slots with random normal nodes
    if (renderedIds.size < MAX_NODES) {
      const normalIds = [...allNodeIds].filter(id => !renderedIds.has(id))
      // Shuffle and take what we need
      for (let i = normalIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
          ;[normalIds[i], normalIds[j]] = [normalIds[j], normalIds[i]]
      }
      const remaining = MAX_NODES - renderedIds.size
      normalIds.slice(0, remaining).forEach(id => renderedIds.add(id))
    }

    // Build node elements
    const nodes = []
    renderedIds.forEach(id => {
      const acc = suspiciousMap[id]
      const isSuper = acc?.detected_patterns?.includes('super_node')
      const score = acc?.suspicion_score || 0
      nodes.push({
        data: {
          id, label: id,
          suspicious: !!acc,
          score,
          nodeColor: acc ? getNodeColor(score) : '#4a5568',
          nodeSize: acc ? getNodeSize(score) : 20,
          isSuper: isSuper || false,
          highScore: score >= 50,
        }
      })
    })

    // Build edges — ONLY where BOTH source and target are in rendered set
    const edges = []
    if (transactions.length > 0) {
      let maxAmount = 1
      transactions.forEach(tx => { const a = parseFloat(tx.amount) || 0; if (a > maxAmount) maxAmount = a })

      transactions.forEach((tx, i) => {
        const src = tx.sender_id, tgt = tx.receiver_id
        if (!src || !tgt) return
        if (!renderedIds.has(src) || !renderedIds.has(tgt)) return
        const amt = parseFloat(tx.amount) || 0
        const edgeWidth = 1 + (amt / maxAmount) * 4
        const isRingEdge = ringMembers.has(src) && ringMembers.has(tgt)
        edges.push({ data: { id: `e${i}`, source: src, target: tgt, edgeWidth, isRingEdge } })
      })
    } else if (fromHistory) {
      ; (analysisData.fraud_rings || []).forEach(ring => {
        const members = ring.member_accounts || []
        for (let i = 0; i < members.length - 1; i++) {
          if (renderedIds.has(members[i]) && renderedIds.has(members[i + 1])) {
            edges.push({
              data: {
                id: `ring-${ring.ring_id}-${i}`,
                source: members[i], target: members[i + 1],
                edgeWidth: 2.5, isRingEdge: true,
              }
            })
          }
        }
      })
    }

    return { elements: [...nodes, ...edges], computedNodeCount: totalNodes }
  }, [analysisData, transactions, fromHistory])

  // Sync totalNodeCount from useMemo result (avoids setState during render)
  useEffect(() => {
    setTotalNodeCount(computedNodeCount)
  }, [computedNodeCount])

  // cy.resize() after elements change — with null safety
  useEffect(() => {
    const cy = cyRef.current
    if (cy && !cy.destroyed()) {
      const timer = setTimeout(() => {
        try {
          if (cyRef.current && !cyRef.current.destroyed()) {
            cyRef.current.resize()
            cyRef.current.fit(undefined, 30)
          }
        } catch (e) {
          // Cytoscape instance may have been destroyed during navigation
          console.warn('Cytoscape resize skipped:', e.message)
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [elements])

  // Cleanup cytoscape ref on unmount
  useEffect(() => {
    return () => {
      cyRef.current = null
    }
  }, [])

  const labelColor = dark ? '#e6edf3' : '#1a1a2e'
  const outlineColor = dark ? '#0d1117' : '#ffffff'
  const nodeCount = elements.filter(e => !e.data.source).length
  const isLargeDataset = nodeCount > 100

  const cytoStyle = [
    {
      selector: 'node', style: {
        'background-color': 'data(nodeColor)',
        label: 'data(label)',
        'text-valign': 'bottom', 'text-halign': 'center',
        color: labelColor,
        'text-outline-color': outlineColor,
        'text-outline-width': 2,
        'font-size': 11, 'font-family': 'JetBrains Mono, monospace',
        width: 'data(nodeSize)', height: 'data(nodeSize)',
        'border-width': 1.5, 'border-color': '#484f58',
      }
    },
    {
      selector: 'node[?suspicious]', style: {
        'border-color': 'data(nodeColor)',
        'font-weight': 'bold',
        'shadow-blur': 15, 'shadow-color': 'data(nodeColor)', 'shadow-opacity': 0.6,
      }
    },
    {
      selector: 'node[?highScore]', style: {
        color: '#ffffff',
        'text-outline-color': '#000000',
        'text-outline-width': 3,
      }
    },
    {
      selector: 'node[?isSuper]', style: {
        'background-color': '#FFD700', 'border-color': '#DAA520',
        shape: 'star', width: 75, height: 75,
        'shadow-blur': 20, 'shadow-color': 'rgba(255,215,0,0.5)', 'shadow-opacity': 0.8,
        color: '#ffffff', 'text-outline-color': '#000000', 'text-outline-width': 3,
      }
    },
    {
      selector: 'edge', style: {
        'line-color': dark ? '#21262d' : '#c0c8d0',
        'target-arrow-color': dark ? '#484f58' : '#8896a4',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier', width: 'data(edgeWidth)', opacity: 0.5,
      }
    },
    {
      selector: 'edge[?isRingEdge]', style: {
        'line-color': '#e63946', 'target-arrow-color': '#e63946', opacity: 0.8,
      }
    },
    { selector: 'node:active', style: { 'overlay-color': '#58a6ff', 'overlay-opacity': 0.3 } },
    { selector: 'node:selected', style: { 'border-color': '#ffffff', 'border-width': 4 } },
  ]

  const layout = {
    name: 'cose',
    animate: !isLargeDataset,
    avoidOverlap: true,
    nodeRepulsion: () => 8000,
    idealEdgeLength: () => 150,
    nodeSpacing: 20,
    nodeDimensionsIncludeLabels: true,
  }

  const handleCyInit = (cy) => {
    cyRef.current = cy
    if (onCyReady) onCyReady(cy)
    cy.on('tap', 'node', (evt) => {
      const nodeId = evt.target.id()
      const acc = (analysisData?.suspicious_accounts || []).find(a => a.account_id === nodeId)
      if (acc && onNodeClick) onNodeClick(acc)
    })
    // Clean up ref when Cytoscape is destroyed
    cy.on('destroy', () => {
      cyRef.current = null
    })
  }

  const isTruncated = totalNodeCount > MAX_NODES

  return (
    <div className="card-dark flex flex-col"
      style={{ padding: 0, overflow: 'hidden', maxHeight: '640px' }}>
      <div className="flex items-center gap-2 px-5 py-3"
        style={{ borderBottom: '1px solid var(--color-panel-border)' }}>
        <Network className="w-4 h-4" style={{ color: '#e63946' }} />
        <h2 className="text-sm font-bold text-primary">Network Visualization</h2>
        {analysisData && (
          <span className="ml-auto text-xs mono text-muted">
            {nodeCount} nodes · {elements.filter(e => e.data.source).length} edges
          </span>
        )}
      </div>

      {/* Truncation warning banner */}
      {isTruncated && (
        <div className="flex items-center gap-2 px-4 py-2"
          style={{ background: 'rgba(251, 191, 36, 0.1)', borderBottom: '1px solid rgba(251, 191, 36, 0.3)' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#fbbf24' }} />
          <span className="text-xs" style={{ color: '#fbbf24' }}>
            Showing top {MAX_NODES} nodes. All {totalNodeCount.toLocaleString()} accounts analyzed — suspicious accounts prioritized.
          </span>
        </div>
      )}

      <div style={{ width: '100%', height: '560px', overflow: 'hidden', position: 'relative', background: 'var(--graph-bg)' }}>
        {elements.length === 0 ? (
          <div className="flex items-center justify-center text-muted" style={{ height: '560px' }}>
            Upload data to visualize the network
          </div>
        ) : (
          <CytoscapeComponent
            elements={elements}
            style={{ width: '100%', height: '560px' }}
            stylesheet={cytoStyle}
            layout={layout}
            cy={handleCyInit}
            maxZoom={3}
            minZoom={0.1}
          />
        )}
      </div>
    </div>
  )
}