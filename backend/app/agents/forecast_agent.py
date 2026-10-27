import time
from typing import Dict, Any, List
from datetime import datetime, timedelta
from .state import AgentState

# Day of month on which we assume income is credited (start of month)
INCOME_CREDIT_DAY = 1
# Day of month on which we batch fixed recurring outflows
FIXED_OUTFLOW_DAY = 2

def cash_flow_forecast_agent(state: AgentState) -> AgentState:
    start_time = time.time()
    analysis = state.get("spending_analysis", {})
    prefs = state.get("preferences", {})
    traces = list(state.get("agent_traces", []))
    
    overall = analysis.get("overall_summary", {})
    recurring = analysis.get("recurring_payments", [])
    monthly_data = analysis.get("monthly_summary", [])
    
    min_threshold = prefs.get("min_balance_threshold", 15000.0)
    
    avg_monthly_income = overall.get("avg_monthly_income", 75000.0)
    avg_monthly_expenses = overall.get("avg_monthly_expenses", 50000.0)
    
    # Use detected recurring obligations from the Analysis Agent instead of
    # hardcoded amounts so the forecast reflects each user's actual data.
    fixed_recurring_monthly = sum(r["average_amount"] for r in recurring)
    discretionary_monthly = max(0.0, avg_monthly_expenses - fixed_recurring_monthly)
    daily_discretionary = discretionary_monthly / 30.0
    
    latest_savings = monthly_data[-1]["savings"] if monthly_data else 20000.0
    current_estimated_balance = max(25000.0, latest_savings + 10000.0)
    
    projections = []
    curr_balance = current_estimated_balance
    start_date = datetime.now()
    
    shortfall_detected = False
    shortfall_date = None
    min_projected_balance = curr_balance
    
    for day in range(1, 91):
        target_date = start_date + timedelta(days=day)
        day_of_month = target_date.day
        
        # Credit income on the first of each month
        day_income = avg_monthly_income if day_of_month == INCOME_CREDIT_DAY else 0.0
        
        # Batch all detected recurring outflows on day 2 of each month
        day_fixed = fixed_recurring_monthly if day_of_month == FIXED_OUTFLOW_DAY else 0.0
            
        day_expense = day_fixed + daily_discretionary
        curr_balance = curr_balance + day_income - day_expense
        
        if curr_balance < min_projected_balance:
            min_projected_balance = curr_balance
            
        if curr_balance < min_threshold and not shortfall_detected:
            shortfall_detected = True
            shortfall_date = target_date.strftime("%Y-%m-%d")
            
        if day in [7, 14, 21, 30, 45, 60, 75, 90]:
            projections.append({
                "day": day,
                "date": target_date.strftime("%b %d"),
                "projected_balance": round(curr_balance, 2),
                "cumulative_income": round(avg_monthly_income * (day // 30 + (1 if day_of_month >= 1 else 0)), 2),
                "is_below_minimum": curr_balance < min_threshold
            })
            
    month_1_balance = next((p["projected_balance"] for p in projections if p["day"] == 30), round(curr_balance, 2))
    month_2_balance = next((p["projected_balance"] for p in projections if p["day"] == 60), round(curr_balance, 2))
    month_3_balance = next((p["projected_balance"] for p in projections if p["day"] == 90), round(curr_balance, 2))
    
    forecast_data = {
        "starting_balance": round(current_estimated_balance, 2),
        "min_threshold": round(min_threshold, 2),
        "min_projected_balance": round(min_projected_balance, 2),
        "projections": projections,
        "milestones": {
            "day_30": month_1_balance,
            "day_60": month_2_balance,
            "day_90": month_3_balance
        },
        "shortfall_warning": {
            "has_shortfall": shortfall_detected,
            "projected_date": shortfall_date,
            "message": f"Projected balance dips below your threshold of ₹{min_threshold:,.0f} around {shortfall_date}" if shortfall_detected else "Cash flow remains healthy above minimum threshold across the 90-day horizon."
        },
        "assumptions": [
            f"Monthly income expected around ₹{avg_monthly_income:,.0f} at start of month.",
            f"Fixed commitments (rent, utilities, SIP, subscriptions) total ~₹{fixed_recurring_monthly:,.0f}/month.",
            f"Discretionary spending continues at ~₹{round(daily_discretionary, 0):,.0f}/day.",
            f"Safety liquidity buffer maintained at ₹{min_threshold:,.0f}."
        ]
    }

    duration_ms = max(1, int((time.time() - start_time) * 1000))

    trace = {
        "node_name": "forecast_agent",
        "agent_title": "Cash-Flow Forecast Agent",
        "role": "Forward Balance Trajectory & Liquidity Stress Testing",
        "engine": "Deterministic Daily Cash-Flow Simulation Engine",
        "status": "completed",
        "duration_ms": duration_ms,
        "reasoning_steps": [
            f"[Baseline Inflow] Projected recurring monthly credit of ₹{avg_monthly_income:,.0f} based on salary cycles.",
            f"[Obligation Schedule] Sourced {len(recurring)} recurring obligations (₹{fixed_recurring_monthly:,.0f}/mo) from Analysis Agent state — batched on day {FIXED_OUTFLOW_DAY} of each month.",
            f"[Discretionary Burn] Estimated baseline discretionary burn rate at ₹{round(daily_discretionary, 0):,.0f}/day.",
            f"[Liquidity Stress Test] Tested 90 daily balance milestones against minimum threshold of ₹{min_threshold:,.0f}.",
            f"[Simulation Milestone] Computed Day 30: ₹{month_1_balance:,.0f}, Day 60: ₹{month_2_balance:,.0f}, Day 90: ₹{month_3_balance:,.0f}."
        ],
        "decisions": [
            f"Simulated forward 90-day daily cash balance (Starting: ₹{current_estimated_balance:,.0f}).",
            "Evaluated safety floor status: " + ("Warning triggered" if shortfall_detected else "Liquidity healthy above safety threshold."),
            "Forwarded forecast dataset to Financial Advisor Agent."
        ],
        "state_diff_keys": ["forecast"],
        "llm_call": None
    }

    traces.append(trace)

    return {
        **state,
        "forecast": forecast_data,
        "agent_traces": traces
    }
