import torch, torch.nn.functional as F
from torch_geometric.nn import SAGEConv
class GraphSAGE(torch.nn.Module):
    def __init__(self, in_ch=9, hidden=64, out_ch=32):
        super().__init__()
        self.c1 = SAGEConv(in_ch, hidden)
        self.c2 = SAGEConv(hidden, out_ch)
    def forward(self, x, ei):
        x = F.relu(self.c1(x, ei))
        return self.c2(F.dropout(x,p=0.3,training=self.training), ei)
