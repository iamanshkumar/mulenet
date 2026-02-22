<p align="center">
  <img src="https://img.shields.io/badge/RIFT_2026-Graph_Theory_Track-e63946?style=for-the-badge&logo=graphql&logoColor=white" />
  <img src="https://img.shields.io/badge/Status-Live-3fb950?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/License-MIT-58a6ff?style=for-the-badge" />
</p>

<h1 align="center">🕸️ MuleNet — Financial Forensics Engine</h1>

<p align="center">
  <em>"Follow the money. Expose the network."</em>
</p>

---

## 📋 Overview

**MuleNet** is a graph-theory-powered financial forensics engine that detects **money muling networks** in transaction datasets. It combines **Johnson's cycle detection**, **Benford's Law analysis**, **smurfing detection**, **shell account identification**, and a **GraphSAGE GNN layer** to produce explainable suspicion scores, interactive network visualizations, and AI-generated SAR narratives — all within a single investigation dashboard.

Built for the **RIFT 2026 Hackathon** (Financial Crime Detection / Graph Theory Track), MuleNet processes **10,000 transactions in under 30 seconds** with **≥70% precision**, **≥60% recall**, and **zero false positives** on merchant/payroll trap datasets.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS v4 | SPA with dark/light theme |
| **Graph Visualization** | Cytoscape.js | Interactive network with risk-coded nodes |
| **Charts** | Recharts | Score distribution, lifecycle, patterns |
| **Backend API** | Node.js, Express | REST gateway, file proxy, narrative API |
| **Database** | MongoDB Atlas, Mongoose | Analysis history persistence |
| **Analysis Engine** | Python 3.11, FastAPI | Core detection pipeline |
| **Graph Algorithms** | NetworkX | Directed graph, Johnson's cycles, centrality |
| **Statistics** | SciPy, pandas | Benford's Law chi-square, temporal analysis |
| **GNN (Bonus)** | PyTorch, PyTorch Geometric | GraphSAGE unsupervised anomaly detection |
| **AI Narratives** | Groq API (llama-3.1-8b-instant) | SAR-ready investigator narratives |
| **Deployment** | Vercel (frontend), Railway (API + Python) | Production hosting |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────┐
│     React Frontend (Vite + Tailwind CSS)     │
│  Cytoscape.js graph · Recharts · Dark/Light  │
└─────────────────────┬────────────────────────┘
                      │ POST /api/analyze (CSV upload)
                      ▼
┌──────────────────────────────────────────────┐
│   Node.js + Express API Gateway (Railway)    │
│  /api/analyze · /api/narrative · /api/history│
└──────────┬───────────────────┬───────────────┘
           │ stores result     │ forwards CSV
           ▼                   ▼
┌────────────────┐  ┌─────────────────────────────────────┐
│  MongoDB Atlas │  │  Python FastAPI Analysis Engine      │
│                │  │          (Railway)                   │
│  analyses      │  │                                     │
│  ├─ filename   │  │  ├── NetworkX Graph Construction    │
│  ├─ result     │  │  ├── Johnson's Algorithm —          │
│  ├─ summary    │  │  │   Cycle Detection (len 3-5)      │
│  └─ uploadedAt │  │  ├── 72hr Temporal Smurfing         │
│                │  │  │   Detector                       │
└────────────────┘  │  ├── Betweenness Centrality         │
                    │  │   Shell Detector                  │
                    │  ├── Benford's Law Chi-Square Test   │
                    │  ├── False Positive Whitelist Filter │
                    │  ├── Suspicion Scoring Engine        │
                    │  └── GraphSAGE GNN Layer (bonus)     │
                    └─────────────────────────────────────┘
```

### Data Flow

1. User uploads CSV → **React frontend** sends `POST /api/analyze` with `multipart/form-data`
2. **Express API** forwards the file to **Python FastAPI** engine
3. Python builds a **NetworkX DiGraph** and runs all detectors in sequence
4. Results (scored accounts, fraud rings, summary) returned to Express
5. Express **stores in MongoDB** and returns JSON + `analysis_id` to frontend
6. Frontend renders **interactive Cytoscape graph**, investigator panel, analytics

---

## 🔍 Algorithm Approach

### 1. Cycle Detection — Johnson's Algorithm

```
Complexity: O((V + E)(C + 1))  where C = number of elementary cycles
```

Enumerates all **simple cycles of length 3–5** in the directed transaction graph using `networkx.simple_cycles()`. Circular money flow (A → B → C → A) is the primary signature of **layering in money muling networks**. A velocity multiplier increases scores for cycles completed within short timeframes.

### 2. Smurfing Detection — 72-Hour Temporal Sliding Window

```
Complexity: O(N log N)  where N = number of transactions (sort + sliding window)
```

Analyzes **fan-in** and **fan-out** patterns within a 72-hour sliding window. Flags accounts with ≥10 unique counterparties within the window, indicating **structuring** — splitting large sums into many small transfers to evade reporting thresholds. Also detects transaction amounts clustering just below regulatory limits.

### 3. Shell Account Detection — Betweenness Centrality

```
Complexity: O(V × E)  for betweenness centrality computation
```

Computes `networkx.betweenness_centrality()` for all nodes. Accounts with **high centrality** and **pass-through ratio > 85%** (money_out / money_in) are flagged as shell accounts — entities existing solely to relay funds without economic purpose.

### 4. Benford's Law Analysis — Chi-Square Goodness-of-Fit

```
Complexity: O(N)  per account, where N = number of transactions
```

Compares the **leading digit distribution** of each account's transaction amounts against Benford's expected distribution using `scipy.stats.chisquare()`. A **p-value < 0.05** flags a violation, indicating fabricated or manipulated amounts — organic financial data follows Benford's distribution.

### 5. False Positive Whitelist Filter

```
Complexity: O(N)  single pass per account
```

Prevents legitimate accounts from being flagged:

| Filter | Logic | Result |
|---|---|---|
| **Merchant** | High sender diversity + high amount variance | Score = 0 |
| **Payroll** | Many receivers + low outflow amount std dev | Score = 0 |

### 6. GraphSAGE GNN Layer (Bonus)

```
Architecture: 2-layer SAGEConv, hidden dim 64, mean aggregation
Training: Unsupervised with negative sampling (no labels required)
Fusion: final_score = 0.70 × algorithmic + 0.30 × gnn_anomaly
```

Learns **structural node embeddings** without labeled data. Nodes with anomalous neighborhood patterns (unusual in/out degree, centrality, flow ratios) receive high anomaly scores. Combined with rule-based signals via weighted fusion to catch patterns invisible to individual detectors.

---

## 📊 Suspicion Score Methodology

### Base Signals

| Signal | Points | Trigger Condition |
|---|:---:|---|
| Cycle membership | **+35** | Account found in a cycle of length 3–5 (× velocity multiplier) |
| Fan-in pattern | **+20** | ≥10 unique senders within 72-hour window |
| Fan-out pattern | **+20** | ≥10 unique receivers within 72-hour window |
| Shell account | **+15** | High betweenness centrality + pass-through > 85% |
| Benford's violation | **+15** | Leading digit chi-square test p < 0.05 |
| Below-threshold amounts | **+10** | Amounts cluster just below reporting limits |
| High velocity | **+5** | Abnormally rapid transaction frequency |

### Multipliers

| Condition | Multiplier |
|---|:---:|
| Multi-pattern (≥3 signals) | **×1.3** |
| Pass-through > 95% | **×1.2** |
| Super node (fan-in + fan-out) | **×1.3** |

### Score Fusion

```
raw_score = sum(base_signals) × product(applicable_multipliers)
final_score = clamp(0.70 × raw_score + 0.30 × gnn_anomaly_score, 0, 100)
```

Merchant and payroll whitelisted accounts are **excluded entirely** (score = 0).

### Mule Lifecycle Classification

| Stage | Name | Criteria |
|---|---|---|
| 🆕 Stage 1 | Newly Activated Mule | Recent activity, low txn count, doesn't match other stages |
| ⚡ Stage 2 | Active Layering Mule | money_out / money_in > 70% |
| 💰 Stage 3 | Cash-Out Node | money_out / money_in < 15% |
| 💤 Stage 4 | Dormant/Burned Mule | Last activity in first 70% of timeline, >3 txns |

---

## � Installation & Setup

### Prerequisites

- **Node.js** ≥ 18.x &nbsp;|&nbsp; **Python** ≥ 3.10 &nbsp;|&nbsp; **MongoDB** Atlas or local &nbsp;|&nbsp; **npm** ≥ 9.x

### 1. Clone

```bash
git clone https://github.com/your-username/mulenet.git
cd mulenet
```

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
```

```bash
npm run dev    # → http://localhost:5173
```

### 3. Backend API

```bash
cd api
npm install
```

Create `api/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/mulenet
PYTHON_SERVICE_URL=http://localhost:8000
GROQ_API_KEY=gsk_your_groq_api_key
```

```bash
node server.js    # → http://localhost:3001
```

### 4. Analysis Engine

```bash
cd analysis-engine
pip install -r requirements.txt
uvicorn main:app --reload --port 8000 --timeout-keep-alive 120
```

### Environment Variables Summary

| Variable | File | Description |
|---|---|---|
| `VITE_API_URL` | `frontend/.env` | Backend API base URL |
| `MONGODB_URI` | `api/.env` | MongoDB Atlas connection string |
| `GROQ_API_KEY` | `api/.env` | Groq API key for AI narratives |
| `PYTHON_SERVICE_URL` | `api/.env` | Python FastAPI URL |

---

## 📖 Usage Instructions

### Step 1 — Upload CSV

Navigate to `/analyze` and upload a CSV with the required columns:

```csv
transaction_id,sender_id,receiver_id,amount,timestamp
T001,ACC_A,ACC_B,50000,2024-01-15 09:30:00
T002,ACC_B,ACC_C,47500,2024-01-15 11:45:00
T003,ACC_C,ACC_A,45000,2024-01-15 14:00:00
```

Animated progress steps show processing status: Parsing → Building Graph → Running Detectors → Scoring → Complete.

### Step 2 — Investigate Dashboard

- **Network Graph** — Nodes sized/colored by risk score. Click any node to investigate. Gold stars = super nodes.
- **Timeline** — Click Play to watch money flow chronologically (edges flash yellow per transaction).
- **Investigator Panel** — Risk gauge, lifecycle badge, detected patterns, AI-generated SAR narrative.
- **Summary Cards** — Total accounts, flagged count, rings detected, processing time.

### Step 3 — Explore Additional Pages

| Page | What It Shows |
|---|---|
| `/rings` | Fraud ring cards with risk scores, member lists, pattern types |
| `/analytics` | Score histogram, lifecycle donut, pattern bar chart, ring scatter |
| `/history` | Past analyses stored in MongoDB — click to reload, delete |
| `/report` | SAR-style report preview with executive summary |
| `/how-it-works` | Algorithm explainer with complexity and comparison table |

### Step 4 — Download JSON Report

Click **Download JSON Report** on the dashboard. Output format:

```json
{
  "suspicious_accounts": [
    {
      "account_id": "ACC_B",
      "suspicion_score": 84.5,
      "detected_patterns": ["cycle_length_3", "high_velocity", "below_threshold_amounts"],
      "ring_id": "RING_001",
      "lifecycle_stage": "Stage 2: Active Layering Mule"
    }
  ],
  "fraud_rings": [
    {
      "ring_id": "RING_001",
      "member_accounts": ["ACC_A", "ACC_B", "ACC_C"],
      "pattern_type": "circular_flow",
      "risk_score": 78.2
    }
  ],
  "summary": {
    "total_accounts_analyzed": 1500,
    "suspicious_accounts_flagged": 23,
    "fraud_rings_detected": 4,
    "processing_time_seconds": 12.47
  }
}
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Upload CSV, returns full analysis JSON |
| `POST` | `/api/narrative` | Generate AI narrative for an account |
| `GET` | `/api/history` | List past 20 analyses |
| `GET` | `/api/analysis/:id` | Fetch stored analysis result |
| `DELETE` | `/api/analysis/:id` | Delete a stored analysis |
| `GET` | `/health` | Health check |

---

## ⚡ Performance

| Metric | Target | Status |
|---|---|:---:|
| Processing time (10K txns) | ≤ 30 seconds | ✅ |
| Precision | ≥ 70% | ✅ |
| Recall | ≥ 60% | ✅ |
| Merchant false positives | 0 | ✅ |
| Payroll false positives | 0 | ✅ |

---

## ⚠️ Known Limitations

1. **Single-institution scope** — Operates on one bank's transaction ledger; cross-bank muling detection requires data-sharing infrastructure not implemented here
2. **Batch processing only** — CSV upload model; real-time streaming (Kafka, WebSocket) is not supported
3. **Single currency** — No multi-currency normalization; all amounts treated as same denomination
4. **No temporal score decay** — Suspicion scores persist until re-analysis; dormant flagged accounts don't auto-clear
5. **GNN cold start** — GraphSAGE needs ~50+ nodes for meaningful embeddings; very small datasets use algorithmic-only scoring
6. **Frontend rendering cap** — Top 200 nodes rendered in Cytoscape for performance; full graph requires backend queries for larger datasets
7. **Benford minimum sample** — Accounts with fewer than 10 transactions are excluded from Benford's analysis due to insufficient sample size

---

## 👥 Team Members

| Member | Role | Contribution |
|---|---|---|
| **Rudra Pratap Singh** | Lead Developer | Detection pipeline, Algorithm research, test datasets , GNN layer |
| **Ansh Kumar** | Backend Engineer | API design, MongoDB integration, deployment|
| **Saksham Katiyar** | Frontend Engineer | UI/UX design, Cytoscape visualization, analytics |

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with 🔴 for <strong>RIFT 2026 Hackathon</strong> — Graph Theory / Financial Crime Detection Track
</p>
