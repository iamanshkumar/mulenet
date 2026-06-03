from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd, io, time

from graph_engine import build_graph
from detectors.cycle_detector import detect_cycles
from detectors.smurfing_detector import detect_smurfing
from detectors.shell_detector import detect_shells
from detectors.benford_detector import benford_analysis
from false_positive import apply_whitelist
from scoring import compute_scores
from lifecycle import classify_lifecycle_batch
from output_builder import build_output

import psutil
print(psutil.Process().memory_info().rss / 1024 / 1024)

# Safe GNN import — never crash if torch missing
GNN_ENABLED = False
try:
    from gnn.anomaly_scorer import compute_gnn_scores
    GNN_ENABLED = True
except ImportError:
    pass

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=['*'],
    allow_methods=['*'], allow_headers=['*'])

@app.get('/health')
async def health():
    return {'status': 'alive', 'gnn_enabled': GNN_ENABLED}

@app.post('/analyze')
async def analyze(file: UploadFile = File(...)):
    start = time.time()
    df = pd.read_csv(io.StringIO((await file.read()).decode('utf-8')))
    
    # ── Clean missing data to prevent pipeline crashes ──────────
    df = df.dropna(subset=['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp'])

    # ── Normalize timezones to naive UTC to prevent timezone errors ──
    df['timestamp'] = pd.to_datetime(df['timestamp'], utc=True).dt.tz_localize(None)

    # ── Pre-sort globally by timestamp ONCE ─────────────────────
    df = df.sort_values('timestamp')
    print(f'[{time.time()-start:.2f}s] CSV parsed, cleaned & sorted — {len(df)} rows')

    # ── Pre-compute shared lookups ONCE ─────────────────────────
    # Since df is sorted, these groups are guaranteed to be sorted chronologically!
    recv_by_account = dict(tuple(df.groupby('receiver_id')))
    sent_by_account = dict(tuple(df.groupby('sender_id')))
    money_in = {acc: grp['amount'].sum() for acc, grp in recv_by_account.items()}
    money_out = {acc: grp['amount'].sum() for acc, grp in sent_by_account.items()}

    print(f'[{time.time()-start:.2f}s] Lookups pre-computed — {len(recv_by_account) + len(sent_by_account)} accounts')

    # ── Build graph ─────────────────────────────────────────────
    G = build_graph(df)
    print(f'[{time.time()-start:.2f}s] Graph built — {G.number_of_nodes()} nodes, {G.number_of_edges()} edges')

    # ── Run detectors (passing pre-computed data) ───────────────
    cycles = detect_cycles(G, df)
    print(f'[{time.time()-start:.2f}s] Cycles detected — {len(cycles["rings"])} rings')

    smurfing = detect_smurfing(G, df, recv_by_account=recv_by_account, sent_by_account=sent_by_account)
    print(f'[{time.time()-start:.2f}s] Smurfing detected')

    shells = detect_shells(G, df, money_in=money_in, money_out=money_out,
                           recv_by_account=recv_by_account, sent_by_account=sent_by_account)
    print(f'[{time.time()-start:.2f}s] Shells detected')

    benford = benford_analysis(df)
    print(f'[{time.time()-start:.2f}s] Benford analysis done')

    whitelist = apply_whitelist(G, df)
    print(f'[{time.time()-start:.2f}s] Whitelist applied — {len(whitelist)} whitelisted')

    scored = compute_scores(G, df, cycles, smurfing, shells, benford, whitelist,
                            money_in=money_in, money_out=money_out)
    print(f'[{time.time()-start:.2f}s] Scores computed — {len(scored)} suspicious')

    # ── GNN refinement (optional) ───────────────────────────────
    if GNN_ENABLED:
        try:
            gnn_scores = compute_gnn_scores(G, df, scored)
            for acc_id, gnn_s in gnn_scores.items():
                if acc_id in scored:
                    a = scored[acc_id]['suspicion_score']
                    scored[acc_id]['suspicion_score'] = round(min(a * 0.70 + gnn_s * 100 * 0.30, 100), 1)
                    scored[acc_id]['detected_patterns'].append('gnn_anomaly')
        except Exception:
            pass

    # ── Lifecycle classification (batch) ────────────────────────
    scored = classify_lifecycle_batch(scored, df, money_in=money_in, money_out=money_out)

    total = time.time() - start
    print(f'[{total:.2f}s] ✅ Analysis complete — {len(scored)} accounts scored')
    return JSONResponse(build_output(scored, cycles['rings'], df, total))
