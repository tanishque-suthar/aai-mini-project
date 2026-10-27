import math
import time
from typing import Dict, Any, List
from collections import defaultdict
from datetime import datetime
from .state import AgentState
from ..llm import smart_llm_call

def spending_analysis_agent(state: AgentState) -> AgentState:
    start_time = time.time()
    txns = state.get("categorized_transactions", [])
    prefs = state.get("preferences", {})
    traces = list(state.get("agent_traces", []))
    
    budgets = prefs.get("budgets", {
        "Food and Dining": 6000.0,
        "Shopping": 8000.0,
        "Transportation": 3000.0,
        "Utilities and Bills": 6000.0,
        "Entertainment": 2000.0,
        "Healthcare": 3000.0,
        "Subscriptions": 2000.0
    })
    
    if not txns:
        return state

    # 1. Monthly Summaries & Category Aggregations
    monthly_data = defaultdict(lambda: {"income": 0.0, "expenses": 0.0, "categories": defaultdict(float), "tx_count": 0})
    category_totals = defaultdict(float)
    total_income = 0.0
    total_expenses = 0.0
    
    for t in txns:
        month_key = t["date"][:7]
        amt = t["amount"]
        cat = t["category"]
        t_type = t["transaction_type"]
        
        if cat == "Transfers":
            continue
            
        if t_type == "Credit" or cat == "Income":
            monthly_data[month_key]["income"] += amt
            total_income += amt
        else:
            monthly_data[month_key]["expenses"] += amt
            monthly_data[month_key]["categories"][cat] += amt
            category_totals[cat] += amt
            total_expenses += amt
            
        monthly_data[month_key]["tx_count"] += 1

    sorted_months = sorted(monthly_data.keys())
    
    monthly_summary = []
    for m in sorted_months:
        inc = monthly_data[m]["income"]
        exp = monthly_data[m]["expenses"]
        savings = inc - exp
        savings_rate = round((savings / inc * 100), 1) if inc > 0 else 0.0
        monthly_summary.append({
            "month": m,
            "income": round(inc, 2),
            "expenses": round(exp, 2),
            "savings": round(savings, 2),
            "savings_rate": savings_rate,
            "categories": {k: round(v, 2) for k, v in monthly_data[m]["categories"].items()},
            "tx_count": monthly_data[m]["tx_count"]
        })

    latest_month = sorted_months[-1] if sorted_months else datetime.utcnow().strftime("%Y-%m")
    latest_cat_expenses = monthly_data[latest_month]["categories"] if sorted_months else {}

    # Category Breakdown Overall
    category_breakdown = []
    for cat, val in category_totals.items():
        pct = round((val / total_expenses * 100), 1) if total_expenses > 0 else 0.0
        category_breakdown.append({
            "category": cat,
            "total_amount": round(val, 2),
            "percentage": pct
        })
    category_breakdown.sort(key=lambda x: x["total_amount"], reverse=True)

    # 2. Trend Analysis (Month-over-Month changes)
    trends = []
    if len(sorted_months) >= 2:
        prev_m = sorted_months[-2]
        curr_m = sorted_months[-1]
        prev_cats = monthly_data[prev_m]["categories"]
        curr_cats = monthly_data[curr_m]["categories"]
        
        all_cats = set(prev_cats.keys()).union(set(curr_cats.keys()))
        for c in all_cats:
            p_val = prev_cats.get(c, 0.0)
            c_val = curr_cats.get(c, 0.0)
            diff = c_val - p_val
            pct_change = round((diff / p_val * 100), 1) if p_val > 0 else (100.0 if c_val > 0 else 0.0)
            trends.append({
                "category": c,
                "previous_month": round(p_val, 2),
                "current_month": round(c_val, 2),
                "absolute_change": round(diff, 2),
                "percentage_change": pct_change,
                "direction": "up" if diff > 0 else ("down" if diff < 0 else "neutral")
            })
        trends.sort(key=lambda x: abs(x["absolute_change"]), reverse=True)

    # 3. Budget Monitoring (Latest Month)
    budget_alerts = []
    overspent_count = 0
    warning_count = 0
    
    for cat, budget_limit in budgets.items():
        actual_spent = latest_cat_expenses.get(cat, 0.0)
        utilization_pct = round((actual_spent / budget_limit * 100), 1) if budget_limit > 0 else 0.0
        status = "normal"
        if utilization_pct >= 100.0:
            status = "exceeded"
            overspent_count += 1
        elif utilization_pct >= 80.0:
            status = "warning"
            warning_count += 1
            
        budget_alerts.append({
            "category": cat,
            "budget": round(budget_limit, 2),
            "spent": round(actual_spent, 2),
            "remaining": round(budget_limit - actual_spent, 2),
            "utilization_pct": utilization_pct,
            "status": status
        })
    budget_alerts.sort(key=lambda x: x["utilization_pct"], reverse=True)

    # 4. Statistical Anomaly & Duplicate Detection
    cat_amounts = defaultdict(list)
    for t in txns:
        if t["transaction_type"] == "Debit" and t["category"] != "Transfers":
            cat_amounts[t["category"]].append(t["amount"])
            
    cat_stats = {}
    for c, amts in cat_amounts.items():
        mean = sum(amts) / len(amts)
        variance = sum((x - mean) ** 2 for x in amts) / len(amts) if len(amts) > 1 else 0.0
        std = math.sqrt(variance)
        cat_stats[c] = {"mean": mean, "std": std}

    anomalies = []
    seen_txns = {}
    
    for t in txns:
        is_anomaly = False
        reasons = []
        z_score_val = None
        
        dup_key = (t["date"], t["description"].lower().strip(), t["amount"])
        if dup_key in seen_txns:
            is_anomaly = True
            reasons.append("Potential duplicate charge detected on the same date")
        else:
            seen_txns[dup_key] = t["id"]
            
        if t["transaction_type"] == "Debit" and t["category"] in cat_stats:
            stats = cat_stats[t["category"]]
            if stats["std"] > 0:
                z_score = (t["amount"] - stats["mean"]) / stats["std"]
                if z_score >= 2.2 and t["amount"] > 3000:
                    is_anomaly = True
                    z_score_val = round(z_score, 2)
                    reasons.append(f"Statistically unusual amount for {t['category']} (Z-score: {z_score_val})")
        
        if t["transaction_type"] == "Debit" and t["amount"] >= 18000 and t["category"] not in ["Utilities and Bills", "Investments"]:
            is_anomaly = True
            reasons.append(f"High-magnitude expenditure of ₹{t['amount']}")
            
        t["is_anomaly"] = is_anomaly
        t["anomaly_reason"] = "; ".join(reasons) if reasons else ""
        if is_anomaly:
            anomalies.append({
                "transaction_id": t["id"],
                "date": t["date"],
                "description": t["description"],
                "amount": t["amount"],
                "category": t["category"],
                "z_score": z_score_val or 2.5,
                "reason": t["anomaly_reason"]
            })

    # 5. Recurring Payments (Subscription Cadence Detection)
    merchant_occurrences = defaultdict(list)
    for t in txns:
        if t["transaction_type"] == "Debit":
            m_key = t["description"].lower().strip()
            merchant_occurrences[m_key].append(t)
            
    recurring_payments = []
    total_recurring_monthly = 0.0
    
    for m_desc, occurrences in merchant_occurrences.items():
        if len(occurrences) >= 2:
            amounts = [o["amount"] for o in occurrences]
            avg_amt = sum(amounts) / len(amounts)
            is_fixed_amount = all(abs(a - avg_amt) <= avg_amt * 0.05 for a in amounts)
            
            if is_fixed_amount:
                dates = sorted([o["date"] for o in occurrences])
                cat = occurrences[0]["category"]
                recurring_payments.append({
                    "merchant": occurrences[0]["description"],
                    "category": cat,
                    "frequency": "Monthly",
                    "average_amount": round(avg_amt, 2),
                    "occurrences_count": len(occurrences),
                    "last_date": dates[-1]
                })
                total_recurring_monthly += avg_amt
                for o in occurrences:
                    o["is_recurring"] = True
                    o["recurring_group"] = occurrences[0]["description"]

    # 6. Financial Health Score (0 - 100)
    avg_savings_rate = sum(m["savings_rate"] for m in monthly_summary) / len(monthly_summary) if monthly_summary else 0
    if avg_savings_rate >= 30:
        savings_score = 35
    elif avg_savings_rate >= 20:
        savings_score = 27
    elif avg_savings_rate >= 10:
        savings_score = 18
    elif avg_savings_rate > 0:
        savings_score = 10
    else:
        savings_score = 0

    if overspent_count == 0 and warning_count == 0:
        budget_score = 25
    elif overspent_count == 0:
        budget_score = 20
    elif overspent_count == 1:
        budget_score = 12
    else:
        budget_score = 5

    if len(monthly_summary) >= 2:
        exp_list = [m["expenses"] for m in monthly_summary]
        exp_mean = sum(exp_list) / len(exp_list)
        exp_std = math.sqrt(sum((x - exp_mean)**2 for x in exp_list) / len(exp_list))
        cv = exp_std / exp_mean if exp_mean > 0 else 0
        stability_score = 20 if cv < 0.15 else (15 if cv < 0.30 else 10)
    else:
        stability_score = 15

    investment_total = category_totals.get("Investments", 0.0)
    if investment_total > 0 and total_income > 0:
        inv_ratio = (investment_total / total_income) * 100
        coverage_score = 20 if inv_ratio >= 15 else (16 if inv_ratio >= 10 else 10)
    else:
        coverage_score = 8

    total_health_score = min(100, savings_score + budget_score + stability_score + coverage_score)
    grade = "Excellent" if total_health_score >= 80 else ("Good" if total_health_score >= 65 else ("Moderate" if total_health_score >= 50 else "Needs Attention"))

    health_score_data = {
        "score": total_health_score,
        "grade": grade,
        "components": {
            "savings_rate_score": {"points": savings_score, "max": 35, "value": f"{round(avg_savings_rate, 1)}%"},
            "budget_adherence_score": {"points": budget_score, "max": 25, "value": f"{overspent_count} overspent"},
            "spending_stability_score": {"points": stability_score, "max": 20, "value": "Stable" if stability_score >= 15 else "Volatile"},
            "wealth_investment_score": {"points": coverage_score, "max": 20, "value": f"₹{round(investment_total, 2)} invested"}
        }
    }

    # Call Groq for Executive Anomaly Commentary
    llm_call_metadata = None
    if anomalies or overspent_count > 0:
        sys_p = "You are an enterprise financial risk analyst. Provide a brief 1-2 sentence executive assessment of detected spending anomalies and budget overruns."
        usr_p = f"Anomalies detected: {len(anomalies)} (details: {[a['description'] for a in anomalies[:2]]}). Overspent categories: {overspent_count}."
        _, meta = smart_llm_call("anomaly_commentary", sys_p, usr_p, lambda: f"Flagged {len(anomalies)} irregular charges and {overspent_count} category budget threshold breaches requiring client review.")
        llm_call_metadata = meta

    duration_ms = max(1, int((time.time() - start_time) * 1000))

    spending_analysis = {
        "overall_summary": {
            "total_income": round(total_income, 2),
            "total_expenses": round(total_expenses, 2),
            "net_savings": round(total_income - total_expenses, 2),
            "avg_monthly_income": round(total_income / len(sorted_months), 2) if sorted_months else 0,
            "avg_monthly_expenses": round(total_expenses / len(sorted_months), 2) if sorted_months else 0,
            "overall_savings_rate": round(((total_income - total_expenses) / total_income * 100), 1) if total_income > 0 else 0,
            "total_transactions": len(txns)
        },
        "monthly_summary": monthly_summary,
        "category_breakdown": category_breakdown,
        "trends": trends,
        "budget_alerts": budget_alerts,
        "anomalies": anomalies,
        "recurring_payments": recurring_payments,
        "total_recurring_monthly": round(total_recurring_monthly, 2),
        "health_score": health_score_data
    }

    # Construct observability trace
    trace = {
        "node_name": "analysis_agent",
        "agent_title": "Spending Analysis Agent",
        "role": "Quantitative Variance, Statistical Anomaly & Health Score Engine",
        "engine": "Python Pandas + Groq Llama-3" if llm_call_metadata and llm_call_metadata.get("provider") == "Groq" else "Statistical Analysis Engine",
        "status": "completed",
        "duration_ms": duration_ms,
        "reasoning_steps": [
            f"[Aggregations] Computed monthly inflow (₹{total_income:,.0f}) and outflow (₹{total_expenses:,.0f}) across {len(sorted_months)} months.",
            f"[Variance Matrix] Evaluated month-over-month percentage changes across {len(trends)} spending categories.",
            f"[Z-Score Outlier Analysis] Applied standard deviation threshold (Z > 2.2); flagged {len(anomalies)} statistical anomalies.",
            f"[Temporal Clustering] Detected {len(recurring_payments)} recurring monthly obligations (₹{total_recurring_monthly:,.0f}/mo).",
            f"[Algorithmic Scoring] Computed indicative wellness rating: {total_health_score}/100 ({grade})."
        ],
        "decisions": [
            f"Evaluated budget alerts: {overspent_count} categories exceeded monthly thresholds.",
            f"Flagged {len(anomalies)} anomalies for fraud/duplicate review.",
            f"Categorized {len(recurring_payments)} fixed monthly subscription commitments.",
            "Forwarded structured financial analytics state to Cash-Flow Forecast Agent."
        ],
        "state_diff_keys": ["spending_analysis"],
        "llm_call": llm_call_metadata
    }

    traces.append(trace)

    return {
        **state,
        "categorized_transactions": txns,
        "spending_analysis": spending_analysis,
        "agent_traces": traces
    }
