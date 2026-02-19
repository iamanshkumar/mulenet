import { Upload, File, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

export default function UploadPanel({ onResult }) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const handleUpload = async (file) => {
    setFileName(file.name);
    setIsLoading(true);
    setError('');
    setProgress('Uploading...');
    try {
      // Parse CSV locally for raw transactions (used by TimelineBar/GraphPanel)
      const text = await file.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',');
      const rowCount = lines.length - 1;

      let rawTxns = lines.slice(1).map(line => {
        const vals = line.split(',');
        const obj = {};
        headers.forEach((h, i) => obj[h.trim()] = vals[i]?.trim());
        return obj;
      });

      // Send CSV to API gateway
      setProgress(`Analyzing ${rowCount.toLocaleString()} transactions...`);
      const form = new FormData();
      form.append('file', file);
      const { data } = await axios.post(`${API}/api/analyze`, form, {
        timeout: 300000,
        onUploadProgress: (p) => {
          if (p.total) {
            const pct = Math.round((p.loaded / p.total) * 100);
            setProgress(`Uploading: ${pct}%`);
          }
        }
      });

      setProgress('');
      onResult(data, rawTxns);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || err.message || 'Analysis failed');
      setProgress('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="card-elevated space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Data</h2>
        <p className="text-sm text-gray-600">Import CSV files for fraud ring analysis</p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${dragOver
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-300 hover:border-primary-400'
          }`}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 ${dragOver ? 'text-primary-500' : 'text-gray-400'}`} />
        <p className="text-gray-900 font-semibold mb-1">
          Drag and drop your CSV file here
        </p>
        <p className="text-sm text-gray-500 mb-4">or</p>
        <label className="btn-primary-light cursor-pointer">
          Browse Files
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isLoading}
          />
        </label>
      </div>

      {/* File Preview + Progress */}
      {fileName && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <File className="w-5 h-5 text-primary-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
            <p className="text-xs text-gray-500">
              {isLoading ? (progress || 'Processing…') : error ? 'Failed' : 'Analysis complete ✅'}
            </p>
          </div>
          {isLoading && (
            <div className="animate-spin w-5 h-5 border-2 border-primary-200 border-t-primary-500 rounded-full" />
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="flex gap-3 p-4 bg-blue-50 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">Supported formats</p>
          <p className="text-sm text-blue-700">CSV files with transaction data (up to 10K rows, max 50MB)</p>
        </div>
      </div>
    </div>
  );
}