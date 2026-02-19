import pandas as pd
from collections import defaultdict
 
WINDOW_HRS  = 72
FAN_THRESH  = 10
THRESHOLDS  = [10000,25000,50000,100000,200000,500000]
 
def detect_smurfing(G, df):
    res = defaultdict(lambda: {'patterns':[],'scores':[]})
    df_s = df.sort_values('timestamp')
    for account in G.nodes():
        # Fan-in: many unique senders → one account within 72h
        rcv = df_s[df_s['receiver_id']==account]
        for _, tx in rcv.iterrows():
            w = rcv[(rcv['timestamp']>=tx['timestamp']-pd.Timedelta(hours=WINDOW_HRS))
                   &(rcv['timestamp']<=tx['timestamp'])]
            if w['sender_id'].nunique()>=FAN_THRESH:
                res[account]['patterns'].append('fan_in')
                res[account]['scores'].append(20); break
        # Fan-out: one account → many unique receivers within 72h
        snt = df_s[df_s['sender_id']==account]
        for _, tx in snt.iterrows():
            w = snt[(snt['timestamp']>=tx['timestamp'])
                   &(snt['timestamp']<=tx['timestamp']+pd.Timedelta(hours=WINDOW_HRS))]
            if w['receiver_id'].nunique()>=FAN_THRESH:
                res[account]['patterns'].append('fan_out')
                res[account]['scores'].append(20); break
        # Structuring: amounts just below reporting thresholds
        all_txs = df_s[(df_s['sender_id']==account)|(df_s['receiver_id']==account)]
        for _, tx in all_txs.iterrows():
            if any(t*(1-0.05)<=tx['amount']<t for t in THRESHOLDS):
                if 'below_threshold_amounts' not in res[account]['patterns']:
                         res[account]['patterns'].append('below_threshold_amounts')
                         res[account]['scores'].append(10); break
        return dict(res)
