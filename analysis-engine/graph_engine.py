import networkx as nx
 
def build_graph(df):
    G = nx.DiGraph()
    for _, row in df.iterrows():
        s, r = row['sender_id'], row['receiver_id']
        G.add_node(s); G.add_node(r)
        tx = {'amount':row['amount'],'timestamp':row['timestamp'],'tx_id':row['transaction_id']}
        if G.has_edge(s, r):
            G[s][r]['transactions'].append(tx)
            G[s][r]['total_amount'] += row['amount']
        else:
            G.add_edge(s, r, transactions=[tx], total_amount=row['amount'])
    return G