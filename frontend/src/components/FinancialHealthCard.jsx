import React from 'react';
import { Activity } from 'lucide-react';

export default function FinancialHealthCard({ healthScore }) {
  if (!healthScore) return null;

  const score = healthScore.score || 0;
  const grade = healthScore.grade || 'Moderate';
  const components = healthScore.components || {};

  const getScoreColor = (val) => {
    if (val >= 80) return '#10b981';
    if (val >= 65) return '#0284c7';
    if (val >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const ringColor = getScoreColor(score);

  return (
    <div className="card" id="financial-health-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <Activity size={16} color="var(--primary)" />
            Financial Health Score
          </h2>
          <p className="card-subtitle">Algorithmic wellness score based on spending habits</p>
        </div>
        <span 
          style={{
            background: `${ringColor}15`,
            color: ringColor,
            border: `1px solid ${ringColor}35`,
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}
        >
          {grade}
        </span>
      </div>

      <div className="health-gauge-box">
        <div className="score-circle" style={{ borderColor: ringColor }}>
          <span className="score-num" style={{ color: ringColor }}>{score}</span>
          <span className="score-max">/ 100</span>
        </div>

        <div className="health-breakdown">
          {/* Savings Rate component */}
          <div>
            <div className="breakdown-row">
              <span style={{ color: 'var(--text-muted)' }}>Savings Rate ({components.savings_rate_score?.value || '20.9%'})</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {components.savings_rate_score?.points || 0}/35
              </span>
            </div>
            <div className="breakdown-bar-bg">
              <div 
                className="breakdown-bar-fill" 
                style={{ 
                  width: `${((components.savings_rate_score?.points || 0) / 35) * 100}%`,
                  background: ringColor
                }}
              />
            </div>
          </div>

          {/* Budget Adherence component */}
          <div>
            <div className="breakdown-row">
              <span style={{ color: 'var(--text-muted)' }}>Budget Discipline ({components.budget_adherence_score?.value || '0 overspent'})</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {components.budget_adherence_score?.points || 0}/25
              </span>
            </div>
            <div className="breakdown-bar-bg">
              <div 
                className="breakdown-bar-fill" 
                style={{ 
                  width: `${((components.budget_adherence_score?.points || 0) / 25) * 100}%`,
                  background: ringColor
                }}
              />
            </div>
          </div>

          {/* Spending Stability */}
          <div>
            <div className="breakdown-row">
              <span style={{ color: 'var(--text-muted)' }}>Spending Stability ({components.spending_stability_score?.value || 'Stable'})</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {components.spending_stability_score?.points || 0}/20
              </span>
            </div>
            <div className="breakdown-bar-bg">
              <div 
                className="breakdown-bar-fill" 
                style={{ 
                  width: `${((components.spending_stability_score?.points || 0) / 20) * 100}%`,
                  background: ringColor
                }}
              />
            </div>
          </div>

          {/* Wealth / Investments */}
          <div>
            <div className="breakdown-row">
              <span style={{ color: 'var(--text-muted)' }}>Investment Allocation ({components.wealth_score?.value || '10.8%'})</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {components.wealth_score?.points || 0}/20
              </span>
            </div>
            <div className="breakdown-bar-bg">
              <div 
                className="breakdown-bar-fill" 
                style={{ 
                  width: `${((components.wealth_score?.points || 0) / 20) * 100}%`,
                  background: ringColor
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
