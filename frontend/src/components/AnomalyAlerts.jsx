import React, { useState } from 'react';
import { AlertTriangle, Repeat, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function AnomalyAlerts({ anomalies, recurringPayments }) {
  const [activeTab, setActiveTab] = useState('anomalies');
  const [verifiedMap, setVerifiedMap] = useState({});

  const toggleVerify = (id) => {
    setVerifiedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="card" id="anomaly-alerts-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <ShieldCheck size={16} color="var(--danger)" />
            Risk & Obligations Monitor
          </h2>
          <p className="card-subtitle">AI-flagged irregular charges and detected subscriptions</p>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button 
            id="tab-anomalies-btn"
            className={`btn btn-sm ${activeTab === 'anomalies' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('anomalies')}
          >
            <AlertTriangle size={12} />
            Anomalies ({anomalies?.length || 0})
          </button>
          <button 
            id="tab-recurring-btn"
            className={`btn btn-sm ${activeTab === 'recurring' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('recurring')}
          >
            <Repeat size={12} />
            Recurring ({recurringPayments?.length || 0})
          </button>
        </div>
      </div>

      {activeTab === 'anomalies' ? (
        <div>
          {(!anomalies || anomalies.length === 0) ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <CheckCircle2 size={24} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
              No irregular transactions or duplicate charges detected.
            </div>
          ) : (
            anomalies.map((a) => {
              const isVerified = verifiedMap[a.transaction_id];
              return (
                <div key={a.transaction_id} className={`alert-card ${isVerified ? 'warning' : ''}`}>
                  <AlertTriangle size={15} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="alert-title">
                      <span>{a.description}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        ₹{Number(a.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="alert-desc">{a.reason}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.72rem' }}>
                      <span style={{ color: 'var(--text-dim)' }}>
                        {a.date} • {a.category} • Z-Score: {a.z_score || 'N/A'}
                      </span>
                      <button 
                        className={`btn btn-sm ${isVerified ? 'btn-secondary' : 'btn-outline'}`}
                        style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}
                        onClick={() => toggleVerify(a.transaction_id)}
                      >
                        {isVerified ? '✓ Reviewed' : 'Mark Reviewed'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div>
          {(!recurringPayments || recurringPayments.length === 0) ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No recurring payments identified.
            </div>
          ) : (
            recurringPayments.map((r, idx) => {
              const name = r.merchant || r.description;
              const amount = r.average_amount || r.amount;
              const occurrences = r.occurrences_count || r.occurrence_count;
              const cadence = r.frequency || r.cadence || 'Monthly';

              return (
                <div key={idx} className="alert-card" style={{ borderColor: 'var(--border-color)' }}>
                  <Repeat size={15} color="#8b5cf6" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', fontWeight: 600 }}>
                      <span>{name}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                        ₹{Number(amount).toLocaleString('en-IN')} / mo
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span>Cadence: {cadence}</span>
                      <span>•</span>
                      <span>Category: {r.category}</span>
                      <span>•</span>
                      <span>{occurrences} occurrences</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
