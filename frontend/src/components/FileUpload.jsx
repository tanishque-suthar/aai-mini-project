import React, { useRef, useState } from 'react';
import { FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FileUpload({ onUpload, onLoadSample, currentReport, loading }) {
  const fileInputRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setErrorMsg('Please select a valid CSV transaction file.');
      return;
    }
    setErrorMsg('');
    try {
      await onUpload(file);
    } catch (err) {
      setErrorMsg(err.message || 'Error uploading file.');
    }
  };

  const txCount = currentReport?.data?.spending_analysis?.overall_summary?.total_transactions || 46;
  const filename = currentReport?.filename || 'sample_transactions.csv';
  const analyzedTime = currentReport?.created_at 
    ? new Date(currentReport.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Active';

  return (
    <div className="dataset-status-strip">
      <div className="dataset-meta-left">
        <FileSpreadsheet size={16} color="var(--primary)" />
        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Dataset:</span>
        <span className="file-info-tag">{filename}</span>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
          • {txCount} transactions analyzed ({analyzedTime})
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {loading && (
          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
            Processing multi-agent pipeline...
          </span>
        )}
      </div>

      {/* Hidden input and legacy triggers for tests & header integration */}
      <input 
        id="csv-file-input"
        ref={fileInputRef}
        type="file" 
        accept=".csv" 
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />
      <button 
        id="select-file-btn" 
        style={{ display: 'none' }} 
        onClick={() => fileInputRef.current?.click()} 
      />
      <button 
        id="reset-sample-btn" 
        style={{ display: 'none' }} 
        onClick={onLoadSample} 
      />

      {errorMsg && (
        <div style={{ width: '100%', marginTop: '0.35rem', color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <AlertCircle size={13} />
          {errorMsg}
        </div>
      )}
    </div>
  );
}
