import networkx as nx
from collections import defaultdict
 
def detect_shells(G, df):
    res = defaultdict(lambda: {'patterns':[],'scores':[]})
    # Betweenness centrality: O(V*E) — shell accounts sit on many paths
    bc = nx.betweenness_centrality(G, normalized=True)
    for node in G.nodes():
        txs       = df[(df['sender_id']==node)|(df['receiver_id']==node)]
        money_in  = df[df['receiver_id']==node]['amount'].sum()
        money_out = df[df['sender_id']==node]['amount'].sum()
        pt_ratio  = money_out/money_in if money_in>0 else 0
        if bc.get(node,0)>0.05 and len(txs)<=5 and pt_ratio>0.85:
            res[node]['patterns'].append('shell_account')
            res[node]['scores'].append(15)
        # High velocity: received AND forwarded within 6 hours
        for rt in df[df['receiver_id']==node]['timestamp']:
            for st in df[df['sender_id']==node]['timestamp']:
                if 0<=(st-rt).total_seconds()<=21600:
                    res[node]['patterns'].append('high_velocity')
                    res[node]['scores'].append(5); break
            else: continue
            break
    return dict(res)
