def apply_whitelist(G, df, recv_by_account=None, sent_by_account=None):
    # Vectorized metrics aggregation
    receiver_stats = df.groupby('receiver_id').agg(
        count=('amount', 'size'),
        mean=('amount', 'mean'),
        std=('amount', 'std'),
        nunique_senders=('sender_id', 'nunique')
    )

    sender_stats = df.groupby('sender_id').agg(
        count=('amount', 'size'),
        mean=('amount', 'mean'),
        std=('amount', 'std'),
        nunique_receivers=('receiver_id', 'nunique')
    )

    # Compute coefficients of variation & diversity
    receiver_stats['cv'] = receiver_stats['std'] / receiver_stats['mean']
    receiver_stats['div'] = receiver_stats['nunique_senders'] / receiver_stats['count']
    sender_stats['cv'] = sender_stats['std'] / sender_stats['mean']

    merchant_mask = (
        (receiver_stats['count'] >= 20) &
        (receiver_stats['div'] > 0.6) &
        (receiver_stats['cv'] > 0.1) &
        (receiver_stats['cv'] < 2.5)
    )
    merchant_whitelist = set(receiver_stats[merchant_mask].index)

    payroll_mask = (
        (sender_stats['count'] >= 10) &
        (sender_stats['cv'] < 0.15) &
        (sender_stats['nunique_receivers'] > 8)
    )
    payroll_whitelist = set(sender_stats[payroll_mask].index)

    return merchant_whitelist.union(payroll_whitelist)
