import mongoose from 'mongoose';

const AnalysisSchema = new mongoose.Schema({
    filename: { 
        type: String, 
        required: true 
    },
    uploadedAt: { 
        type: Date, 
        default: Date.now 
    },
    result: { 
        type: mongoose.Schema.Types.Mixed, 
        required: true 
    },
    summary: {
        total_accounts: Number,
        suspicious_flagged: Number,
        rings_detected: Number,
        processing_seconds: Number
    }
});

const Analysis = mongoose.model('Analysis', AnalysisSchema);

export default Analysis;
