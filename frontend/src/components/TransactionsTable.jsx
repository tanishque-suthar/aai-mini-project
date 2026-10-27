import React, { useState, useEffect } from 'react';
import { ListFilter, Search, AlertTriangle, Repeat, ShieldCheck } from 'lucide-react';
import { fetchTransactions } from '../api/client';

export default function TransactionsTable({ reportId }) {
  const [transactions, setTransactions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchTransactions(reportId, selectedCategory, searchQuery);
        if (active) setTransactions(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [reportId, selectedCategory, searchQuery]);

  const categories = [
    'All', 'Food and Dining', 'Shopping', 'Transportation',
    'Utilities and Bills', 'Healthcare', 'Subscriptions',
    'Investments', 'Entertainment', 'Income'
  ];

  return (
    <div className="card" id="transactions-register-card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 className="card-title">
            <ListFilter size={16} color="var(--primary)" />
            Transaction Register
          </h2>
          <p className="card-subtitle">Normalized records with confidence score and anomaly detection</p>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
          <input 
            id="transaction-search-input"
            type="text" 
            placeholder="Search merchant or amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '0.4rem 0.75rem 0.4rem 1.85rem',
              color: 'var(--text-main)',
              fontSize: '0.775rem',
              width: '100%',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="tx-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Confidence</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No matching transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                    {tx.date}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span>{tx.description}</span>
                      {tx.is_anomaly && (
                        <span className="tag tag-anomaly" title={tx.anomaly_reason}>
                          <AlertTriangle size={10} /> Irregular
                        </span>
                      )}
                      {tx.is_recurring && (
                        <span className="tag tag-recurring">
                          <Repeat size={10} /> Recurring
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="tag tag-cat">
                      {tx.category}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {Math.round((tx.confidence || 0.85) * 100)}%
                    </span>
                  </td>
                  <td style={{ 
                    textAlign: 'right', 
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    color: tx.amount < 0 ? '#10b981' : 'var(--text-main)'
                  }}>
                    {tx.amount < 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
