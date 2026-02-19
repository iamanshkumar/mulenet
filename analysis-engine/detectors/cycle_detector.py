import networkx as nx

MAX_RINGS = 50  # Stop after finding this many rings

def detect_cycles(G, df):
    results, rings, counter = {}, [], 1
    # Johnson's Algorithm with length_bound to cap at 5-node cycles
    # Also stop early after MAX_RINGS to avoid runaway on dense graphs
    try:
        for cycle in nx.simple_cycles(G, length_bound=5):
            if len(cycle) < 3:
                continue
            length = len(cycle)
            ring_id = f'RING_{counter:03d}'; counter += 1
            times, total_amount = [], 0
            for i in range(length):
                src, dst = cycle[i], cycle[(i + 1) % length]
                if G.has_edge(src, dst):
                    times.append(G[src][dst]['transactions'][0]['timestamp'])
                    total_amount += G[src][dst]['total_amount']
            span_hrs = (max(times) - min(times)).total_seconds() / 3600 if len(times) >= 2 else 48
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
    except Exception as e:
        print(f'Cycle detection capped: {e}')
    return {'accounts': results, 'rings': rings}
