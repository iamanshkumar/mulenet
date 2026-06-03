import pandas as pd
from collections import defaultdict

WINDOW_HRS = 72
FAN_THRESH = 10
THRESHOLDS = [10000, 25000, 50000, 100000, 200000, 500000]

def detect_smurfing(G, df, recv_by_account=None, sent_by_account=None):
    res = defaultdict(lambda: {'patterns': [], 'scores': []})

    # Use pre-grouped data if available
    if recv_by_account is None:
        recv_by_account = dict(tuple(df.groupby('receiver_id')))
    if sent_by_account is None:
        sent_by_account = dict(tuple(df.groupby('sender_id')))

    window_sec = WINDOW_HRS * 3600

    # 1. Vectorized structuring check over the entire DataFrame
    matching_mask = pd.Series(False, index=df.index)
    for t in THRESHOLDS:
        matching_mask |= (df['amount'] >= t * 0.95) & (df['amount'] < t)
    structuring_accounts = set(df[matching_mask]['sender_id'].tolist() + df[matching_mask]['receiver_id'].tolist())

    for account in G.nodes():
        # --- Fan-in (rolling sliding window) ---
        rcv = recv_by_account.get(account)
        if rcv is not None and len(rcv) >= FAN_THRESH:
            # Assumes rcv is sorted by timestamp (pre-sorted at pipeline level)
            senders = rcv['sender_id'].values
            timestamps_sec = rcv['timestamp'].values.astype('int64') // 10**9
            
            left = 0
            counts = {}
            unique_count = 0
            for right in range(len(timestamps_sec)):
                c_right = senders[right]
                counts[c_right] = counts.get(c_right, 0) + 1
                if counts[c_right] == 1:
                    unique_count += 1
                
                while timestamps_sec[right] - timestamps_sec[left] > window_sec:
                    c_left = senders[left]
                    counts[c_left] -= 1
                    if counts[c_left] == 0:
                        unique_count -= 1
                    left += 1

                if unique_count >= FAN_THRESH:
                    res[account]['patterns'].append('fan_in')
                    res[account]['scores'].append(20)
                    break

        # --- Fan-out (rolling sliding window) ---
        snt = sent_by_account.get(account)
        if snt is not None and len(snt) >= FAN_THRESH:
            # Assumes snt is sorted by timestamp (pre-sorted at pipeline level)
            receivers = snt['receiver_id'].values
            timestamps_sec = snt['timestamp'].values.astype('int64') // 10**9

            left = 0
            counts = {}
            unique_count = 0
            for right in range(len(timestamps_sec)):
                c_right = receivers[right]
                counts[c_right] = counts.get(c_right, 0) + 1
                if counts[c_right] == 1:
                    unique_count += 1

                while timestamps_sec[right] - timestamps_sec[left] > window_sec:
                    c_left = receivers[left]
                    counts[c_left] -= 1
                    if counts[c_left] == 0:
                        unique_count -= 1
                    left += 1

                if unique_count >= FAN_THRESH:
                    res[account]['patterns'].append('fan_out')
                    res[account]['scores'].append(20)
                    break

        # --- Structuring ---
        if account in structuring_accounts:
            res[account]['patterns'].append('below_threshold_amounts')
            res[account]['scores'].append(10)

    return dict(res)
