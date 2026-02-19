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
from lifecycle import classify_lifecycle
from output_builder import build_output
 
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
    df['timestamp'] = pd.to_datetime(df['timestamp'])
 
    G        = build_graph(df)
    cycles   = detect_cycles(G, df)
    smurfing = detect_smurfing(G, df)
    shells   = detect_shells(G, df)
    benford  = benford_analysis(df)
    whitelist = apply_whitelist(G, df)
    scored   = compute_scores(G, df, cycles, smurfing, shells, benford, whitelist)
 
    # GNN refinement — parallel track bonus
    if GNN_ENABLED:
        try:
            gnn_scores = compute_gnn_scores(G, df, scored)
            for acc_id, gnn_s in gnn_scores.items():
                if acc_id in scored:
                    a = scored[acc_id]['suspicion_score']
                    scored[acc_id]['suspicion_score'] = round(min(a*0.70 + gnn_s*100*0.30, 100), 1)
                    scored[acc_id]['detected_patterns'].append('gnn_anomaly')
        except Exception:
            pass
 
    for acc_id in scored:
        scored[acc_id]['lifecycle_stage'] = classify_lifecycle(acc_id, df)
 
    return JSONResponse(build_output(scored, cycles['rings'], df, time.time()-start))
