import pytest
import os
import pandas as pd
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.database import init_db
from backend.app.agents.orchestrator import run_finance_pipeline
from backend.app.agents.data_agent import financial_data_agent, classify_description
from backend.app.agents.analysis_agent import spending_analysis_agent
from backend.app.agents.forecast_agent import cash_flow_forecast_agent
from backend.app.agents.advisor_agent import financial_advisor_agent, chat_advisor_response

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    init_db()

def test_classify_description():
    cat1, conf1 = classify_description("Swiggy Food Delivery", "Debit")
    assert cat1 == "Food and Dining"
    assert conf1 >= 0.9

    cat2, conf2 = classify_description("Netflix Subscription", "Debit")
    assert cat2 == "Subscriptions"
    assert conf2 >= 0.9

    cat3, conf3 = classify_description("TechCorp Monthly Salary", "Credit")
    assert cat3 == "Income"
    assert conf3 >= 0.9

    cat4, conf4 = classify_description("Zerodha Equity SIP", "Debit")
    assert cat4 == "Investments"
    assert conf4 >= 0.9

def test_multi_agent_pipeline():
    sample_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "sample_data", "sample_transactions.csv"))
    df = pd.read_csv(sample_path)
    raw_txns = df.to_dict(orient="records")

    state = run_finance_pipeline(raw_txns, {
        "budgets": {"Food and Dining": 6000.0, "Shopping": 8000.0, "Utilities and Bills": 6000.0},
        "min_balance_threshold": 15000.0
    })

    assert len(state["categorized_transactions"]) == len(raw_txns)
    
    # Check Analysis Agent results — use structural checks instead of exact figures
    # so tests remain stable if the sample dataset is updated.
    analysis = state["spending_analysis"]
    overall = analysis["overall_summary"]
    assert overall["total_income"] > 0
    assert overall["total_expenses"] > 0
    assert overall["net_savings"] == pytest.approx(overall["total_income"] - overall["total_expenses"], rel=1e-3)
    assert overall["overall_savings_rate"] == pytest.approx(
        (overall["net_savings"] / overall["total_income"]) * 100, rel=1e-2
    )
    assert len(analysis["anomalies"]) >= 2
    assert len(analysis["recurring_payments"]) >= 4
    assert 0 <= analysis["health_score"]["score"] <= 100

    # Check Forecast Agent results
    forecast = state["forecast"]
    assert "day_30" in forecast["milestones"]
    assert "day_60" in forecast["milestones"]
    assert "day_90" in forecast["milestones"]
    assert len(forecast["projections"]) > 0
    # Balance projections must be real numbers
    assert isinstance(forecast["milestones"]["day_30"], (int, float))
    assert isinstance(forecast["milestones"]["day_90"], (int, float))

    # Check Advisor Agent results
    advisory = state["advisory_report"]
    assert len(advisory["recommendations"]) >= 3
    assert advisory["total_potential_monthly_savings"] > 0

    # Check Agent Observability Traces
    traces = state.get("agent_traces", [])
    assert len(traces) == 4
    node_names = [t["node_name"] for t in traces]
    assert "data_agent" in node_names
    assert "analysis_agent" in node_names
    assert "forecast_agent" in node_names
    assert "advisor_agent" in node_names
    for t in traces:
        assert len(t["reasoning_steps"]) >= 2
        assert len(t["decisions"]) >= 1
        assert t["duration_ms"] >= 0

def test_chat_advisor_grounded_response():
    analysis = {
        "overall_summary": {"total_income": 75000, "total_expenses": 50000, "overall_savings_rate": 33.3},
        "health_score": {"score": 82, "grade": "Excellent", "components": {}},
        "trends": [{"category": "Food and Dining", "direction": "up", "previous_month": 5000, "current_month": 8000, "absolute_change": 3000, "percentage_change": 60.0}],
        "budget_alerts": [{"category": "Food and Dining", "status": "exceeded", "spent": 8000, "budget": 6000, "utilization_pct": 133.3}],
        "anomalies": [{"transaction_id": 1, "date": "2026-10-16", "description": "Swiggy Food Delivery", "amount": 1250, "reason": "Potential duplicate charge"}],
        "recurring_payments": [{"merchant": "Netflix", "category": "Subscriptions", "average_amount": 649}],
        "monthly_summary": []
    }
    forecast = {"milestones": {"day_30": 35000, "day_60": 55000, "day_90": 75000}}
    advisory = {"recommendations": [{"id": "1", "priority": "High", "title": "Cut Food", "action": "Cook at home", "estimated_savings_monthly": 2000}]}

    # Query 1: Why did expenses increase?
    resp1 = chat_advisor_response("Why did my expenses increase?", analysis, forecast, advisory)
    assert "Food and Dining" in resp1

    # Query 2: Duplicate charges
    resp2 = chat_advisor_response("Are there duplicate charges?", analysis, forecast, advisory)
    assert "Swiggy" in resp2
    assert "duplicate" in resp2.lower()

    # Query 3: Recurring payments
    resp3 = chat_advisor_response("What recurring subscriptions do I have?", analysis, forecast, advisory)
    assert "Netflix" in resp3

def test_api_endpoints():
    # Health check
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "ok"

    # LLM Config status endpoint
    res_llm = client.get("/api/config/llm")
    assert res_llm.status_code == 200
    llm_info = res_llm.json()
    assert "active_mode" in llm_info
    assert "groq_configured" in llm_info
    assert "gemini_configured" in llm_info

    # Analyze sample
    res_sample = client.post("/api/analyze-sample")
    assert res_sample.status_code == 200
    report_data = res_sample.json()
    assert "report_id" in report_data
    assert report_data["transactions_count"] > 0
    assert "agent_traces" in report_data["data"]

    # Get latest
    res_latest = client.get("/api/reports/latest")
    assert res_latest.status_code == 200

    # Transactions filter
    res_txns = client.get("/api/transactions?category=Food%20and%20Dining")
    assert res_txns.status_code == 200
    txns = res_txns.json()
    assert all(t["category"] == "Food and Dining" for t in txns)

    # Chat endpoint
    res_chat = client.post("/api/chat", json={"query": "What are my recurring bills?"})
    assert res_chat.status_code == 200
    assert "response" in res_chat.json()
    assert len(res_chat.json()["response"]) > 10
