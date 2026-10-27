import React from 'react';
import { Bot, Sparkles, Upload, Cpu } from 'lucide-react';

export default function Header({ onLoadSample, onUploadClick, loading }) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand-section">
          <div className="logo-badge">
            <Bot size={18} />
          </div>
          <div>
            <h1 className="brand-title">Autonomous Personal Finance Agent</h1>
            <p className="brand-subtitle">Multi-Agent AI for Proactive Financial Wellness</p>
          </div>
        </div>

        {/* Minimalist Agent Status Capsule */}
        <div className="agent-nodes-bar">
          <span className="agent-pill active" title="Financial Data Agent (Groq / Rules)">
            <span className="status-dot"></span>
            Data Agent
          </span>
          <span className="agent-pill active" title="Spending Analysis Agent (Python Math)">
            <span className="status-dot"></span>
            Analysis Agent
          </span>
          <span className="agent-pill active" title="Cash-Flow Forecast Agent (Simulation)">
            <span className="status-dot"></span>
            Forecast Agent
          </span>
          <span className="agent-pill active" title="Advisory Agent (Google Gemini)">
            <span className="status-dot"></span>
            Advisor Agent
          </span>
        </div>

        <div className="header-actions">
          {/* Multi-LLM Routing Badge */}
          <span 
            className="llm-status-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '0.25rem 0.6rem',
              borderRadius: '9999px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)'
            }}
            title="Multi-provider LLM routing: Groq (Data/Anomalies) + Gemini (Advisor/Chat)"
          >
            <Cpu size={12} color="var(--primary)" />
            Groq + Gemini
          </span>

          <button 
            id="load-sample-btn"
            className="btn btn-secondary btn-sm"
            onClick={onLoadSample}
            disabled={loading}
          >
            <Sparkles size={13} />
            Demo Scenario
          </button>
          <button 
            id="upload-csv-btn"
            className="btn btn-primary btn-sm"
            onClick={onUploadClick}
            disabled={loading}
          >
            <Upload size={13} />
            Upload CSV
          </button>
        </div>
      </div>
    </header>
  );
}
