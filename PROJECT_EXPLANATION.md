# Autonomous Personal Finance Agent: System Architecture & Agentic AI Technical Reference

## Executive Summary

The **Autonomous Personal Finance Agent** is an AI-powered financial wellness system designed to transform raw bank statement records into proactive, forward-looking financial intelligence. While conventional expense trackers offer retrospective summaries and static dashboards, this system employs an autonomous multi-agent architecture built on **LangGraph**, **FastAPI**, **React**, and **SQLite**.

The core premise of the system is the division of cognitive labor: rather than relying on a single monolithic prompt or isolated deterministic scripts, the platform coordinates four specialized agents across a state machine. Financial calculations (variance, Z-scores, linear cash flow simulations) are computed using deterministic Python algorithms for arithmetic precision, while Large Language Models (LLMs) provide semantic disambiguation, anomaly evaluation, prioritized advice synthesis, and grounded conversational interaction.

```mermaid
flowchart TD
    RawCSV["User CSV Upload / Demo Dataset"] --> DA["Financial Data Agent<br/>(Schema Normalization & Hybrid Taxonomy)"]
    DA -->|"Conditional Edge (should_continue)"| SA["Spending Analysis Agent<br/>(Aggregates, Z-Score Outliers, Recurrences, Health Score)"]
    SA --> CF["Cash-Flow Forecast Agent<br/>(90-Day Simulation & Liquidity Stress Test)"]
    CF --> ADV["Financial Advisor Agent<br/>(Strategic Synthesis, Quantified Savings & Action Plan)"]
    ADV --> DB[("SQLite Storage<br/>(analysis_reports, transactions, user_preferences)")]
    DB --> API["FastAPI REST Endpoints"]
    API --> UI["React Interactive Dashboard (6 Views)"]
    UI -->|"Interactive Inquiries"| CHAT["Advisor Conversational Q&A Engine"]
```

---

## 1. What Makes This System "Agentic AI"?

A common question in AI engineering is: *What separates an Agentic System from a standard LLM wrapper or a traditional automated script?*

In this application, the agentic architecture is defined by six architectural attributes:

### 1.1 Decomposition of Cognitive Roles
Monolithic LLM prompts suffer from context degradation, hallucinations, and arithmetic errors when asked to parse raw CSV lines, calculate percentage changes, find statistical outliers, simulate cash trajectories, and write advice all in one pass. 

This platform decomposes the workload into four autonomous agents, each with:
- A specific role definition and objective.
- Explicit inputs and outputs defined by a shared typed schema.
- Dedicated processing engines (deterministic calculations, pattern matching, or LLM reasoning).

### 1.2 Shared Blackboard Architecture (`AgentState`)
The system follows the blackboard architectural pattern implemented via LangGraph's [AgentState](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/backend/app/agents/state.py#L3-L14). State flows predictably through the graph. Each agent reads upstream state keys, executes its specialized logic, and emits state diffs without mutating past records directly:

```python
class AgentState(TypedDict, total=False):
    raw_transactions: List[Dict[str, Any]]
    normalized_transactions: List[Dict[str, Any]]
    categorized_transactions: List[Dict[str, Any]]
    preferences: Dict[str, Any]
    spending_analysis: Dict[str, Any]
    forecast: Dict[str, Any]
    advisory_report: Dict[str, Any]
    agent_traces: List[Dict[str, Any]]  # Execution traces, reasoning logs & decisions for each node
    chat_query: Optional[str]
    chat_response: Optional[str]
    errors: List[str]
```

### 1.3 Hybrid Deterministic + Probabilistic Execution
LLMs cannot be trusted for financial math, such as calculating budget utilization percentages or computing standard deviations. Conversely, rigid rule systems fail when faced with unstructured merchant descriptions or context-sensitive recommendations.

This platform enforces a hybrid model:
- **Deterministic Engines**: ISO-8601 parsing, transaction aggregation, variance computation, Z-score outlier detection, recurrence cadence verification, and daily balance simulations.
- **Probabilistic LLM Engines**: Disambiguation of unseen merchant labels, executive anomaly commentary, multi-month advisory synthesis, and context-grounded natural language Q&A.

### 1.4 Dynamic Conditional Routing
Agent execution is not merely a fixed sequential script. In [orchestrator.py](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/backend/app/agents/orchestrator.py#L9-L35), the graph utilizes conditional edges (`should_continue`). If the Data Agent encounters corrupted inputs, invalid schemas, or zero valid transactions, the graph short-circuits directly to the `END` node, halting downstream execution and capturing errors in the state rather than failing silently.

### 1.5 Execution Observability & Decision Traces
Unlike opaque "black box" AI pipelines, every agent in this workflow logs an execution trace into `agent_traces`. Each trace captures:
- Node name and agent title.
- Processing engine employed (e.g., *Groq Llama-3.3*, *Gemini 2.0 Flash*, or *Deterministic Simulation Engine*).
- Wall-clock latency in milliseconds (`duration_ms`).
- Granular reasoning steps (what the agent checked and why).
- Explicit decision logs (the structural outputs produced).
- State diff keys (which sections of `AgentState` were modified).
- Underlying LLM metadata (model name, token usage, latency, raw prompts).

These traces are exposed to the user in real time via the frontend [AgentTracesView](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/frontend/src/components/AgentTracesView.jsx) component.

### 1.6 Human-in-the-Loop Steering
The system allows the user to steer agent decision-making:
- **Preference Adjustments**: Users can reconfigure spending limits or liquidity safety thresholds through the dashboard. This triggers a targeted re-execution of the analysis, forecast, and advisory pipeline.
- **Conversational Queries**: Users can interrogate the advisor agent about specific spending surges or budget allocations. The advisor inspects the current agent state to produce grounded answers.

---

## 2. In-Depth Multi-Agent Breakdown

The multi-agent core resides in the [backend/app/agents/](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/backend/app/agents/) directory. Below is the technical specification of each agent node.

```mermaid
graph LR
    subgraph Pipeline ["LangGraph Execution Pipeline"]
        direction TB
        DA["1. Financial Data Agent<br/>• Schema Normalization<br/>• Hybrid Categorization<br/>• Confidence Metric"]
        SA["2. Spending Analysis Agent<br/>• Monthly Aggregations<br/>• Z-Score Anomaly Detector<br/>• Recurrence Detection<br/>• 0-100 Health Score"]
        CF["3. Cash-Flow Forecast Agent<br/>• 90-Day Daily Simulation<br/>• Discretionary Burn<br/>• Liquidity Floor Monitoring"]
        ADV["4. Financial Advisor Agent<br/>• Multi-Factor Synthesis<br/>• Prioritized Action Plan<br/>• Quantified ₹ Savings"]
    end
    
    DA --> SA --> CF --> ADV
```

---

### 2.1 Financial Data Agent
- **File**: [backend/app/agents/data_agent.py](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/backend/app/agents/data_agent.py)
- **Role**: Ingestion, schema normalization, and hybrid semantic categorization.
- **Primary Inputs**: `raw_transactions` (parsed CSV rows).
- **Emitted State**: `normalized_transactions`, `categorized_transactions`, `agent_traces`.

#### Mechanism
1. **Schema Normalization**: Ingests heterogeneous column names (`Date`, `Txn Date`, `Amount`, `Debit`, `Credit`, `Particulars`, `Narration`) and normalizes dates into ISO-8601 (`YYYY-MM-DD`). Numeric amounts are sanitized of currency symbols and typed as floats. Transaction types are normalized to `Credit` or `Debit`.
2. **Hybrid Semantic Categorization**:
   - Compares transaction narrations against regular expressions mapped across 11 spending domains: `Income`, `Subscriptions`, `Food and Dining`, `Transportation`, `Utilities and Bills`, `Shopping`, `Healthcare`, `Investments`, `Education`, `Entertainment`, and `Transfers`.
   - Assigns a classification confidence score:
     - Exact merchant regex match: Confidence $\ge 0.95$.
     - Credit transactions identified as salary/dividends: Confidence $\ge 0.99$.
     - Unmatched descriptions default to `"Other Expenses"` with a baseline confidence of $0.60$.
3. **Ambiguity Handling & Observability Call**:
   - When confidence drops below $0.65$, transactions are flagged as ambiguous.
   - The agent invokes an LLM classification prompt via [smart_llm_call](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/backend/app/llm.py) with task `"classification"` to evaluate the merchant name, logging token usage and latency into the agent trace.

---

### 2.2 Spending Analysis Agent
- **File**: [backend/app/agents/analysis_agent.py](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/backend/app/agents/analysis_agent.py)
- **Role**: Quantitative aggregation, variance tracking, statistical outlier detection, recurrence identification, and financial health scoring.
- **Primary Inputs**: `categorized_transactions`, `preferences`.
- **Emitted State**: `spending_analysis`, `agent_traces`.

#### Key Analytical Algorithms

#### 1. Temporal Aggregations & Month-over-Month Trends
The agent groups transactions by calendar month (`YYYY-MM`), excluding internal transfers to prevent double counting. For consecutive months, it evaluates the category-wise absolute change and percentage change:

$$\Delta = \text{Expense}_{\text{curr}} - \text{Expense}_{\text{prev}}$$
$$\% \Delta = \left(\frac{\Delta}{\text{Expense}_{\text{prev}}}\right) \times 100$$

#### 2. Statistical Anomaly & Duplicate Detection
The agent uses three complementary strategies to identify anomalous charges:
- **Z-Score Outlier Analysis**: For each spending category, it calculates the sample mean ($\mu$) and standard deviation ($\sigma$). A transaction is flagged if its Z-score exceeds the threshold ($Z \ge 2.2$) and the absolute amount is notable ($> ₹3,000$):
  $$Z = \frac{x - \mu}{\sigma}$$
- **Duplicate Charge Detection**: The agent hashes transaction tuples `(date, normalized_description, amount)`. Identical debits occurring on the same date are flagged as potential duplicate charges.
- **Absolute Magnitude Threshold**: Single non-investment/non-utility expenditures exceeding ₹18,000 are flagged for user review.

#### 3. Recurrence & Subscription Cadence Detection
To identify recurring obligations without relying on rigid merchant whitelists, the agent clusters debits by merchant narration:
- If a merchant appears $\ge 2$ times across the dataset.
- The amount exhibits minimal variance ($|\text{amount} - \text{mean}| \le 0.05 \times \text{mean}$).
- The agent classifies the obligation as `Monthly Recurring`, calculating the total committed outflow per month.

#### 4. Indicative Financial Health Score (0–100)
The agent calculates a transparent, deterministic health score across four pillars:

| Component | Weight | Criteria |
| :--- | :--- | :--- |
| **Savings Rate** | 35 pts | $\ge 30\% \rightarrow 35$ pts; $\ge 20\% \rightarrow 27$ pts; $\ge 10\% \rightarrow 18$ pts; $> 0\% \rightarrow 10$ pts |
| **Budget Adherence** | 25 pts | 0 overspent/warning $\rightarrow 25$ pts; 0 overspent $\rightarrow 20$ pts; 1 overspent $\rightarrow 12$ pts; $\ge 2 \rightarrow 5$ pts |
| **Spending Stability** | 20 pts | Coefficient of Variation ($CV = \frac{\sigma}{\mu}$): $CV < 0.15 \rightarrow 20$ pts; $CV < 0.30 \rightarrow 15$ pts; else 10 pts |
| **Wealth & Coverage** | 20 pts | Investment ratio vs total income: $\ge 15\% \rightarrow 20$ pts; $\ge 10\% \rightarrow 16$ pts; else 8 pts |

Ratings are graded as: **Excellent** ($\ge 80$), **Good** ($\ge 65$), **Moderate** ($\ge 50$), or **Needs Attention** ($< 50$).

#### 5. Executive Anomaly Commentary
When anomalies or budget breaches are detected, the agent dispatches an LLM task (`"anomaly_commentary"`) to summarize risks in an executive 1–2 sentence format for user presentation.

---

### 2.3 Cash-Flow Forecast Agent
- **File**: [backend/app/agents/forecast_agent.py](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/backend/app/agents/forecast_agent.py)
- **Role**: Forward balance trajectory modeling and liquidity stress testing.
- **Primary Inputs**: `spending_analysis`, `preferences`.
- **Emitted State**: `forecast`, `agent_traces`.

#### Simulation Mechanics
1. **Dynamic Parameter Derivation**: Rather than using hardcoded values, the agent reads the detected monthly recurring obligations ($\text{Fixed}_{\text{recurring}}$) directly from the Spending Analysis Agent's output. Discretionary monthly spend is computed as:
   $$\text{Discretionary}_{\text{daily}} = \frac{\max(0, \text{AvgMonthlyExpenses} - \text{Fixed}_{\text{recurring}})}{30}$$
2. **90-Day Simulation Schedule**:
   - Day 1 of each month: Credits recurring monthly income ($\text{AvgMonthlyIncome}$).
   - Day 2 of each month: Debits batched fixed recurring commitments (rent, utilities, SIPs, subscriptions).
   - Daily: Applies the baseline discretionary burn rate ($\text{Discretionary}_{\text{daily}}$).
3. **Liquidity Stress Testing**:
   At each day $t \in [1, 90]$, projected balance $B(t)$ is checked against the user's safety reserve threshold ($\text{Floor}_{\text{min}}$, default ₹15,000):
   $$B(t) < \text{Floor}_{\text{min}} \implies \text{Trigger Shortfall Warning}$$
   The agent records the exact date of breach and provides milestone balances at Day 30, Day 60, and Day 90.

---

### 2.4 Financial Advisor Agent
- **File**: [backend/app/agents/advisor_agent.py](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/backend/app/agents/advisor_agent.py)
- **Role**: Synthesis of verified analytics, action prioritization, and conversational reasoning.
- **Primary Inputs**: `spending_analysis`, `forecast`, `preferences`.
- **Emitted State**: `advisory_report`, `agent_traces`.

#### 1. Strategic Recommendation Synthesis
The advisor inspects findings across all upstream agents and formulates prioritized recommendations. Each recommendation includes an action item paired with estimated monthly and annual savings in INR:
- **Budget Breaches**: Flagged with **High** priority; computes excess expenditure above the limit and suggests a weekly spending cap.
- **Surging Trends**: Identifies categories growing by $\ge 25\%$ month-over-month (with $> ₹1,000$ change) and computes potential savings from curbing impulse transactions.
- **Disputed Charges / Anomalies**: Flags suspected duplicate charges with **High** priority and guides the user through filing a chargeback or refund request.
- **Subscription Optimization**: Audits recurring digital services and suggests annual bundle consolidation.
- **Savings Rate Expansion**: Compares actual savings against the 25% target benchmark and recommends automated SIP transfers.

#### 2. Conversational Q&A Engine (`chat_advisor_response`)
Users can chat with the Financial Advisor via the dashboard. The system injects a comprehensive snapshot of the user's financial state (total income, expenses, category utilization, detected anomalies, recurring commitments, and 90-day balance projections) into the LLM system prompt.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as React UI (AdvisorChat)
    participant API as FastAPI (/api/chat)
    participant Adv as Advisor Chat Engine
    participant LLM as LLM / Fallback

    User->>UI: Types query (e.g., "Why did my expenses increase?")
    UI->>API: POST /api/chat {query, report_id}
    API->>Adv: chat_advisor_response(query, analysis, forecast, advisory)
    Adv->>LLM: Formulate grounded prompt with current AgentState
    alt LLM API Available (Groq/Gemini)
        LLM-->>Adv: Return nuanced, context-grounded response
    else LLM Offline / No API Key
        LLM-->>Adv: Return deterministic structured pattern response
    end
    Adv-->>API: Formatted Markdown response
    API-->>UI: JSON {response}
    UI-->>User: Render interactive response
```

---

## 3. LangGraph Workflow & Orchestration

The graph orchestration is defined in [orchestrator.py](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/backend/app/agents/orchestrator.py).

### 3.1 Graph Construction
```python
def build_finance_agent_graph():
    builder = StateGraph(AgentState)
    
    # 1. Register Agent Nodes
    builder.add_node("data_agent", financial_data_agent)
    builder.add_node("analysis_agent", spending_analysis_agent)
    builder.add_node("forecast_agent", cash_flow_forecast_agent)
    builder.add_node("advisor_agent", financial_advisor_agent)
    
    # 2. Add Directed & Conditional Edges
    builder.add_edge(START, "data_agent")
    builder.add_conditional_edges("data_agent", should_continue, {
        "analysis_agent": "analysis_agent",
        END: END
    })
    builder.add_edge("analysis_agent", "forecast_agent")
    builder.add_edge("forecast_agent", "advisor_agent")
    builder.add_edge("advisor_agent", END)
    
    return builder.compile()
```

### 3.2 State Transformation Lifecycle

| Stage | Node | Ingests from State | Writes to State | Key Invariant Maintained |
| :--- | :--- | :--- | :--- | :--- |
| **0** | Graph Invocation | `raw_transactions`, `preferences` | Initial state dict | Valid input structure. |
| **1** | `data_agent` | `raw_transactions` | `normalized_transactions`, `categorized_transactions` | All records adhere to ISO dates and uniform float amounts. |
| **2** | Router (`should_continue`) | `errors`, `categorized_transactions` | Route decision | Aborts if no valid records were parsed. |
| **3** | `analysis_agent` | `categorized_transactions`, `preferences` | `spending_analysis` | Mathematically consistent sums, Z-score outliers, and health score. |
| **4** | `forecast_agent` | `spending_analysis`, `preferences` | `forecast` | 90-day balance trajectory and threshold breach flags. |
| **5** | `advisor_agent` | `spending_analysis`, `forecast` | `advisory_report` | Prioritized advice with quantified ₹ impact; final pipeline state. |

---

## 4. LLM Resilience & Dual-Provider Strategy

The system handles LLM integrations through [backend/app/llm.py](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/backend/app/llm.py).

### 4.1 Supported Providers
1. **Groq**: Configured using OpenAI-compatible SDK pointing to `https://api.groq.com/openai/v1`. Default model: `llama-3.3-70b-versatile`. Powers fast classification and anomaly commentary.
2. **Google Gemini**: Configured using OpenAI-compatible SDK endpoint pointing to `https://generativelanguage.googleapis.com/v1beta/openai/`. Default models: `gemini-2.0-flash` / `gemini-1.5-flash`. Powers strategic advisory synthesis and conversational copilot chat.

### 4.2 Four Dedicated LLM Task Routes
The helper `smart_llm_call(task_name, system_prompt, user_prompt, fallback_func)` dispatches four targeted operations:
1. `"classification"`: In `data_agent`, evaluates ambiguous transaction narrations with low regex confidence.
2. `"anomaly_commentary"`: In `analysis_agent`, generates an executive risk analyst overview of detected outliers.
3. `"advisory_synthesis"`: In `advisor_agent`, synthesizes verified state metrics into prioritized recommendations.
4. `"chat"`: In `chat_advisor_response`, generates grounded conversational answers to user inquiries.

### 4.3 Graceful Degradation & Zero-Key Simulation
Financial software must maintain strict reliability regardless of external cloud outages:
1. Tries the primary designated LLM provider.
2. If the primary fails, times out, or has no key, cascades to the secondary provider.
3. If no LLM keys are configured, executes deterministic domain heuristics (pattern matching, mathematical calculations, rule-based responses).
4. Records the exact outcome (`success`, `skipped_no_key`, or `error`) inside the agent's observability trace.

---

## 5. Full-Stack Implementation Details

### 5.1 Backend Architecture (FastAPI & SQLite)
- **FastAPI Endpoints** ([main.py](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/backend/app/main.py)):
  - `GET /api/health`: Health status and service metadata.
  - `GET /api/config/llm`: Live configuration status of Groq and Gemini integrations.
  - `GET /api/reports/latest`: Retrieves the latest report with all agent execution traces.
  - `GET /api/reports/{report_id}`: Retrieves a historical analysis report by unique ID.
  - `POST /api/upload`: Ingests a user CSV file, runs the multi-agent pipeline, and persists the outputs.
  - `POST /api/analyze-sample`: Loads built-in 3-month demo transactions (46 records) to instantly populate the agent pipeline.
  - `GET /api/transactions`: Filterable, paginated register of normalized transactions (by category, merchant, amount).
  - `POST /api/chat`: Routes conversational questions to the Financial Advisor Agent.
  - `GET /api/preferences`: Retrieves active category budgets and safety balance thresholds.
  - `POST /api/preferences`: Updates category budgets and liquidity thresholds, automatically triggering pipeline re-analysis.
- **Persistence** ([database.py](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/backend/app/database.py)):
  - SQLite database stored at `data/finance_agent.db`.
  - Tables:
    - `analysis_reports`: Stores report ID, timestamp, filename, and full JSON state snapshot.
    - `transactions`: Stores individual categorized records with anomaly and recurring flags.
    - `user_preferences`: Stores user-configured category spending budgets and liquidity thresholds.

### 5.2 Frontend Architecture (React 18 & Vite)
The user interface is an interactive Single Page Application located in [frontend/src/](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/frontend/src/):

#### Component Roster
- [Header.jsx](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/frontend/src/components/Header.jsx): Branding, real-time agent status capsule, LLM provider routing badge, Demo Scenario trigger, and Upload CSV trigger.
- [FileUpload.jsx](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/frontend/src/components/FileUpload.jsx): Active dataset status bar, transaction counter, and file input handler.
- [SummaryCards.jsx](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/frontend/src/components/SummaryCards.jsx): Primary financial KPIs (Total Income, Total Expenses, Net Savings, Recurring outflow).
- [FinancialHealthCard.jsx](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/frontend/src/components/FinancialHealthCard.jsx): Transparent 0–100 health gauge broken down across Savings Rate, Budget Adherence, Spending Stability, and Wealth Allocation.
- [ChartsView.jsx](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/frontend/src/components/ChartsView.jsx): Category expenditure donut chart and month-by-month cash flow trend bar chart.
- [Recommendations.jsx](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/frontend/src/components/Recommendations.jsx): Prioritized actionable advisory cards with quantified monthly and annual ₹ savings.
- [BudgetTracker.jsx](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/frontend/src/components/BudgetTracker.jsx): Category budget sliders with real-time budget utilization bars and threshold modification.
- [ForecastView.jsx](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/frontend/src/components/ForecastView.jsx): Recharts-powered 90-day daily balance simulation tracking Day 30, 60, and 90 milestones against safety reserve thresholds.
- [AdvisorChat.jsx](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/frontend/src/components/AdvisorChat.jsx): Conversational AI copilot with pre-populated prompt shortcuts for quick queries.
- [AnomalyAlerts.jsx](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/frontend/src/components/AnomalyAlerts.jsx): Tabs for statistical Z-score anomalies / duplicate charges and detected recurring monthly subscriptions.
- [TransactionsTable.jsx](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/frontend/src/components/TransactionsTable.jsx): Searchable and category-filterable table of all normalized records with confidence indicators.
- [AgentTracesView.jsx](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/frontend/src/components/AgentTracesView.jsx): Live glass-box multi-agent observability inspector displaying execution latency, reasoning steps, state transitions, and raw LLM metadata.

#### Dashboard Navigation Tabs
1. **Overview**: Executive summary, health card, charts, and recommendations.
2. **Budgets & Forecast**: Budget limits and 90-day balance trajectories.
3. **AI Advisor**: Interactive conversational advisor chat.
4. **Risk & Obligations**: Statistical outliers and recurring commitments.
5. **Transactions**: Normalized transaction register.
6. **Agent Traces**: Glass-box agent execution traces.

---

## 6. Verification and Testing

The repository contains an automated test suite verifying both agent logic and frontend user flows:

### 6.1 Unit & Agent Integration Tests (Pytest)
Located in [tests/test_backend.py](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/tests/test_backend.py):
- Tests merchant classification rules and confidence calculations across categories.
- Exercises the end-to-end multi-agent LangGraph workflow against sample transaction data.
- Validates mathematical relationships:
  - $\text{Total Income} - \text{Total Expenses} = \text{Net Savings}$
  - Savings rate formula consistency.
  - Z-score outlier generation and recurrence clustering.
  - Advisory savings tally arithmetic.
- Tests REST API endpoints: `/api/health`, `/api/config/llm`, `/api/analyze-sample`, `/api/reports/latest`, `/api/transactions`, `/api/chat`.

To run:
```bash
PYTHONPATH=. backend/venv/bin/pytest tests/test_backend.py
```

### 6.2 End-to-End Browser Testing (Playwright)
Located in [tests/test_frontend_playwright.py](file:///mnt/ubuntuExtended/projects/1COLLEGE/aai-minip/tests/test_frontend_playwright.py):
- Launches headless browser tests against the running application.
- Exercises navigation across all 6 tabs, testing the budget tracker, cash flow forecast, advisor chat queries, transaction search filters, and agent trace inspection panels.

---

## 7. Summary of Agentic AI Distinctions

| Aspect | Conventional Expense Tracker | Simple LLM Chatbot | Autonomous Finance Agent (This Project) |
| :--- | :--- | :--- | :--- |
| **Architecture** | Static CRUD database & simple queries | Single-prompt LLM call | Coordinated multi-agent LangGraph state machine |
| **Calculation Accuracy** | High (static SQL aggregations) | Low (LLMs frequently miscalculate math) | High (deterministic Python engines for math) |
| **Categorization** | Exact keyword matching or manual tagging | Broad guesswork | Hybrid taxonomy: regex rules + LLM ambiguity handling |
| **Anomaly Detection** | None or simple fixed limits | None | Statistical Z-score standard deviation + duplicate detection |
| **Forecasting** | None | Speculative text generation | Daily 90-day simulation tracking fixed vs discretionary burn |
| **Advisory Quality** | Generic tips | Often hallucinations or generic prose | Quantified INR impact grounded directly in state metrics |
| **Observability** | None (standard logs) | Opaque model response | Full execution traces, reasoning steps, and state diff tracking |
| **System Resilience** | High | Fails on API rate limits or network issues | High: dual-provider fallback + deterministic fail-safes |
