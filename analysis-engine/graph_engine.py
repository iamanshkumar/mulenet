import networkx as nx
import pandas as pd

def build_graph(df):
    G = nx.DiGraph()
    # Add all unique nodes at once
    all_accounts = set(df['sender_id'].tolist() + df['receiver_id'].tolist())
    G.add_nodes_from(all_accounts)

    # Group by (sender, receiver) pairs for bulk edge creation
    grouped = df.groupby(['sender_id', 'receiver_id'])
    for (s, r), group in grouped:
        txs = group.apply(
            lambda row: {
                'amount': row['amount'],
                'timestamp': row['timestamp'],
                'tx_id': row['transaction_id']
            }, axis=1
        ).tolist()
        G.add_edge(s, r,
                   transactions=txs,
                   total_amount=group['amount'].sum())
    return G