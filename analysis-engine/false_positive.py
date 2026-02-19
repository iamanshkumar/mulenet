def apply_whitelist(G, df):
    whitelist = set()
    for node in G.nodes():
        in_txs  = df[df['receiver_id']==node]
        out_txs = df[df['sender_id']==node]
        # MERCHANT: many diverse customers paying similar amounts
        if len(in_txs)>=20:
            mean = in_txs['amount'].mean()
            cv   = in_txs['amount'].std()/mean if mean>0 else 0
            div  = in_txs['sender_id'].nunique()/len(in_txs)
            if div>0.6 and 0.1<cv<2.5: whitelist.add(node); continue
        # PAYROLL: equal outflows to many unique recipients
        if len(out_txs)>=10:
            mean_o = out_txs['amount'].mean()
            cv_o   = out_txs['amount'].std()/mean_o if mean_o>0 else 1
            if cv_o<0.15 and out_txs['receiver_id'].nunique()>8:
                whitelist.add(node); continue
    return whitelist
