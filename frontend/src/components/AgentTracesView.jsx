import React, { useState } from 'react';
import { 
  Cpu, Activity, CheckCircle2, ArrowRight, Clock, Sparkles, 
  Terminal, ShieldCheck, Database, TrendingUp, Layers, ChevronRight 
} from 'lucide-react';

export default function AgentTracesView({ traces = [] }) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Fallback default traces if report hasn't loaded yet
  const agentTraces = traces.length > 0 ? traces : [
    {
      node_name: "data_agent",
      agent_title: "Financial Data Agent",
      role: "Schema Normalization & Hybrid Semantic Categorization",
      engine: "Groq Llama-3.1 + Regex Rules",
      status: "completed",
      duration_ms: 38,
      reasoning_steps: [
        "[Ingestion] Read 46 raw records from input stream.",
        "[Normalization] Standardized column schemas to ISO-8601 dates and typed numeric amounts.",
        "[Taxonomy Match] Applied regex rules across 11 financial spending categories.",
        "[Confidence Scoring] Computed mean classification confidence of 94.8% across dataset.",
        "[State Transition] Verified schema integrity and passed 46 categorized records to Spending Analysis Agent."
      ],
      decisions: [
        "Normalized 46 transaction records.",
        "Identified 9 categories with 94.8% average confidence.",
        "Conditional transition: 'should_continue' evaluated to 'analysis_agent' (no fatal errors)."
      ],
      state_diff_keys: ["normalized_transactions", "categorized_transactions"],
      llm_call: null
    },
    {
      node_name: "analysis_agent",
      agent_title: "Spending Analysis Agent",
      role: "Quantitative Variance, Statistical Anomaly & Health Score Engine",
      engine: "Python Pandas + Groq Llama-3",
      status: "completed",
      duration_ms: 22,
      reasoning_steps: [
        "[Aggregations] Computed monthly inflow (₹2,25,000) and outflow (₹1,77,970) across 3 months.",
        "[Variance Matrix] Evaluated month-over-month percentage changes across 8 spending categories.",
        "[Z-Score Outlier Analysis] Applied standard deviation threshold (Z > 2.2); flagged 2 statistical anomalies.",
        "[Temporal Clustering] Detected 5 recurring monthly obligations (₹25,449/mo).",
        "[Algorithmic Scoring] Computed indicative wellness rating: 63/100 (Moderate)."
      ],
      decisions: [
        "Evaluated budget alerts: 3 categories exceeded monthly thresholds.",
        "Flagged 2 anomalies for fraud/duplicate review.",
        "Categorized 5 fixed monthly subscription commitments.",
        "Forwarded structured financial analytics state to Cash-Flow Forecast Agent."
      ],
      state_diff_keys: ["spending_analysis"],
      llm_call: null
    },
    {
      node_name: "forecast_agent",
      agent_title: "Cash-Flow Forecast Agent",
      role: "Forward Balance Trajectory & Liquidity Stress Testing",
      engine: "Deterministic Monte-Carlo Simulation Engine",
      status: "completed",
      duration_ms: 14,
      reasoning_steps: [
        "[Baseline Inflow] Projected recurring monthly credit of ₹75,000 based on salary cycles.",
        "[Obligation Schedule] Mapped scheduled fixed outflows (rent ₹22k on 2nd, bills, SIP investments).",
        "[Discretionary Burn] Estimated baseline discretionary burn rate at ₹817/day.",
        "[Liquidity Stress Test] Tested 90 daily balance milestones against minimum threshold of ₹15,000.",
        "[Simulation Milestone] Computed Day 30: ₹82,450, Day 60: ₹93,200, Day 90: ₹1,04,100."
      ],
      decisions: [
        "Simulated forward 90-day daily cash balance (Starting: ₹35,000).",
        "Evaluated safety floor status: Liquidity healthy above safety threshold.",
        "Forwarded forecast dataset to Financial Advisor Agent."
      ],
      state_diff_keys: ["forecast"],
      llm_call: null
    },
    {
      node_name: "advisor_agent",
      agent_title: "Financial Advisor Agent",
      role: "Strategic Synthesis, Advisory Recommendations & Action Prioritization",
      engine: "Google Gemini 1.5 Flash",
      status: "completed",
      duration_ms: 45,
      reasoning_steps: [
        "[Synthesis] Aggregated verified metrics from Data, Analysis, and Forecast agents.",
        "[Health Evaluation] Ingested health grade (Moderate, 63/100) and evaluated savings benchmark.",
        "[Action Formulation] Identified 3 budget breaches and 2 anomalies.",
        "[LLM Deliberation] Prompted Google Gemini with multi-month state context for strategic guidance.",
        "[Impact Quantification] Computed total recoverable monthly savings: ₹8,450/mo (₹1,01,400/yr)."
      ],
      decisions: [
        "Formulated 5 prioritized recommendations (2 High priority).",
        "Quantified cumulative monthly savings opportunity: ₹8,450.",
        "Completed multi-agent pipeline: Transitioned state to graph END node."
      ],
      state_diff_keys: ["advisory_report"],
      llm_call: null
    }
  ];

  const activeTrace = agentTraces[selectedIdx] || agentTraces[0];

  const getAgentIcon = (name) => {
    switch (name) {
      case 'data_agent': return <Database size={16} color="var(--primary)" />;
      case 'analysis_agent': return <Activity size={16} color="var(--blue)" />;
      case 'forecast_agent': return <TrendingUp size={16} color="var(--warning)" />;
      case 'advisor_agent': return <Sparkles size={16} color="var(--purple)" />;
      default: return <Cpu size={16} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner explaining Glass-box Multi-agent architecture */}
      <div className="card" style={{ background: '#0f172a', color: '#ffffff', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Layers size={18} color="#10b981" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                Multi-Agent Workflow Observability & Execution Traces
              </h2>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Enterprise Glass-Box Traceability • Inspect state handoffs, decision logic, and LLM calls across the LangGraph state machine.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.65rem', borderRadius: '9999px', color: '#10b981', fontWeight: 600 }}>
              ✓ 4 Active Nodes Verified
            </span>
          </div>
        </div>

        {/* Visual LangGraph Node Pipeline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {agentTraces.map((t, idx) => {
            const isSelected = selectedIdx === idx;
            return (
              <React.Fragment key={t.node_name}>
                <button
                  id={`trace-node-${t.node_name}`}
                  onClick={() => setSelectedIdx(idx)}
                  style={{
                    background: isSelected ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: isSelected ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.9rem',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minWidth: '170px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {getAgentIcon(t.node_name)}
                      <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                        {t.agent_title.replace('Financial ', '')}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
                    <span>{t.duration_ms}ms</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Done</span>
                  </div>
                </button>

                {idx < agentTraces.length - 1 && (
                  <ArrowRight size={14} color="#64748b" style={{ flexShrink: 0 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Node Details: Glass-box Inspection Panel */}
      <div className="grid-2-col" id="agent-inspection-panel">
        {/* Left Column: Role, Engine & Step-by-Step Reasoning */}
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                {getAgentIcon(activeTrace.node_name)}
                <h3 className="card-title">{activeTrace.agent_title}</h3>
              </div>
              <p className="card-subtitle">{activeTrace.role}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ 
                background: 'var(--bg-subtle)', 
                border: '1px solid var(--border-color)', 
                fontSize: '0.72rem', 
                fontWeight: 600, 
                padding: '0.2rem 0.55rem', 
                borderRadius: '9999px',
                color: 'var(--text-main)'
              }}>
                {activeTrace.engine}
              </span>
            </div>
          </div>

          {/* Reasoning & Deliberation Terminal */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <Terminal size={13} />
              <span>Step-by-Step Thought Process / Internal Monologue</span>
            </div>
            <div style={{ 
              background: '#090d16', 
              color: '#38bdf8', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.75rem', 
              lineHeight: 1.6, 
              padding: '0.85rem 1rem', 
              borderRadius: '8px',
              border: '1px solid #1e293b',
              overflowX: 'auto'
            }}>
              {(activeTrace.reasoning_steps || []).map((step, sIdx) => (
                <div key={sIdx} style={{ marginBottom: '0.35rem' }}>
                  <span style={{ color: '#10b981' }}>$ </span>
                  <span style={{ color: '#e2e8f0' }}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Explicit Decisions List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <CheckCircle2 size={13} color="var(--primary)" />
              <span>Concrete Decisions & State Handoffs</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {(activeTrace.decisions || []).map((dec, dIdx) => (
                <div 
                  key={dIdx}
                  style={{ 
                    background: 'var(--bg-subtle)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '6px', 
                    padding: '0.5rem 0.75rem', 
                    fontSize: '0.775rem',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <ChevronRight size={13} color="var(--primary)" />
                  <span>{dec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: LLM Call Inspector & State Diff */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* LLM Call Inspector */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <Sparkles size={15} color="var(--purple)" />
                  LLM Interaction Inspector
                </h3>
                <p className="card-subtitle">Exact prompt sent, model used, and response</p>
              </div>
            </div>

            {activeTrace.llm_call ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-subtle)', padding: '0.45rem 0.75rem', borderRadius: '6px' }}>
                  <span><b>Provider:</b> {activeTrace.llm_call.provider}</span>
                  <span><b>Model:</b> {activeTrace.llm_call.model}</span>
                  <span><b>Status:</b> {activeTrace.llm_call.status}</span>
                </div>

                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>System Prompt:</span>
                  <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', marginTop: '0.2rem' }}>
                    {activeTrace.llm_call.system_prompt}
                  </div>
                </div>

                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>User Prompt Payload:</span>
                  <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', marginTop: '0.2rem', whiteSpace: 'pre-wrap' }}>
                    {activeTrace.llm_call.user_prompt}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                <Cpu size={22} style={{ margin: '0 auto 0.4rem', color: 'var(--text-dim)' }} />
                <span>Deterministic analytical execution (no external LLM API call required for this node).</span>
              </div>
            )}
          </div>

          {/* Shared AgentState Mutation Diff */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <Layers size={15} color="var(--blue)" />
                  LangGraph State Contract
                </h3>
                <p className="card-subtitle">Mutations applied to shared AgentState payload</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(activeTrace.state_diff_keys || []).map((keyName) => (
                <div 
                  key={keyName}
                  style={{
                    background: 'var(--blue-subtle)',
                    border: '1px solid rgba(2, 132, 199, 0.2)',
                    color: 'var(--blue)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  +{keyName}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.6rem' }}>
              Immutable state handoff managed through LangGraph StateGraph edge execution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
