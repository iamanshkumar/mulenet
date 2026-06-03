import pandas as pd
import time
from graph_engine import build_graph
from detectors.cycle_detector import detect_cycles
from detectors.smurfing_detector import detect_smurfing
from detectors.shell_detector import detect_shells
from detectors.benford_detector import benford_analysis
from false_positive import apply_whitelist
from scoring import compute_scores
from lifecycle import classify_lifecycle_batch
from output_builder import build_output

print("Loading data...", flush=True)
df = pd.read_csv('../test-data/test6_10k_stress.csv')
df['timestamp'] = pd.to_datetime(df['timestamp'])

recv_by_account = dict(tuple(df.groupby('receiver_id')))
sent_by_account = dict(tuple(df.groupby('sender_id')))
money_in = {acc: grp['amount'].sum() for acc, grp in recv_by_account.items()}
money_out = {acc: grp['amount'].sum() for acc, grp in sent_by_account.items()}
all_accounts = set(df['sender_id'].tolist() + df['receiver_id'].tolist())
txs_by_account = {}
for acc in all_accounts:
    parts = []
    if acc in recv_by_account:
        parts.append(recv_by_account[acc])
    if acc in sent_by_account:
        parts.append(sent_by_account[acc])
    txs_by_account[acc] = pd.concat(parts) if parts else pd.DataFrame()

print("Building graph...", flush=True)
t = time.time()
G = build_graph(df)
print(f"Done in {time.time() - t:.2f}s", flush=True)

print("Detecting cycles...", flush=True)
t = time.time()
cycles = detect_cycles(G, df)
print(f"Done in {time.time() - t:.2f}s", flush=True)

print("Detecting smurfing...", flush=True)
t = time.time()
smurfing = detect_smurfing(G, df, recv_by_account=recv_by_account, sent_by_account=sent_by_account)
print(f"Done in {time.time() - t:.2f}s", flush=True)

print("Detecting shells...", flush=True)
t = time.time()
shells = detect_shells(G, df, money_in=money_in, money_out=money_out, recv_by_account=recv_by_account, sent_by_account=sent_by_account)
print(f"Done in {time.time() - t:.2f}s", flush=True)

print("Benford analysis...", flush=True)
t = time.time()
benford = benford_analysis(df, txs_by_account=txs_by_account)
print(f"Done in {time.time() - t:.2f}s", flush=True)

print("Whitelist...", flush=True)
t = time.time()
whitelist = apply_whitelist(G, df, recv_by_account=recv_by_account, sent_by_account=sent_by_account)
print(f"Done in {time.time() - t:.2f}s", flush=True)

print("Scores...", flush=True)
t = time.time()
scored = compute_scores(G, df, cycles, smurfing, shells, benford, whitelist, money_in=money_in, money_out=money_out)
print(f"Done in {time.time() - t:.2f}s", flush=True)

print("Lifecycle...", flush=True)
t = time.time()
scored = classify_lifecycle_batch(scored, df, money_in=money_in, money_out=money_out)
print(f"Done in {time.time() - t:.2f}s", flush=True)

print("Done!", flush=True)
