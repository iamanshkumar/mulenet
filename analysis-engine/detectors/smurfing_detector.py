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

    window = pd.Timedelta(hours=WINDOW_HRS)

    for account in G.nodes():
        # --- Fan-in: many unique senders → one account within 72h ---
        rcv = recv_by_account.get(account)
        if rcv is not None and len(rcv) >= FAN_THRESH:
            rcv_sorted = rcv.sort_values('timestamp')
            senders = rcv_sorted['sender_id'].values
            timestamps = rcv_sorted['timestamp'].values
            left = 0
            for right in range(len(timestamps)):
                while timestamps[right] - timestamps[left] > window:
                    left += 1
                if len(set(senders[left:right + 1])) >= FAN_THRESH:
                    res[account]['patterns'].append('fan_in')
                    res[account]['scores'].append(20)
                    break

        # --- Fan-out: one account → many unique receivers within 72h ---
        snt = sent_by_account.get(account)
        if snt is not None and len(snt) >= FAN_THRESH:
            snt_sorted = snt.sort_values('timestamp')
            receivers = snt_sorted['receiver_id'].values
            timestamps = snt_sorted['timestamp'].values
            left = 0
            for right in range(len(timestamps)):
                while timestamps[right] - timestamps[left] > window:
                    left += 1
                if len(set(receivers[left:right + 1])) >= FAN_THRESH:
                    res[account]['patterns'].append('fan_out')
                    res[account]['scores'].append(20)
                    break

        # --- Structuring: amounts just below reporting thresholds ---
        rcv_amts = rcv['amount'].values if rcv is not None else []
        snt_amts = snt['amount'].values if snt is not None else []
        all_amounts = list(rcv_amts) + list(snt_amts)
        for amt in all_amounts:
            if any(t * 0.95 <= amt < t for t in THRESHOLDS):
                res[account]['patterns'].append('below_threshold_amounts')
                res[account]['scores'].append(10)
                break

    return dict(res)
