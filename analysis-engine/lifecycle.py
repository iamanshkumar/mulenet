import pandas as pd

def classify_lifecycle_batch(scored, df, money_in=None, money_out=None):
    """Classify lifecycle stage for all scored accounts in one pass."""
    if money_in is None:
        money_in = df.groupby('receiver_id')['amount'].sum().to_dict()
    if money_out is None:
        money_out = df.groupby('sender_id')['amount'].sum().to_dict()

    ts_min = df['timestamp'].min()
    ts_max = df['timestamp'].max()
    span = (ts_max - ts_min).total_seconds()

    # Pre-compute last transaction time per account
    last_send = df.groupby('sender_id')['timestamp'].max().to_dict()
    last_recv = df.groupby('receiver_id')['timestamp'].max().to_dict()
    tx_count_send = df.groupby('sender_id').size().to_dict()
    tx_count_recv = df.groupby('receiver_id').size().to_dict()

    for acc_id in scored:
        mi = money_in.get(acc_id, 0)
        mo = money_out.get(acc_id, 0)
        last_s = last_send.get(acc_id, pd.Timestamp.min)
        last_r = last_recv.get(acc_id, pd.Timestamp.min)
        last = max(last_s, last_r)
        tx_count = tx_count_send.get(acc_id, 0) + tx_count_recv.get(acc_id, 0)

        last_pct = (last - ts_min).total_seconds() / span if span > 0 else 1

        if last_pct < 0.70 and tx_count > 5:
            scored[acc_id]['lifecycle_stage'] = 'Stage 4: Dormant/Burned Mule'
        elif mi > 0 and mo / mi < 0.10:
            scored[acc_id]['lifecycle_stage'] = 'Stage 3: Cash-Out Node'
        elif mi > 0 and mo / mi > 0.80:
            scored[acc_id]['lifecycle_stage'] = 'Stage 2: Active Layering Mule'
        else:
            scored[acc_id]['lifecycle_stage'] = 'Stage 1: Newly Activated Mule'

    return scored


# Keep backward-compatible single-account function
def classify_lifecycle(account, df):
    txs = df[(df['sender_id'] == account) | (df['receiver_id'] == account)]
    if txs.empty:
        return 'unknown'
    mi = df[df['receiver_id'] == account]['amount'].sum()
    mo = df[df['sender_id'] == account]['amount'].sum()
    last = txs['timestamp'].max()
    span = (df['timestamp'].max() - df['timestamp'].min()).total_seconds()
    last_pct = (last - df['timestamp'].min()).total_seconds() / span if span > 0 else 1
    if last_pct < 0.70 and len(txs) > 5:
        return 'Stage 4: Dormant/Burned Mule'
    if mi > 0 and mo / mi < 0.10:
        return 'Stage 3: Cash-Out Node'
    if mi > 0 and mo / mi > 0.80:
        return 'Stage 2: Active Layering Mule'
    return 'Stage 1: Newly Activated Mule'
