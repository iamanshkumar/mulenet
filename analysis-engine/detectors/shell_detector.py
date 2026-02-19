import networkx as nx
import numpy as np
from collections import defaultdict

def detect_shells(G, df, money_in=None, money_out=None,
                  recv_by_account=None, sent_by_account=None):
    res = defaultdict(lambda: {'patterns': [], 'scores': []})

    # Pre-compute if not provided
    if money_in is None:
        money_in = df.groupby('receiver_id')['amount'].sum().to_dict()
    if money_out is None:
        money_out = df.groupby('sender_id')['amount'].sum().to_dict()
    if recv_by_account is None:
        recv_by_account = dict(tuple(df.groupby('receiver_id')))
    if sent_by_account is None:
        sent_by_account = dict(tuple(df.groupby('sender_id')))

    # Betweenness centrality: O(V*E)
    bc = nx.betweenness_centrality(G, normalized=True)

    # Pre-compute tx counts per node
    recv_counts = df.groupby('receiver_id').size().to_dict()
    send_counts = df.groupby('sender_id').size().to_dict()

    for node in G.nodes():
        mi = money_in.get(node, 0)
        mo = money_out.get(node, 0)
        tx_count = recv_counts.get(node, 0) + send_counts.get(node, 0)
        pt_ratio = mo / mi if mi > 0 else 0

        if bc.get(node, 0) > 0.05 and tx_count <= 5 and pt_ratio > 0.85:
            res[node]['patterns'].append('shell_account')
            res[node]['scores'].append(15)

        # High velocity: received AND forwarded within 6 hours
        # Vectorized with NumPy broadcasting
        recv_df = recv_by_account.get(node)
        send_df = sent_by_account.get(node)

        if recv_df is not None and send_df is not None and len(recv_df) > 0 and len(send_df) > 0:
            recv_s = recv_df['timestamp'].values.astype('int64') // 10**9
            send_s = send_df['timestamp'].values.astype('int64') // 10**9
            # Limit array sizes for very high-volume nodes (merchants)
            if len(recv_s) <= 500 and len(send_s) <= 500:
                diffs = send_s[:, None] - recv_s[None, :]
                if np.any((diffs >= 0) & (diffs <= 21600)):
                    res[node]['patterns'].append('high_velocity')
                    res[node]['scores'].append(5)
            else:
                # For high-volume nodes, sample to keep fast
                r_sample = np.sort(recv_s)[-100:]
                s_sample = np.sort(send_s)[:100]
                diffs = s_sample[:, None] - r_sample[None, :]
                if np.any((diffs >= 0) & (diffs <= 21600)):
                    res[node]['patterns'].append('high_velocity')
                    res[node]['scores'].append(5)

    return dict(res)
