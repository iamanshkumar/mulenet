# test-data/generate.py — run: python generate.py
import pandas as pd, random, uuid
from datetime import datetime, timedelta
B = datetime(2024,1,1)
def ts(h): return (B+timedelta(hours=h)).strftime('%Y-%m-%d %H:%M:%S')

# Test 1: 3-node cycle (should detect ALL 3 accounts)
rows = [['T01','ACC_A','ACC_B',50000,ts(0)],['T02','ACC_B','ACC_C',47500,ts(2)],
        ['T03','ACC_C','ACC_A',45000,ts(4)]]
for i in range(30):
    rows.append([str(uuid.uuid4())[:6],f'N{i:03d}',f'N{(i+3)%30:03d}',
                 round(random.uniform(500,5000),2),ts(random.uniform(0,200))])
pd.DataFrame(rows,columns=['transaction_id','sender_id','receiver_id','amount','timestamp'])\
  .to_csv('test1_cycle.csv',index=False)

# Test 2: Smurfing (12 senders → aggregator, amounts below 50k threshold)
rows=[]
for i in range(12):
    rows.append([f'S{i:02d}',f'SRC_{i:02d}','AGG_001',48500-random.uniform(0,500),ts(i*3)])
rows+=[['F01','AGG_001','OUT_A',180000,ts(40)],['F02','AGG_001','OUT_B',170000,ts(41)]]
pd.DataFrame(rows,columns=['transaction_id','sender_id','receiver_id','amount','timestamp'])\
  .to_csv('test2_smurfing.csv',index=False)

# Test 3: Shell chain (ORIGIN→S1→S2→S3→CASHOUT, pass-through >90%)
rows=[['C01','ORIGIN','SHELL1',500000,ts(0)],['C02','SHELL1','SHELL2',490000,ts(2)],
      ['C03','SHELL2','SHELL3',480000,ts(4)],['C04','SHELL3','CASHOUT',470000,ts(6)]]
pd.DataFrame(rows,columns=['transaction_id','sender_id','receiver_id','amount','timestamp'])\
  .to_csv('test3_shell.csv',index=False)

# Test 4: Merchant TRAP — must produce ZERO flags
rows=[]
for i in range(300):
    rows.append([str(uuid.uuid4())[:8],f'CUST_{i:04d}','MERCHANT_001',
                 round(random.uniform(200,8000),2),ts(random.uniform(0,720))])
pd.DataFrame(rows,columns=['transaction_id','sender_id','receiver_id','amount','timestamp'])\
  .to_csv('test4_merchant_trap.csv',index=False)

# Test 5: Payroll TRAP — must produce ZERO flags
rows=[['P00','CORP_BANK','PAYROLL_CO',5000000,ts(0)]]
for i in range(200):
    rows.append([f'P{i:03d}','PAYROLL_CO',f'EMP_{i:04d}',25000,ts(random.uniform(1,48))])
pd.DataFrame(rows,columns=['transaction_id','sender_id','receiver_id','amount','timestamp'])\
  .to_csv('test5_payroll_trap.csv',index=False)

# ── Test 6: 10K STRESS TEST ───────────────────────────────────
# Mixed dataset: fraud rings + merchants + payroll + random noise
print('Generating 10K stress test ...')
rows = []
tx_counter = 0

# --- Fraud rings (5 cycles of 4-5 nodes each) ---
for ring in range(5):
    ring_size = random.choice([4, 5])
    nodes = [f'RING{ring}_M{i}' for i in range(ring_size)]
    base_amount = random.uniform(30000, 100000)
    for i in range(ring_size):
        tx_counter += 1
        rows.append([f'TX_{tx_counter:05d}', nodes[i], nodes[(i+1) % ring_size],
                     round(base_amount * (0.95 ** i), 2),
                     ts(ring * 50 + i * 3)])

# --- Fan-in smurfing (3 aggregators, 15 senders each) ---
for agg_idx in range(3):
    agg = f'AGG_{agg_idx:02d}'
    for src in range(15):
        tx_counter += 1
        rows.append([f'TX_{tx_counter:05d}', f'SMURF_SRC_{agg_idx}_{src:02d}', agg,
                     round(random.uniform(9000, 9999), 2),
                     ts(random.uniform(0, 48))])
    # Cash out
    for out in range(3):
        tx_counter += 1
        rows.append([f'TX_{tx_counter:05d}', agg, f'CASH_OUT_{agg_idx}_{out}',
                     round(random.uniform(30000, 50000), 2),
                     ts(random.uniform(50, 60))])

# --- Shell chains (5 chains of 3-4 hops) ---
for chain in range(5):
    hops = random.choice([3, 4])
    shell_nodes = [f'CHAIN{chain}_H{h}' for h in range(hops)]
    amt = random.uniform(200000, 500000)
    for h in range(hops - 1):
        tx_counter += 1
        rows.append([f'TX_{tx_counter:05d}', shell_nodes[h], shell_nodes[h + 1],
                     round(amt * 0.98, 2),
                     ts(chain * 10 + h * 2)])
        amt *= 0.98

# --- Merchant trap (high-volume legit) ---
for merch in range(3):
    merch_id = f'LEGIT_MERCHANT_{merch:02d}'
    for cust in range(500):
        tx_counter += 1
        rows.append([f'TX_{tx_counter:05d}', f'CUST_{merch}_{cust:04d}', merch_id,
                     round(random.uniform(100, 5000), 2),
                     ts(random.uniform(0, 720))])

# --- Payroll trap ---
for corp in range(2):
    corp_id = f'LEGIT_PAYROLL_{corp:02d}'
    tx_counter += 1
    rows.append([f'TX_{tx_counter:05d}', f'CORP_BANK_{corp}', corp_id,
                 5000000, ts(0)])
    for emp in range(300):
        tx_counter += 1
        rows.append([f'TX_{tx_counter:05d}', corp_id, f'EMP_{corp}_{emp:04d}',
                     25000, ts(random.uniform(1, 48))])

# --- Random noise transactions ---
noise_accounts = [f'RAND_{i:04d}' for i in range(2000)]
remaining = 10000 - len(rows)
for _ in range(max(0, remaining)):
    tx_counter += 1
    rows.append([f'TX_{tx_counter:05d}',
                 random.choice(noise_accounts),
                 random.choice(noise_accounts),
                 round(random.uniform(50, 20000), 2),
                 ts(random.uniform(0, 720))])

df = pd.DataFrame(rows, columns=['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp'])
print(f'  Generated {len(df)} transactions, {len(set(df["sender_id"].tolist()+df["receiver_id"].tolist()))} unique accounts')
df.to_csv('test6_10k_stress.csv', index=False)

print(f'All 6 test CSVs generated (including 10K stress test with {len(df)} rows)')
