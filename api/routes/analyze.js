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
        if (file.mimetype==='text/csv'||file.originalname.endsWith('.csv'))
            cb(null, true)
        else cb(new Error('Only CSV files allowed'), false)
    }
})


router.post('/analyze', upload.single('file'), async (req, res) => {
    try {
        // Forward CSV to Python microservice
        const form = new FormData()
        form.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: 'text/csv'
        })
 
        const pyRes = await axios.post(
            `${process.env.PYTHON_SERVICE_URL}/analyze`,
            form,
            { headers: form.getHeaders(), timeout: 60000 }
        )
 
        // Persist to MongoDB
        const analysis = await Analysis.create({
            filename: req.file.originalname,
            result: pyRes.data,
            summary: {
                total_accounts:pyRes.data.summary.total_accounts_analyzed,
                suspicious_flagged: pyRes.data.summary.suspicious_accounts_flagged,
                rings_detected: pyRes.data.summary.fraud_rings_detected,
                processing_seconds: pyRes.data.summary.processing_time_seconds
            }
        })
 
        res.json({ ...pyRes.data, analysis_id: analysis._id })
 
    } catch(err) {
        console.error('Analysis error:', err.message)
        res.status(500).json({ error: 'Analysis failed', message: err.message })
    }
})


router.get('/history', async (req, res) => {
    const history = await Analysis.find({})
        .select('filename uploadedAt summary')
        .sort({ uploadedAt: -1 })
        .limit(20)
    res.json(history)
})


router.get('/analysis/:id', async (req, res) => {
    const analysis = await Analysis.findById(req.params.id)
    if (!analysis) return res.status(404).json({ error: 'Not found' })
    res.json(analysis.result)
})


export default router