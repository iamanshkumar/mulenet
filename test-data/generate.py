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
 
print('All 5 test CSVs generated')
