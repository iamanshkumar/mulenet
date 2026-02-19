const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
require('dotenv').config()

const BASE = process.env.BASE
 
async function testCSV(file, label, minFlags, maxFlags) {
    const form = new FormData()
    form.append('file', fs.createReadStream(file))
    const t = Date.now()
    const { data } = await axios.post(`${BASE}/api/analyze`, form,
        { headers: form.getHeaders(), timeout:60000 })
    const ms = Date.now()-t
    const flags = data.suspicious_accounts.length

    // Validate exact JSON format
    console.assert('suspicious_accounts' in data, 'Missing suspicious_accounts')
    console.assert('fraud_rings' in data, 'Missing fraud_rings')
    console.assert('summary' in data, 'Missing summary')
    data.suspicious_accounts.forEach(a => {
        console.assert('account_id' in a, 'Missing account_id')
        console.assert('suspicion_score' in a, 'Missing suspicion_score')
        console.assert('detected_patterns' in a, 'Missing detected_patterns')
        console.assert('ring_id' in a, 'Missing ring_id')
        console.assert(a.suspicion_score>=0 && a.suspicion_score<=100, 'Score out of range')
    })
    console.assert(flags>=minFlags && flags<=maxFlags,
        `${label}: expected ${minFlags}-${maxFlags} flags, got ${flags}`)
    console.assert(ms<=30000, `Too slow: ${ms}ms`)
    console.log(`${label}: ${flags} flags in ${ms}ms`)
}
 
;(async () => {
    await testCSV('test1_cycle.csv', 'Cycle Fraud',  3,  10)
    await testCSV('test2_smurfing.csv', 'Smurfing Fraud', 5,  20)
    await testCSV('test3_shell.csv', 'Shell Chain',  3, 10)
    await testCSV('test4_merchant_trap.csv','Merchant Trap',0, 0)
    await testCSV('test5_payroll_trap.csv', 'Payroll Trap', 0, 0)
    console.log('\n All tests passed!')
})().catch(console.error)
