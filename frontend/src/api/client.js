const BASE_URL = '/api';

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchLatestReport() {
  const res = await fetch(`${BASE_URL}/reports/latest`);
  if (!res.ok) throw new Error('Failed to fetch latest report');
  return res.json();
}

export async function loadSampleAnalysis() {
  const res = await fetch(`${BASE_URL}/analyze-sample`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run sample analysis');
  return res.json();
}

export async function uploadTransactionsCSV(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to upload CSV file');
  }
  return res.json();
}

export async function fetchTransactions(reportId, category = 'All', search = '') {
  const params = new URLSearchParams();
  if (reportId) params.append('report_id', reportId);
  if (category && category !== 'All') params.append('category', category);
  if (search) params.append('search', search);

  const res = await fetch(`${BASE_URL}/transactions?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function sendChatMessage(query, reportId) {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, report_id: reportId })
  });
  if (!res.ok) throw new Error('Advisor chat request failed');
  return res.json();
}

export async function updatePreferences(budgets, minThreshold, savingsGoal) {
  const res = await fetch(`${BASE_URL}/preferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      budgets,
      min_balance_threshold: minThreshold,
      monthly_savings_goal: savingsGoal
    })
  });
  if (!res.ok) throw new Error('Failed to update preferences');
  return res.json();
}
