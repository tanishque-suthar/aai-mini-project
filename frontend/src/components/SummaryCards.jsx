import React from 'react';
import { ArrowUpRight, ArrowDownRight, PiggyBank, CalendarClock } from 'lucide-react';

export default function SummaryCards({ overallSummary, totalRecurringMonthly, recurringCount }) {
  if (!overallSummary) return null;

  return (
    <div className="summary-grid">
      {/* Total Income */}
      <div className="summary-card" id="card-income">
        <div className="summary-header">
          <span>Total Income</span>
          <div className="summary-icon-wrap" style={{ color: '#10b981' }}>
            <ArrowUpRight size={15} />
          </div>
        </div>
        <div className="summary-val">₹{overallSummary.total_income?.toLocaleString('en-IN')}</div>
        <div className="summary-sub">
          <span>Avg ₹{overallSummary.avg_monthly_income?.toLocaleString('en-IN')}/mo</span>
        </div>
      </div>

      {/* Total Expenses */}
      <div className="summary-card" id="card-expenses">
        <div className="summary-header">
          <span>Total Expenses</span>
          <div className="summary-icon-wrap" style={{ color: '#f43f5e' }}>
            <ArrowDownRight size={15} />
          </div>
        </div>
        <div className="summary-val">₹{overallSummary.total_expenses?.toLocaleString('en-IN')}</div>
        <div className="summary-sub">
          <span>Avg ₹{overallSummary.avg_monthly_expenses?.toLocaleString('en-IN')}/mo</span>
        </div>
      </div>

      {/* Net Savings & Rate */}
      <div className="summary-card" id="card-savings">
        <div className="summary-header">
          <span>Net Savings</span>
          <div className="summary-icon-wrap" style={{ color: '#0284c7' }}>
            <PiggyBank size={15} />
          </div>
        </div>
        <div className="summary-val">₹{overallSummary.net_savings?.toLocaleString('en-IN')}</div>
        <div className="summary-sub">
          <span className="summary-tag" style={{ background: 'var(--blue-subtle)', color: '#0284c7' }}>
            {overallSummary.overall_savings_rate}% Savings Rate
          </span>
        </div>
      </div>

      {/* Recurring Outflow */}
      <div className="summary-card" id="card-recurring">
        <div className="summary-header">
          <span>Committed Outflow</span>
          <div className="summary-icon-wrap" style={{ color: '#8b5cf6' }}>
            <CalendarClock size={15} />
          </div>
        </div>
        <div className="summary-val">₹{totalRecurringMonthly?.toLocaleString('en-IN')}</div>
        <div className="summary-sub">
          <span className="summary-tag" style={{ background: 'var(--purple-subtle)', color: '#8b5cf6' }}>
            {recurringCount || 5} active commitments
          </span>
        </div>
      </div>
    </div>
  );
}
