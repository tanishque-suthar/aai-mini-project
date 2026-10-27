import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { TrendingUp, AlertTriangle } from 'lucide-react';

export default function ForecastView({ forecast }) {
  if (!forecast) return null;

  const projections = forecast.projections || [];
  const milestones = forecast.milestones || {};
  const shortfall = forecast.shortfall_warning || {};
  const minThreshold = forecast.min_threshold || 15000;

  return (
    <div className="card" id="cash-flow-forecast-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <TrendingUp size={16} color="var(--blue)" />
            90-Day Cash-Flow Forecast
          </h2>
          <p className="card-subtitle">Projected balance trajectory over 30, 60, and 90 days</p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Safety Floor</span>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f59e0b', fontSize: '0.8rem' }}>
            ₹{minThreshold?.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Milestone Cards */}
      <div className="milestones-grid">
        <div className="milestone-pill">
          <div className="milestone-label">Day 30 Projected</div>
          <div className="milestone-val" style={{ color: '#0284c7' }}>
            ₹{milestones.day_30?.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="milestone-pill">
          <div className="milestone-label">Day 60 Projected</div>
          <div className="milestone-val" style={{ color: '#10b981' }}>
            ₹{milestones.day_60?.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="milestone-pill">
          <div className="milestone-label">Day 90 Projected</div>
          <div className="milestone-val" style={{ color: '#8b5cf6' }}>
            ₹{milestones.day_90?.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div style={{ height: 230, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={projections} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
            <RechartsTooltip 
              formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Projected Balance']}
              contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
            />
            <ReferenceLine y={minThreshold} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Floor', fill: '#f59e0b', fontSize: 10, position: 'insideTopLeft' }} />
            <Line 
              type="monotone" 
              dataKey="projected_balance" 
              stroke="#0284c7" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 4, stroke: '#0284c7', strokeWidth: 2, fill: '#ffffff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {shortfall?.has_shortfall && (
        <div style={{ marginTop: '0.75rem', background: 'var(--danger-subtle)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c', fontSize: '0.775rem' }}>
          <AlertTriangle size={15} />
          <span>Balance may dip below safety floor near day {shortfall.first_shortfall_day}.</span>
        </div>
      )}
    </div>
  );
}
