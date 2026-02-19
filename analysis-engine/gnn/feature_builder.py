import torch, networkx as nx
from torch_geometric.data import Data
 
def build_pyg_graph(G, df, scored):
    nodes = list(G.nodes())
    idx   = {n:i for i,n in enumerate(nodes)}
    bc    = nx.betweenness_centrality(G, normalized=True)
    feats = []
    for node in nodes:
        mi = df[df['receiver_id']==node]['amount'].sum()
        mo = df[df['sender_id']==node]['amount'].sum()
        nt = len(df[(df['sender_id']==node)|(df['receiver_id']==node)])
        pt = mo/mi if mi>0 else 0
        feats.append([G.in_degree(node), G.out_degree(node), bc.get(node,0), pt,
                      min(mi,1e9)/1e7, min(mo,1e9)/1e7, min(nt,1000)/100,
                      1 if node in scored else 0,
                      scored.get(node,{}).get('suspicion_score',0)/100])
    edges = [(idx[u],idx[v]) for u,v in G.edges()]
    if not edges: edges=[(0,0)]
    return Data(x=torch.tensor(feats,dtype=torch.float),
                edge_index=torch.tensor(edges,dtype=torch.long).t().contiguous()), idx
