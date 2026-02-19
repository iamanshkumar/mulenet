def compute_scores(G, df, cycles, smurfing, shells, benford, whitelist, money_in=None, money_out=None):
    # Pre-compute money flows if not provided
    if money_in is None:
        money_in = df.groupby('receiver_id')['amount'].sum().to_dict()
    if money_out is None:
        money_out = df.groupby('sender_id')['amount'].sum().to_dict()

    suspicious = {}
    for account in G.nodes():
        if account in whitelist:
            continue
        score, patterns, ring_ids = 0, [], []
        if account in cycles['accounts']:
            c = cycles['accounts'][account]
            score += sum(c['scores'])
            patterns += c['patterns']
            ring_ids += c['ring_ids']
        if account in smurfing:
            score += sum(smurfing[account]['scores'])
            patterns += smurfing[account]['patterns']
        if account in shells:
            score += sum(shells[account]['scores'])
            patterns += shells[account]['patterns']
        if account in benford:
            b = benford[account]
            score += b['score_delta']
            if b['pattern']:
                patterns.append(b['pattern'])

        # Multipliers
        if len(set(patterns)) >= 2:
            score *= 1.3
        mi = money_in.get(account, 0)
        mo = money_out.get(account, 0)
        if mi > 0 and mo / mi > 0.95:
            score *= 1.2
        if len(set(ring_ids)) > 1:
            score *= 1.3
            patterns.append('super_node')

        if score >= 10:
            suspicious[account] = {
                'account_id': account,
                'suspicion_score': round(min(score, 100), 1),
                'detected_patterns': list(dict.fromkeys(patterns)),
                'ring_id': ring_ids[0] if ring_ids else 'RING_NONE'
            }

    return dict(sorted(suspicious.items(), key=lambda x: x[1]['suspicion_score'], reverse=True))
