import express from 'express'
import multer from 'multer'
import axios from 'axios'
import FormData from 'form-data'
import Analysis from '../models/Analysis.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

let geminiModel = null
function getGeminiModel() {
    if (!geminiModel && process.env.GEMINI_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        geminiModel = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
        console.log('Gemini client initialized successfully')
    }
    return geminiModel
}

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

router.post('/narrative', async (req, res) => {
    const { account_id, suspicion_score, detected_patterns, ring_id, lifecycle_stage } = req.body
    const model = getGeminiModel()

    if (!model) {
        const patterns = (detected_patterns || []).join(', ') || 'none'
        return res.json({
            narrative: `Account ${account_id} has a suspicion score of ${suspicion_score}/100. `
                + `Detected patterns: ${patterns}. Ring: ${ring_id || 'none'}. `
                + `Lifecycle stage: ${lifecycle_stage}. `
                + `Narrative unavailable — configure GEMINI_API_KEY in api/.env to enable AI narratives.`
        })
    }

    try {
        const prompt = `You are a financial crime investigator. Write a 3-sentence SAR narrative:\n`
            + `Account: ${account_id} | Score: ${suspicion_score}/100\n`
            + `Patterns: ${(detected_patterns || []).join(', ')} | Ring: ${ring_id}\n`
            + `Stage: ${lifecycle_stage}\n`
            + `End with a one-sentence recommended action.`
        const result = await model.generateContent(prompt)
        res.json({ narrative: result.response.text() })
    } catch (err) {
        console.error('Narrative error:', err.message)
        res.status(500).json({ error: 'AI narrative generation failed.', message: err.message })
    }
})

export default router