import numpy as np
from scipy import stats
import pandas as pd

BENFORD = np.array([np.log10(1 + 1 / d) for d in range(1, 10)])

def benford_analysis(df, txs_by_account=None):
    results = {}
    
    # Extract unique accounts directly
    all_accounts = list(set(df['sender_id'].tolist() + df['receiver_id'].tolist()))
    
    # Initialize default results
    for acc in all_accounts:
        results[acc] = {'compliant': True, 'p_value': 1.0, 'score_delta': 0, 'pattern': None}

    # Vectorized first digit extraction mathematically
    amounts = np.abs(df['amount'].to_numpy())
    valid = amounts > 1e-9
    leading_digits = np.zeros_like(amounts, dtype=int)
    if np.any(valid):
        valid_amts = amounts[valid]
        log10_vals = np.floor(np.log10(valid_amts))
        first_digit = np.floor(valid_amts / (10**log10_vals)).astype(int)
        leading_digits[valid] = np.clip(first_digit, 1, 9)

    df_temp = pd.DataFrame({
        'sender_id': df['sender_id'],
        'receiver_id': df['receiver_id'],
        'leading_digit': leading_digits
    })

    # Vectorized counting using groupby and size
    sender_counts = df_temp.groupby(['sender_id', 'leading_digit']).size().unstack(fill_value=0)
    receiver_counts = df_temp.groupby(['receiver_id', 'leading_digit']).size().unstack(fill_value=0)

    sender_counts = sender_counts.reindex(index=all_accounts, columns=range(1, 10), fill_value=0)
    receiver_counts = receiver_counts.reindex(index=all_accounts, columns=range(1, 10), fill_value=0)
    total_counts = sender_counts + receiver_counts

    # Transaction counts per account
    tx_counts_sender = df['sender_id'].value_counts()
    tx_counts_receiver = df['receiver_id'].value_counts()
    tx_counts = tx_counts_sender.add(tx_counts_receiver, fill_value=0).reindex(all_accounts, fill_value=0).to_numpy()

    n_values = total_counts.sum(axis=1).to_numpy()
    valid_mask = (n_values >= 10) & (tx_counts >= 20)

    if np.any(valid_mask):
        obs_valid = total_counts.values[valid_mask]
        n_valid = n_values[valid_mask][:, None]
        exp_valid = np.maximum(BENFORD[None, :] * n_valid, 0.5)

        # Single vectorized chi-square call over axis 1
        _, pvals = stats.chisquare(obs_valid, exp_valid, axis=1)

        valid_indices = np.where(valid_mask)[0]
        for idx, pval in zip(valid_indices, pvals):
            acc = all_accounts[idx]
            violating = pval < 0.05
            results[acc] = {
                'compliant': not violating,
                'p_value': round(float(pval), 4),
                'score_delta': 15 if violating else -15,
                'pattern': 'benford_violation' if violating else None
            }
    return results
