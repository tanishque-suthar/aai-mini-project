import React from 'react';
import { Sparkles, Zap } from 'lucide-react';

export default function Recommendations({ advisoryReport }) {
  if (!advisoryReport) return null;

  const recs = advisoryReport.recommendations || [];
  const monthlySavings = advisoryReport.total_potential_monthly_savings || 0;

  return (
    <div className="card" id="advisor-recommendations-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <Sparkles size={16} color="var(--primary)" />
            AI Advisor Recommendations
          </h2>
          <p className="card-subtitle">{advisoryReport.summary_statement || 'Synthesized financial wellness insights'}</p>
        </div>

        <div className="rec-savings-tag">
          <Zap size={13} />
          Potential Savings: +₹{Math.round(monthlySavings).toLocaleString('en-IN')}/mo
        </div>
      </div>

      <div className="rec-grid">
        {recs.map((r) => {
          const badgeClass = r.priority === 'High' ? 'rec-badge-high' : (r.priority === 'Medium' ? 'rec-badge-medium' : 'rec-badge-low');

          return (
            <div key={r.id} className="rec-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={badgeClass}>{r.priority} Priority</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.type}</span>
              </div>

              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                  {r.title}
                </h3>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {r.observation}
                </p>
              </div>

              <div style={{ background: 'var(--bg-subtle)', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--blue)', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Action:</span>
                <span style={{ color: 'var(--text-main)' }}>{r.action}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', fontSize: '0.72rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Est. Monthly Impact:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#047857' }}>
                  +₹{Math.round(r.estimated_savings_monthly).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
