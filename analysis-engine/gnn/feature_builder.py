import torch, networkx as nx
from torch_geometric.data import Data
 
def build_pyg_graph(G, df, scored):
    nodes = list(G.nodes())
    idx   = {n:i for i,n in enumerate(nodes)}
    
    # Use k=100 approximation for betweenness centrality to avoid O(V*E) hang
    k_val = 100 if G.number_of_nodes() >= 100 else None
    bc    = nx.betweenness_centrality(G, k=k_val, normalized=True)
    
    # Precompute aggregations globally to avoid dataframe filtering in a loop
    money_in = df.groupby('receiver_id')['amount'].sum().to_dict()
    money_out = df.groupby('sender_id')['amount'].sum().to_dict()
    
    tx_counts_sender = df['sender_id'].value_counts()
    tx_counts_receiver = df['receiver_id'].value_counts()
    tx_counts = tx_counts_sender.add(tx_counts_receiver, fill_value=0).to_dict()

    feats = []
    for node in nodes:
        mi = money_in.get(node, 0.0)
        mo = money_out.get(node, 0.0)
        nt = tx_counts.get(node, 0)
        pt = mo/mi if mi>0 else 0.0
        feats.append([G.in_degree(node), G.out_degree(node), bc.get(node,0), pt,
                      min(mi,1e9)/1e7, min(mo,1e9)/1e7, min(nt,1000)/100,
                      1 if node in scored else 0,
                      scored.get(node,{}).get('suspicion_score',0)/100])
    edges = [(idx[u],idx[v]) for u,v in G.edges()]
    if not edges: edges=[(0,0)]
    return Data(x=torch.tensor(feats,dtype=torch.float),
                edge_index=torch.tensor(edges,dtype=torch.long).t().contiguous()), idx
