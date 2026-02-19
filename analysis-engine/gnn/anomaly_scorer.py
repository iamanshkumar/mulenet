import torch, numpy as np
import torch.nn.functional as F
from torch_geometric.utils import negative_sampling
from .graph_sage import GraphSAGE
from .feature_builder import build_pyg_graph
 
def compute_gnn_scores(G, df, scored, epochs=80):
    data, idx = build_pyg_graph(G, df, scored)
    model     = GraphSAGE(in_ch=data.x.shape[1])
    opt       = torch.optim.Adam(model.parameters(), lr=0.005)
    model.train()
    for _ in range(epochs):
        opt.zero_grad()
        z = model(data.x, data.edge_index)
        pos = (z[data.edge_index[0]]*z[data.edge_index[1]]).sum(1)
        neg_ei = negative_sampling(data.edge_index, data.x.size(0))
        neg = (z[neg_ei[0]]*z[neg_ei[1]]).sum(1)
        loss = -torch.log(torch.sigmoid(pos)+1e-9).mean()\
               -torch.log(1-torch.sigmoid(neg)+1e-9).mean()
        loss.backward(); opt.step()
    model.eval()
    with torch.no_grad(): emb = model(data.x, data.edge_index).numpy()
    flagged = [idx[n] for n in scored if n in idx]
    if not flagged: return {}
    centroid = emb[flagged].mean(0)
    return {node: float(np.exp(-np.linalg.norm(emb[i]-centroid)/10))
            for node,i in idx.items()}
