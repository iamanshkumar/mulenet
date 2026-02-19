import { Network } from 'lucide-react';
import CytoscapeComponent from 'react-cytoscapejs';
import { useMemo, useRef } from 'react';

export default function GraphPanel({ analysisData, transactions = [], onNodeClick }) {
  const cyRef = useRef(null);

  const elements = useMemo(() => {
    if (!analysisData) return [];

    const nodeSet = new Set();
    const nodes = [];
    const edges = [];

    // Gather suspicious account IDs for coloring
    const suspiciousMap = {};
    (analysisData.suspicious_accounts || []).forEach(acc => {
      suspiciousMap[acc.account_id] = acc;
    });

    // Build edges from raw transactions
    if (transactions.length > 0) {
      transactions.forEach((tx, i) => {
        const src = tx.sender_id;
        const tgt = tx.receiver_id;
        if (src && tgt) {
          if (!nodeSet.has(src)) {
            nodeSet.add(src);
            nodes.push({
              data: {
                id: src,
                label: src,
                suspicious: !!suspiciousMap[src],
                score: suspiciousMap[src]?.suspicion_score || 0,
              }
            });
          }
          if (!nodeSet.has(tgt)) {
            nodeSet.add(tgt);
            nodes.push({
              data: {
                id: tgt,
                label: tgt,
                suspicious: !!suspiciousMap[tgt],
                score: suspiciousMap[tgt]?.suspicion_score || 0,
              }
            });
          }
          edges.push({
            data: {
              id: `e${i}`,
              source: src,
              target: tgt,
              amount: parseFloat(tx.amount) || 0,
            }
          });
        }
      });
    } else {
      // Fallback: build from fraud_rings if no raw transactions
      (analysisData.fraud_rings || []).forEach(ring => {
        const members = ring.member_accounts || [];
        members.forEach(m => {
          if (!nodeSet.has(m)) {
            nodeSet.add(m);
            nodes.push({
              data: {
                id: m,
                label: m,
                suspicious: !!suspiciousMap[m],
                score: suspiciousMap[m]?.suspicion_score || 0,
              }
            });
          }
        });
        // Connect ring members sequentially
        for (let i = 0; i < members.length - 1; i++) {
          edges.push({
            data: {
              id: `ring-${ring.ring_id}-${i}`,
              source: members[i],
              target: members[i + 1],
            }
          });
        }
      });
    }

    return [...nodes, ...edges];
  }, [analysisData, transactions]);

  const cytoStyle = [
    {
      selector: 'node',
      style: {
        'background-color': '#4b5563',
        'label': 'data(label)',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'color': '#9ca3af',
        'font-size': 10,
        'width': 30,
        'height': 30,
        'border-width': 2,
        'border-color': '#374151',
      },
    },
    {
      selector: 'node[?suspicious]',
      style: {
        'background-color': '#dc2626',
        'border-color': '#991b1b',
        'width': 'mapData(score, 0, 100, 30, 60)',
        'height': 'mapData(score, 0, 100, 30, 60)',
        'color': '#fca5a5',
      },
    },
    {
      selector: 'edge',
      style: {
        'line-color': '#6b7280',
        'target-arrow-color': '#9ca3af',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'width': 1.5,
        'opacity': 0.6,
      },
    },
    {
      selector: 'node:active',
      style: {
        'overlay-color': '#3b82f6',
        'overlay-opacity': 0.3,
      },
    },
  ];

  const layout = {
    name: 'cose',
    directed: true,
    animate: true,
    animationDuration: 500,
    avoidOverlap: true,
    nodeSpacing: 20,
    idealEdgeLength: 100,
  };

  const handleCyInit = (cy) => {
    cyRef.current = cy;
    cy.on('tap', 'node', (evt) => {
      const nodeId = evt.target.id();
      const acc = (analysisData?.suspicious_accounts || []).find(a => a.account_id === nodeId);
      if (acc && onNodeClick) onNodeClick(acc);
    });
  };

  return (
    <div className="card-elevated h-full md:h-96 flex flex-col animate-fadeIn">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
        <Network className="w-5 h-5 text-primary-500" />
        <h2 className="text-xl font-semibold text-gray-900">Network Visualization</h2>
        {analysisData && (
          <span className="ml-auto text-xs text-gray-400">
            {elements.filter(e => !e.data.source).length} nodes · {elements.filter(e => e.data.source).length} edges
          </span>
        )}
      </div>

      {elements.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p>Upload data to visualize network connections</p>
        </div>
      ) : (
        <div className="flex-1 rounded-lg overflow-hidden shadow-sm border border-gray-200">
          <CytoscapeComponent
            elements={elements}
            style={{ width: '100%', height: '100%' }}
            stylesheet={cytoStyle}
            layout={layout}
            cy={handleCyInit}
          />
        </div>
      )}
    </div>
  );
}