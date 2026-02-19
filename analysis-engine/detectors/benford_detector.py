import numpy as np
from scipy import stats
 
BENFORD = np.array([np.log10(1+1/d) for d in range(1,10)])
 
def _lead(n):
    for ch in str(abs(float(n))):
        if ch.isdigit() and ch!='0': return int(ch)
    return None
 
def benford_analysis(df):
    results = {}
    for acc in set(df['sender_id'].tolist()+df['receiver_id'].tolist()):
        txs = df[(df['sender_id']==acc)|(df['receiver_id']==acc)]
        if len(txs)<20:
            results[acc]={'compliant':True,'p_value':1.0,'score_delta':0,'pattern':None}
            continue
        digits = [_lead(a) for a in txs['amount'] if _lead(a)]
        obs = np.zeros(9)
        for d in digits:
            if 1<=d<=9: obs[d-1]+=1
        exp = np.where(BENFORD*len(digits)<0.5, 0.5, BENFORD*len(digits))
        _, pval = stats.chisquare(obs, exp)
        violating = pval<0.05
        results[acc]={'compliant':not violating,'p_value':round(pval,4),
            'score_delta':15 if violating else -15,
            'pattern':'benford_violation' if violating else None}
    return results
