import express from 'express'
import multer from 'multer'
import axios from 'axios'
import FormData from 'form-data'
import Analysis from '../models/Analysis.js'

const router = express.Router()

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv'))
            cb(null, true)
        else cb(new Error('Only CSV files allowed'), false)
    }
})



router.post('/analyze', upload.single('file'), async (req, res) => {
    try {
        const form = new FormData()
        form.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: 'text/csv'
        })

        const pyRes = await axios.post(
            `${process.env.PYTHON_SERVICE_URL}/analyze`,
            form,
            { headers: form.getHeaders(), timeout: 300000 }
        )

        const analysis = await Analysis.create({
            filename: req.file.originalname,
            result: pyRes.data,
            summary: {
                total_accounts: pyRes.data.summary.total_accounts_analyzed,
                suspicious_flagged: pyRes.data.summary.suspicious_accounts_flagged,
                rings_detected: pyRes.data.summary.fraud_rings_detected,
                processing_seconds: pyRes.data.summary.processing_time_seconds
            }
        })

        res.json({ ...pyRes.data, analysis_id: analysis._id })

    } catch (err) {
        console.error('Analysis error:', err.message)
        res.status(500).json({ error: 'Analysis failed', message: err.message })
    }
})

router.get('/history', async (req, res) => {
    try {
        const history = await Analysis.find({})
            .select('filename uploadedAt summary')
            .sort({ uploadedAt: -1 })
            .limit(20)
        res.json(history)
    } catch (err) {
        console.error('History error:', err.message)
        res.status(500).json({ error: 'Failed to fetch history' })
    }
})

router.get('/analysis/:id', async (req, res) => {
    try {
        const analysis = await Analysis.findById(req.params.id)
        if (!analysis) return res.status(404).json({ error: 'Not found' })
        res.json(analysis.result)
    } catch (err) {
        console.error('Fetch analysis error:', err.message)
        res.status(500).json({ error: 'Failed to fetch analysis' })
    }
})

router.delete('/analysis/:id', async (req, res) => {
    try {
        await Analysis.findByIdAndDelete(req.params.id)
        res.json({ success: true })
    } catch (err) {
        console.error('Delete analysis error:', err.message)
        res.status(500).json({ error: 'Failed to delete analysis' })
    }
})

router.post('/narrative', async (req, res) => {
    const { account_id, suspicion_score, detected_patterns, ring_id, lifecycle_stage } = req.body

    if (!process.env.GROQ_API_KEY) {
        const patterns = (detected_patterns || []).join(', ') || 'none'
        return res.json({
            narrative: `Account ${account_id} has a suspicion score of ${suspicion_score}/100. `
                + `Detected patterns: ${patterns}. Ring: ${ring_id || 'none'}. `
                + `Lifecycle stage: ${lifecycle_stage}. `
                + `Configure GROQ_API_KEY in api/.env to enable AI narratives.`
        })
    }

    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.1-8b-instant',
            messages: [{
                role: 'user',
                content: `You are a senior financial crime investigator filing a Suspicious Activity Report. Write exactly 3 sentences describing this account professionally:\n`
                    + `Account: ${account_id} | Score: ${suspicion_score}/100\n`
                    + `Patterns: ${(detected_patterns || []).join(', ')} | Ring: ${ring_id}\n`
                    + `Stage: ${lifecycle_stage}\n`
                    + `End with one sentence recommended action starting with "Recommended Action:"`
            }],
            max_tokens: 300,
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            }
        })
        res.json({ narrative: response.data.choices[0].message.content })
    } catch (err) {
        console.error('Narrative error:', err.message)
        res.status(500).json({ error: 'AI narrative generation failed.', message: err.message })
    }
})

export default router