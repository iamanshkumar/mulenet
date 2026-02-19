import CytoscapeComponent from 'react-cytoscapejs'
 
const nodeColor = s => s>=80?'#e63946':s>=50?'#f4a261':s>=20?'#ffd166':'#4a5568'
const nodeSize  = s => s>=80?65:s>=50?50:s>=20?38:26
 
export default function GraphPanel({ analysisData, onNodeClick }) {
  const scoreMap = Object.fromEntries(
    analysisData.suspicious_accounts.map(a => [a.account_id, a])
  )
 
  const elements = analysisData.suspicious_accounts.map(acc => ({
    group: 'nodes',
    data: { id:acc.account_id, label:acc.account_id, ...acc },
    style: {
      'background-color': acc.detected_patterns?.includes('super_node')
        ? '#FFD700' : nodeColor(acc.suspicion_score),
      width: nodeSize(acc.suspicion_score),
      height: nodeSize(acc.suspicion_score),
      'border-color': '#ffffff', 'border-width': 2,
      shape: acc.detected_patterns?.includes('super_node') ? 'star' : 'ellipse'
    }
  }))
 
  const stylesheet = [
    { selector:'node', style:{ label:'data(label)', 'text-valign':'bottom',
      'font-size':'9px', color:'#e6edf3',
      'text-outline-color':'#0d1117','text-outline-width':2 }},
    { selector:'node:selected', style:{'border-color':'#58a6ff','border-width':5 }},
    { selector:'edge', style:{ 'curve-style':'bezier',
      'target-arrow-shape':'triangle','line-color':'#30363d',
      'target-arrow-color':'#30363d', width:1.5, opacity:0.7 }}
  ]
 
  return (
    <div className='rounded-xl overflow-hidden border border-brand-border'>
      <CytoscapeComponent elements={elements} stylesheet={stylesheet}
        style={{ width:'100%', height:'540px', background:'#0d1117' }}
        layout={{ name:'cose', idealEdgeLength:130, animate:true }}
        cy={cy => cy.on('tap','node', evt => {
          const d = evt.target.data()
          if (scoreMap[d.id]) onNodeClick(scoreMap[d.id])
        })} />
    </div>
  )
}
