def build_output(scored, rings, df, processing_time):
    all_accs = set(df['sender_id'].tolist() + df['receiver_id'].tolist())
    return {
        'suspicious_accounts': [{
            'account_id': v['account_id'],
            'suspicion_score': v['suspicion_score'],
            'detected_patterns': v['detected_patterns'],
            'ring_id': v['ring_id'],
            'lifecycle_stage': v.get('lifecycle_stage', 'Unknown'),
        } for v in scored.values()],
        'fraud_rings': [{
            'ring_id': r['ring_id'],
            'member_accounts': r['member_accounts'],
            'pattern_type': r['pattern_type'],
            'risk_score': r['risk_score'],
        } for r in rings],
        'summary': {
            'total_accounts_analyzed': len(all_accs),
            'suspicious_accounts_flagged': len(scored),
            'fraud_rings_detected': len(rings),
            'processing_time_seconds': round(processing_time, 2),
        }
    }
