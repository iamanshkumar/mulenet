def classify_lifecycle(account, df):
    txs = df[(df['sender_id']==account)|(df['receiver_id']==account)]
    if txs.empty: return 'unknown'
    mi = df[df['receiver_id']==account]['amount'].sum()
    mo = df[df['sender_id']==account]['amount'].sum()
    last = txs['timestamp'].max()
    span = (df['timestamp'].max()-df['timestamp'].min()).total_seconds()
    last_pct = (last-df['timestamp'].min()).total_seconds()/span if span>0 else 1
    if last_pct<0.70 and len(txs)>5: return 'Stage 4: Dormant/Burned Mule'
    if mi>0 and mo/mi<0.10:         return 'Stage 3: Cash-Out Node'
    if mi>0 and mo/mi>0.80:         return 'Stage 2: Active Layering Mule'
    return 'Stage 1: Newly Activated Mule'
