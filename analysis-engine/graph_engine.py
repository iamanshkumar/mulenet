import networkx as nx
import pandas as pd

def build_graph(df):
    G = nx.DiGraph()
    # Add all unique nodes at once
    all_accounts = set(df['sender_id'].tolist() + df['receiver_id'].tolist())
    G.add_nodes_from(all_accounts)

    # Use fast python list compression to create dictionaries
    records = [
        {'amount': amt, 'timestamp': ts, 'tx_id': tid}
        for amt, ts, tid in zip(df['amount'].values, df['timestamp'].values, df['transaction_id'].values)
    ]
    df_temp = df.copy()
    df_temp['tx_record'] = records

    # Single-pass pandas aggregation
    grouped = df_temp.groupby(['sender_id', 'receiver_id']).agg(
        transactions=('tx_record', list),
        total_amount=('amount', 'sum')
    )

    # Bulk add edges
    edges = [
        (s, r, {'transactions': row['transactions'], 'total_amount': row['total_amount']})
        for (s, r), row in grouped.iterrows()
    ]
    G.add_edges_from(edges)
    return G