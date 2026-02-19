import numpy as np
from scipy import stats
import pandas as pd

BENFORD = np.array([np.log10(1 + 1 / d) for d in range(1, 10)])

def _lead_vectorized(amounts):
    """Extract leading digits from an array of amounts using string ops."""
    digits = []
    for a in amounts:
        for ch in str(abs(float(a))):
            if ch.isdigit() and ch != '0':
                digits.append(int(ch))
                break
        else:
            digits.append(0)
    return digits

def benford_analysis(df, txs_by_account=None):
    results = {}
    all_accounts = set(df['sender_id'].tolist() + df['receiver_id'].tolist())

    # Pre-compute transactions per account if not provided
    if txs_by_account is None:
        sender_groups = df.groupby('sender_id')
        receiver_groups = df.groupby('receiver_id')
        txs_by_account = {}
        for acc in all_accounts:
            parts = []
            if acc in sender_groups.groups:
                parts.append(sender_groups.get_group(acc))
            if acc in receiver_groups.groups:
                parts.append(receiver_groups.get_group(acc))
            txs_by_account[acc] = pd.concat(parts) if parts else pd.DataFrame()

    for acc in all_accounts:
        txs = txs_by_account.get(acc, pd.DataFrame())
        if len(txs) < 20:
            results[acc] = {'compliant': True, 'p_value': 1.0, 'score_delta': 0, 'pattern': None}
            continue
        digits = _lead_vectorized(txs['amount'].values)
        obs = np.zeros(9)
        for d in digits:
            if 1 <= d <= 9:
                obs[d - 1] += 1
        n = sum(obs)
        if n < 10:
            results[acc] = {'compliant': True, 'p_value': 1.0, 'score_delta': 0, 'pattern': None}
            continue
        exp = np.maximum(BENFORD * n, 0.5)
        _, pval = stats.chisquare(obs, exp)
        violating = pval < 0.05
        results[acc] = {
            'compliant': not violating,
            'p_value': round(pval, 4),
            'score_delta': 15 if violating else -15,
            'pattern': 'benford_violation' if violating else None
        }
    return results
