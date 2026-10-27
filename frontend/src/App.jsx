import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import SummaryCards from './components/SummaryCards';
import FinancialHealthCard from './components/FinancialHealthCard';
import ChartsView from './components/ChartsView';
import BudgetTracker from './components/BudgetTracker';
import AnomalyAlerts from './components/AnomalyAlerts';
import ForecastView from './components/ForecastView';
import Recommendations from './components/Recommendations';
import AdvisorChat from './components/AdvisorChat';
import TransactionsTable from './components/TransactionsTable';
import AgentTracesView from './components/AgentTracesView';
import { fetchLatestReport, loadSampleAnalysis, uploadTransactionsCSV, updatePreferences } from './api/client';
import { LayoutDashboard, Target, Sparkles, ShieldAlert, ReceiptText, Activity } from 'lucide-react';

export default function App() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLatestReport();
      setReport(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load initial financial analysis. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLoadSample = async () => {
    setLoading(true);
    try {
      const res = await loadSampleAnalysis();
      setReport(res);
    } catch (err) {
      showToast(`Error loading sample data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    setLoading(true);
    try {
      const res = await uploadTransactionsCSV(file);
      setReport(res);
    } catch (err) {
      showToast(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBudgets = async (newBudgets) => {
    setLoading(true);
    try {
      const minThreshold = report?.data?.forecast?.min_threshold || 15000;
      const savingsGoal = 20000;
      await updatePreferences(newBudgets, minThreshold, savingsGoal);
      const updated = await fetchLatestReport();
      setReport(updated);
    } catch (err) {
      showToast(`Failed to save budgets: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const data = report?.data || {};
  const analysis = data.spending_analysis || {};
  const overall = analysis.overall_summary || {};
  const healthScore = analysis.health_score || {};
  const categoryBreakdown = analysis.category_breakdown || [];
  const monthlySummary = analysis.monthly_summary || [];
  const budgetAlerts = analysis.budget_alerts || [];
  const anomalies = analysis.anomalies || [];
  const recurring = analysis.recurring_payments || [];
  const totalRecurring = analysis.total_recurring_monthly || 0;
  const forecast = data.forecast || {};
  const advisoryReport = data.advisory_report || {};
  const agentTraces = data.agent_traces || [];

  return (
    <div className="app-container">
      <Header 
        onLoadSample={handleLoadSample}
        onUploadClick={() => document.getElementById('csv-file-input')?.click()}
        loading={loading}
      />

      {/* Inline toast notifications — replaces browser alert() */}
      {toast && (
        <div
          role="alert"
          style={{
            position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
            background: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
            color: toast.type === 'error' ? '#991b1b' : '#166534',
            border: `1px solid ${toast.type === 'error' ? '#fca5a5' : '#86efac'}`,
            borderRadius: '0.5rem', padding: '0.75rem 1.25rem',
            maxWidth: '28rem', boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}
            aria-label="Dismiss"
          >✕</button>
        </div>
      )}

      <main className="main-content">
        {/* Dataset Status Strip */}
        <FileUpload 
          onUpload={handleUpload}
          onLoadSample={handleLoadSample}
          currentReport={report}
          loading={loading}
        />

        {/* Modern Tab Navigation Bar */}
        <nav className="tab-navigation-bar" role="tablist">
          <button 
            id="tab-nav-overview"
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={14} />
            Overview
          </button>
          <button 
            id="tab-nav-budgets"
            role="tab"
            aria-selected={activeTab === 'budgets'}
            className={`tab-btn ${activeTab === 'budgets' ? 'active' : ''}`}
            onClick={() => setActiveTab('budgets')}
          >
            <Target size={14} />
            Budgets & Forecast
          </button>
          <button 
            id="tab-nav-advisor"
            role="tab"
            aria-selected={activeTab === 'advisor'}
            className={`tab-btn ${activeTab === 'advisor' ? 'active' : ''}`}
            onClick={() => setActiveTab('advisor')}
          >
            <Sparkles size={14} />
            AI Advisor
          </button>
          <button 
            id="tab-nav-risks"
            role="tab"
            aria-selected={activeTab === 'risks'}
            className={`tab-btn ${activeTab === 'risks' ? 'active' : ''}`}
            onClick={() => setActiveTab('risks')}
          >
            <ShieldAlert size={14} />
            Risk & Obligations
          </button>
          <button 
            id="tab-nav-transactions"
            role="tab"
            aria-selected={activeTab === 'transactions'}
            className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <ReceiptText size={14} />
            Transactions
          </button>
          <button 
            id="tab-nav-traces"
            role="tab"
            aria-selected={activeTab === 'traces'}
            className={`tab-btn ${activeTab === 'traces' ? 'active' : ''}`}
            onClick={() => setActiveTab('traces')}
          >
            <Activity size={14} />
            Agent Traces
          </button>
        </nav>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <SummaryCards 
              overallSummary={overall}
              totalRecurringMonthly={totalRecurring}
              recurringCount={recurring.length}
            />
            <FinancialHealthCard healthScore={healthScore} />
            <ChartsView 
              categoryBreakdown={categoryBreakdown}
              monthlySummary={monthlySummary}
            />
          </div>
        )}

        {/* Tab 2: Budgets & Forecast */}
        {activeTab === 'budgets' && (
          <div className="grid-2-col">
            <BudgetTracker 
              budgetAlerts={budgetAlerts}
              onUpdateBudgets={handleUpdateBudgets}
            />
            <ForecastView forecast={forecast} />
          </div>
        )}

        {/* Tab 3: AI Advisor */}
        {activeTab === 'advisor' && (
          <div className="grid-2-col">
            <Recommendations advisoryReport={advisoryReport} />
            <AdvisorChat reportId={report?.id} />
          </div>
        )}

        {/* Tab 4: Risk & Obligations */}
        {activeTab === 'risks' && (
          <div>
            <AnomalyAlerts 
              anomalies={anomalies}
              recurringPayments={recurring}
            />
          </div>
        )}

        {/* Tab 5: Transactions */}
        {activeTab === 'transactions' && (
          <div>
            <TransactionsTable reportId={report?.id} />
          </div>
        )}

        {/* Tab 6: Agent Traces (Observability Hub) */}
        {activeTab === 'traces' && (
          <div>
            <AgentTracesView traces={agentTraces} />
          </div>
        )}
      </main>
    </div>
  );
}
