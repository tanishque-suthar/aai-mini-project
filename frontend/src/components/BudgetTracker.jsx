import React, { useState } from 'react';
import { Target, Sliders, Check } from 'lucide-react';

export default function BudgetTracker({ budgetAlerts, onUpdateBudgets }) {
  const [editing, setEditing] = useState(false);
  const [localBudgets, setLocalBudgets] = useState({});

  const startEdit = () => {
    const init = {};
    (budgetAlerts || []).forEach(b => {
      init[b.category] = b.budget;
    });
    setLocalBudgets(init);
    setEditing(true);
  };

  const handleSave = () => {
    if (onUpdateBudgets) {
      onUpdateBudgets(localBudgets);
    }
    setEditing(false);
  };

  return (
    <div className="card" id="budget-tracker-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <Target size={16} color="var(--warning)" />
            Budget Monitoring
          </h2>
          <p className="card-subtitle">Spending limits and category thresholds</p>
        </div>
        <button 
          id="toggle-budget-edit-btn"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            if (editing) handleSave();
            else startEdit();
          }}
        >
          {editing ? <Check size={13} color="var(--primary)" /> : <Sliders size={13} />}
          {editing ? 'Save Limits' : 'Adjust Limits'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {(budgetAlerts || []).map((b) => {
          const isExceeded = b.status === 'exceeded';
          const isWarning = b.status === 'warning';
          const fillClass = isExceeded ? 'progress-exceeded' : (isWarning ? 'progress-warning' : 'progress-normal');

          return (
            <div key={b.category} className="budget-item">
              <div className="budget-top">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {b.category}
                  {isExceeded && (
                    <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 600 }}>
                      (+{Math.round(b.utilization_pct - 100)}%)
                    </span>
                  )}
                  {isWarning && (
                    <span style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: 600 }}>
                      (Near limit)
                    </span>
                  )}
                </span>
                
                <span className="budget-meta">
                  ₹{Math.round(b.current_spent).toLocaleString('en-IN')} / 
                  {editing ? (
                    <input 
                      type="number"
                      value={localBudgets[b.category] || b.budget}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLocalBudgets(prev => ({ ...prev, [b.category]: val }));
                      }}
                      style={{
                        width: '75px',
                        padding: '1px 4px',
                        marginLeft: '4px',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    ` ₹${Math.round(b.budget).toLocaleString('en-IN')}`
                  )}
                </span>
              </div>

              <div className="progress-track">
                <div 
                  className={`progress-fill ${fillClass}`}
                  style={{ width: `${Math.min(100, b.utilization_pct || 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
