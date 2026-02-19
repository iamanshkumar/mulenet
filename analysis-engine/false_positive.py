def apply_whitelist(G, df, recv_by_account=None, sent_by_account=None):
    whitelist = set()

    # Pre-group if not provided
    if recv_by_account is None:
        recv_by_account = dict(tuple(df.groupby('receiver_id')))
    if sent_by_account is None:
        sent_by_account = dict(tuple(df.groupby('sender_id')))

    for node in G.nodes():
        in_txs = recv_by_account.get(node, None)
        out_txs = sent_by_account.get(node, None)

        # MERCHANT: many diverse customers paying similar amounts
        if in_txs is not None and len(in_txs) >= 20:
            mean = in_txs['amount'].mean()
            cv = in_txs['amount'].std() / mean if mean > 0 else 0
            div = in_txs['sender_id'].nunique() / len(in_txs)
            if div > 0.6 and 0.1 < cv < 2.5:
                whitelist.add(node)
                continue

        # PAYROLL: equal outflows to many unique recipients
        if out_txs is not None and len(out_txs) >= 10:
            mean_o = out_txs['amount'].mean()
            cv_o = out_txs['amount'].std() / mean_o if mean_o > 0 else 1
            if cv_o < 0.15 and out_txs['receiver_id'].nunique() > 8:
                whitelist.add(node)
                continue

    return whitelist
