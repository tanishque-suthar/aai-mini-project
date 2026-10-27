import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { PieChart as PieIcon, BarChart3 } from 'lucide-react';

const COLORS = [
  '#10b981', '#0284c7', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f43f5e', '#64748b'
];

export default function ChartsView({ categoryBreakdown, monthlySummary }) {
  const pieData = (categoryBreakdown || []).slice(0, 6).map(c => ({
    name: c.category,
    value: c.total_amount
  }));

  const barData = (monthlySummary || []).map(m => ({
    name: m.month,
    Income: m.income,
    Expenses: m.expenses,
    Savings: m.savings
  }));

  return (
    <div className="grid-2-col">
      {/* Monthly Cash Flow Trend */}
      <div className="card" id="monthly-chart-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <BarChart3 size={16} color="var(--primary)" />
              Monthly Cash Flow
            </h2>
            <p className="card-subtitle">Income vs Expenses vs Net Savings</p>
          </div>
        </div>

        <div style={{ height: 250, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
              <RechartsTooltip 
                formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`]}
                contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
              />
              <Legend wrapperStyle={{ fontSize: '0.72rem', paddingTop: '10px' }} iconType="circle" iconSize={7} />
              <Bar dataKey="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Expenses" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Savings" fill="#0284c7" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown Donut */}
      <div className="card" id="category-chart-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <PieIcon size={16} color="var(--blue)" />
              Category Breakdown
            </h2>
            <p className="card-subtitle">Expense distribution by category</p>
          </div>
        </div>

        <div style={{ height: 210, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={60}
                outerRadius={88}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem 0.75rem', marginTop: '0.5rem', justifyContent: 'center' }}>
          {pieData.map((entry, index) => (
            <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS[index % COLORS.length] }}></span>
              <span>{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
