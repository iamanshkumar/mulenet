import networkx as nx
import numpy as np

MAX_RINGS = 50  # Stop after finding this many rings

def detect_cycles(G, df):
    results, rings, counter = {}, [], 1
    
    # Find strongly connected components (SCCs)
    sccs = list(nx.strongly_connected_components(G))

    try:
        for scc in sccs:
            if len(scc) < 3:
                continue
            
            # Cap each SCC component size to 300 to prevent exponential runaway
            if len(scc) > 300:
                sub = G.subgraph(scc)
                # Keep top 300 nodes by degree in this SCC to find most significant cycles
                nodes_to_keep = sorted(scc, key=lambda n: sub.degree(n), reverse=True)[:300]
                scc_subG = sub.subgraph(nodes_to_keep)
            else:
                scc_subG = G.subgraph(scc)

            for cycle in nx.simple_cycles(scc_subG, length_bound=5):
                if len(cycle) < 3:
                    continue
                length = len(cycle)
                ring_id = f'RING_{counter:03d}'; counter += 1
                times, total_amount = [], 0
                for i in range(length):
                    src, dst = cycle[i], cycle[(i + 1) % length]
                    if scc_subG.has_edge(src, dst):
                        times.append(scc_subG[src][dst]['transactions'][0]['timestamp'])
                        total_amount += scc_subG[src][dst]['total_amount']
                
                if len(times) >= 2:
                    td = max(times) - min(times)
                    if hasattr(td, 'total_seconds'):
                        span_hrs = td.total_seconds() / 3600
                    else:
                        span_hrs = float(td / np.timedelta64(1, 'h'))
                else:
                    span_hrs = 48
                vel_mult = max(1.0, 3.0 - span_hrs / 8.0)
                base_score = min(35 * vel_mult, 50)
                pattern = f'cycle_length_{length}'
                for acc in cycle:
                    if acc not in results:
                        results[acc] = {'patterns': [], 'ring_ids': [], 'scores': []}
                    results[acc]['patterns'].append(pattern)
                    results[acc]['ring_ids'].append(ring_id)
                    results[acc]['scores'].append(base_score)
                rings.append({
                    'ring_id': ring_id,
                    'member_accounts': cycle,
                    'pattern_type': 'cycle',
                    'risk_score': round(min(base_score * 1.2, 100), 1)
                })
                if counter > MAX_RINGS:
                    break
            if counter > MAX_RINGS:
                break
    except Exception as e:
        print(f'Cycle detection capped: {e}')
    return {'accounts': results, 'rings': rings}
