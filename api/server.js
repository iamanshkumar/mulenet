import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import analyzeRouter from './routes/analyze.js'

const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json())

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err))

app.use('/api', analyzeRouter)

app.get('/health', (req, res) => res.json({ status: 'alive', service: 'mulenet-api' }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API running on port ${PORT}`))
